import type { SessionStatus } from '@pairdock/domain';
import type {
  GitPushBranchCommandEnvelope,
  SessionCloseCommandEnvelope,
  SessionPrepareCommandEnvelope,
} from '@pairdock/shared-contracts';
import { DockerSandboxAdapter } from '../docker/docker-sandbox.adapter.js';
import { HealthcheckService } from '../docker/healthcheck.service.js';
import type { ProjectPreviewConfig, SandboxPort } from '../docker/sandbox.port.js';
import { WorktreeService } from '../git/worktree.service.js';
import { CloudflarePreviewTunnelAdapter } from '../tunnel/cloudflare-preview-tunnel.adapter.js';
import type { PreviewTunnelPort } from '../tunnel/preview-tunnel.port.js';
import { SessionRegistry, type SessionWorkspace } from './session-registry.js';

export interface SessionRunnerConfig {
  projectPaths?: Record<string, string>;
  previewConfigs?: Record<string, ProjectPreviewConfig>;
  logger?: {
    info(message: string): void;
  };
}

export interface SessionPrepareHooks {
  onProgress?: (
    status: Extract<SessionStatus, 'WORKTREE_CREATING' | 'DOCKER_STARTING' | 'PREVIEW_STARTING'>,
    message?: string,
  ) => Promise<void> | void;
}

export interface SessionCloseResult {
  cleaned: boolean;
}

export interface SessionRecoveryResult {
  recoveredSessionIds: string[];
  failures: Array<{ sessionId: string; message: string }>;
}

export class SessionRunner {
  private readonly sessionOperations = new Map<string, Promise<void>>();
  private readonly sessionRegistry: SessionRegistry;
  private readonly worktreeService: WorktreeService;
  private readonly sandboxPort: SandboxPort;
  private readonly healthcheckService: HealthcheckService;
  private readonly previewTunnelPort: PreviewTunnelPort;
  private readonly projectPaths: Record<string, string>;
  private readonly previewConfigs: Record<string, ProjectPreviewConfig>;
  private readonly logger: { info(message: string): void } | undefined;

  constructor(
    config: SessionRunnerConfig = {},
    dependencies: {
      sessionRegistry?: SessionRegistry;
      worktreeService?: WorktreeService;
      sandboxPort?: SandboxPort;
      healthcheckService?: HealthcheckService;
      previewTunnelPort?: PreviewTunnelPort;
    } = {},
  ) {
    this.projectPaths = config.projectPaths ?? {};
    this.previewConfigs = config.previewConfigs ?? {};
    this.logger = config.logger;
    this.sessionRegistry = dependencies.sessionRegistry ?? new SessionRegistry();
    this.worktreeService = dependencies.worktreeService ?? new WorktreeService();
    this.sandboxPort = dependencies.sandboxPort ?? new DockerSandboxAdapter();
    this.healthcheckService = dependencies.healthcheckService ?? new HealthcheckService();
    this.previewTunnelPort = dependencies.previewTunnelPort ?? new CloudflarePreviewTunnelAdapter();
  }

  async prepare(command: SessionPrepareCommandEnvelope, hooks: SessionPrepareHooks = {}): Promise<SessionWorkspace> {
    return this.withSessionLock(command.sessionId, () => this.prepareUnlocked(command, hooks));
  }

  private async prepareUnlocked(
    command: SessionPrepareCommandEnvelope,
    hooks: SessionPrepareHooks,
  ): Promise<SessionWorkspace> {
    const activeWorkspace = this.sessionRegistry.find(command.sessionId);

    if (activeWorkspace?.sandboxRef && activeWorkspace.tunnelRef) {
      return activeWorkspace;
    }

    const persistedWorkspace = this.sessionRegistry.findPersisted(command.sessionId);
    if (persistedWorkspace) {
      throw new Error(
        `Session ${command.sessionId} could not be recovered and must be closed before preparing it again.`,
      );
    }

    const repositoryPath = this.projectPaths[command.payload.projectKey];

    if (!repositoryPath) {
      throw new Error(`No local repository path is configured for project key ${command.payload.projectKey}.`);
    }

    const previewConfig = this.previewConfigs[command.payload.projectKey];
    const onProgress = hooks.onProgress;
    let workspace: SessionWorkspace | null = null;

    try {
      await onProgress?.('WORKTREE_CREATING');
      const preparedWorktree = await this.worktreeService.prepare(command, repositoryPath);
      workspace = {
        ...preparedWorktree,
        projectKey: command.payload.projectKey,
        sessionId: command.sessionId,
      };
      await this.sessionRegistry.register(workspace);

      await onProgress?.('DOCKER_STARTING');
      this.logger?.info(`Starting Docker sandbox for session ${command.sessionId}.`);
      const sandboxRef = await this.sandboxPort.start({
        branchName: preparedWorktree.branchName,
        modelId: command.payload.modelId,
        previewConfig,
        projectKey: command.payload.projectKey,
        repositoryPath: preparedWorktree.repositoryPath,
        sessionId: command.sessionId,
        worktreePath: preparedWorktree.worktreePath,
      });
      workspace = { ...workspace, sandboxRef };
      await this.sessionRegistry.register(workspace);

      await onProgress?.('PREVIEW_STARTING');
      this.logger?.info(`Waiting for preview healthcheck for session ${command.sessionId}.`);
      const healthcheck = await this.healthcheckService.waitUntilReady({
        intervalMs: previewConfig?.healthcheckIntervalMs,
        sandboxPort: this.sandboxPort,
        sandboxRef,
        timeoutMs: previewConfig?.healthcheckTimeoutMs,
      });
      const tunnelRef = await this.previewTunnelPort.open({
        localUrl: healthcheck.url,
        previewConfig: sandboxRef.previewConfig ?? previewConfig,
        projectKey: command.payload.projectKey,
        sessionId: command.sessionId,
        worktreePath: preparedWorktree.worktreePath,
      });
      this.logger?.info(`Preview tunnel ready for session ${command.sessionId}: ${tunnelRef.publicUrl}.`);
      workspace = {
        ...workspace,
        previewUrl: tunnelRef.publicUrl,
        tunnelRef,
      };

      await this.sessionRegistry.register(workspace);
      return workspace;
    } catch (error) {
      if (!workspace) {
        throw error;
      }

      const cleanupErrors = await this.cleanupWorkspace(workspace, 'delete-local');

      if (cleanupErrors.length === 0) {
        await this.sessionRegistry.unregister(command.sessionId);
        throw error;
      }

      throw new AggregateError(
        [error, ...cleanupErrors],
        `${errorMessage(error)} Cleanup also failed: ${cleanupErrors.map(errorMessage).join('; ')}`,
      );
    }
  }

