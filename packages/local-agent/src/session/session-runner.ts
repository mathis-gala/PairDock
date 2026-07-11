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
    const existingWorkspace = this.sessionRegistry.find(command.sessionId);

    if (existingWorkspace?.sandboxRef && existingWorkspace.tunnelRef) {
      return existingWorkspace;
    }

    if (existingWorkspace) {
      throw new Error(`Session ${command.sessionId} has incomplete cleanup and cannot be prepared again yet.`);
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
      this.sessionRegistry.register(workspace);

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
      this.sessionRegistry.register(workspace);

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
        previewConfig,
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

      this.sessionRegistry.register(workspace);
      return workspace;
    } catch (error) {
      if (!workspace) {
        throw error;
      }

      const cleanupErrors = await this.cleanupWorkspace(workspace, 'delete-local');

      if (cleanupErrors.length === 0) {
        this.sessionRegistry.unregister(command.sessionId);
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
    const workspace = this.sessionRegistry.find(command.sessionId);

    if (!workspace) {
      return { cleaned: true };
    }

    const cleanupErrors = await this.cleanupWorkspace(workspace, command.payload.mode);

    if (cleanupErrors.length > 0) {
      throw new AggregateError(cleanupErrors, cleanupErrors.map(errorMessage).join('; '));
    }

    this.sessionRegistry.unregister(command.sessionId);
    return { cleaned: true };
  }

  private async cleanupWorkspace(
    workspace: SessionWorkspace,
    mode: SessionCloseCommandEnvelope['payload']['mode'],
  ): Promise<unknown[]> {
    const previewConfig = this.previewConfigs[workspace.projectKey];
    const errors: unknown[] = [];
    let remainingWorkspace = workspace;

    if (remainingWorkspace.tunnelRef) {
      try {
        await this.previewTunnelPort.close(remainingWorkspace.tunnelRef, previewConfig);
        const { previewUrl: _previewUrl, tunnelRef: _tunnelRef, ...withoutTunnel } = remainingWorkspace;
        remainingWorkspace = withoutTunnel;
        this.sessionRegistry.register(remainingWorkspace);
      } catch (error) {
        errors.push(error);
      }
    }

    if (remainingWorkspace.sandboxRef) {
      try {
        await this.sandboxPort.stop(remainingWorkspace.sandboxRef, previewConfig);
        const { sandboxRef: _sandboxRef, ...withoutSandbox } = remainingWorkspace;
        remainingWorkspace = withoutSandbox;
        this.sessionRegistry.register(remainingWorkspace);
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
      branchName: await this.worktreeService.pushBranch(workspace),
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
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