  async close(command: SessionCloseCommandEnvelope): Promise<SessionCloseResult> {
    return this.withSessionLock(command.sessionId, () => this.closeUnlocked(command));
  }

  private async closeUnlocked(command: SessionCloseCommandEnvelope): Promise<SessionCloseResult> {
    const workspace = this.sessionRegistry.findPersisted(command.sessionId);

    if (!workspace) {
      return { cleaned: true };
    }

    const cleanupErrors = await this.cleanupWorkspace(workspace, command.payload.mode);

    if (cleanupErrors.length > 0) {
      throw new AggregateError(cleanupErrors, cleanupErrors.map(errorMessage).join('; '));
    }

    await this.sessionRegistry.unregister(command.sessionId);
    return { cleaned: true };
  }

  private async cleanupWorkspace(
    workspace: SessionWorkspace,
    mode: SessionCloseCommandEnvelope['payload']['mode'],
  ): Promise<unknown[]> {
    const previewConfig = this.previewConfigs[workspace.projectKey];
    const resolvedPreviewConfig = workspace.sandboxRef?.previewConfig ?? previewConfig;
    const errors: unknown[] = [];
    let remainingWorkspace = workspace;

    if (remainingWorkspace.tunnelRef) {
      try {
        await this.previewTunnelPort.close(remainingWorkspace.tunnelRef, resolvedPreviewConfig);
        const { previewUrl: _previewUrl, tunnelRef: _tunnelRef, ...withoutTunnel } = remainingWorkspace;
        remainingWorkspace = withoutTunnel;
        await this.sessionRegistry.update(remainingWorkspace);
      } catch (error) {
        errors.push(error);
      }
    }

    if (remainingWorkspace.sandboxRef) {
      try {
        await this.sandboxPort.stop(remainingWorkspace.sandboxRef, resolvedPreviewConfig);
        const { sandboxRef: _sandboxRef, ...withoutSandbox } = remainingWorkspace;
        remainingWorkspace = withoutSandbox;
        await this.sessionRegistry.update(remainingWorkspace);
      } catch (error) {
        errors.push(error);
      }
    }

    try {
      await this.worktreeService.cleanup(remainingWorkspace, mode);
    } catch (error) {
      errors.push(error);
    }

    return errors;
  }

  async pushBranch(command: GitPushBranchCommandEnvelope): Promise<{ branchName: string }> {
    return this.withSessionLock(command.sessionId, () => this.pushBranchUnlocked(command));
  }

  private async pushBranchUnlocked(command: GitPushBranchCommandEnvelope): Promise<{ branchName: string }> {
    const workspace = this.sessionRegistry.find(command.sessionId);

    if (!workspace) {
      throw new Error(`Session ${command.sessionId} is not prepared on this agent.`);
    }

    return {
      branchName: await this.worktreeService.pushBranch(workspace, command.payload.commitMessage),
    };
  }

  private async withSessionLock<T>(sessionId: string, operation: () => Promise<T>): Promise<T> {
    const previousOperation = this.sessionOperations.get(sessionId) ?? Promise.resolve();
    let release!: () => void;
    const currentOperation = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.sessionOperations.set(sessionId, currentOperation);
    await previousOperation.catch(() => undefined);

    try {
      return await operation();
    } finally {
      release();

      if (this.sessionOperations.get(sessionId) === currentOperation) {
        this.sessionOperations.delete(sessionId);
      }
    }
  }

  findWorkspace(sessionId: string): SessionWorkspace | null {
    return this.sessionRegistry.find(sessionId);
  }

  async restore(): Promise<SessionRecoveryResult> {
    const workspaces = await this.sessionRegistry.restore();
    const recoveredSessionIds: string[] = [];
    const failures: SessionRecoveryResult['failures'] = [];

    for (const workspace of workspaces) {
      try {
        if (!workspace.sandboxRef || !workspace.tunnelRef || !workspace.previewUrl) {
          throw new Error('Persisted workspace is incomplete.');
        }

        const configuredRepositoryPath = this.projectPaths[workspace.projectKey];
        if (!configuredRepositoryPath) {
          throw new Error(`Project ${workspace.projectKey} is no longer configured on this agent.`);
        }

        await this.worktreeService.validatePrepared(workspace, configuredRepositoryPath);

        const healthcheck = await this.sandboxPort.check(workspace.sandboxRef);
        if (!healthcheck.ready) {
          throw new Error(healthcheck.message ?? 'Persisted preview is not reachable.');
        }

        recoveredSessionIds.push(workspace.sessionId);
      } catch (error) {
        this.sessionRegistry.suspend(workspace.sessionId);
        failures.push({ sessionId: workspace.sessionId, message: errorMessage(error) });
      }
    }

    return { recoveredSessionIds, failures };
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
