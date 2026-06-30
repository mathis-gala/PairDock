import type { SessionStatus } from '@pairdock/domain';
import type { SessionCloseCommandEnvelope, SessionPrepareCommandEnvelope } from '@pairdock/shared-contracts';
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
  private readonly sessionRegistry: SessionRegistry;
  private readonly worktreeService: WorktreeService;
  private readonly sandboxPort: SandboxPort;
  private readonly healthcheckService: HealthcheckService;
  private readonly previewTunnelPort: PreviewTunnelPort;
  private readonly projectPaths: Record<string, string>;
  private readonly previewConfigs: Record<string, ProjectPreviewConfig>;

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
    this.sessionRegistry = dependencies.sessionRegistry ?? new SessionRegistry();
    this.worktreeService = dependencies.worktreeService ?? new WorktreeService();
    this.sandboxPort = dependencies.sandboxPort ?? new DockerSandboxAdapter();
    this.healthcheckService = dependencies.healthcheckService ?? new HealthcheckService();
    this.previewTunnelPort = dependencies.previewTunnelPort ?? new CloudflarePreviewTunnelAdapter();
  }

  async prepare(command: SessionPrepareCommandEnvelope, hooks: SessionPrepareHooks = {}): Promise<SessionWorkspace> {
    const repositoryPath = this.projectPaths[command.payload.projectKey];

    if (!repositoryPath) {
      throw new Error(`No local repository path is configured for project key ${command.payload.projectKey}.`);
    }

    const previewConfig = this.previewConfigs[command.payload.projectKey];
    const onProgress = hooks.onProgress;

    await onProgress?.('WORKTREE_CREATING');
    const preparedWorktree = await this.worktreeService.prepare(command, repositoryPath);
    const baseWorkspace: SessionWorkspace = {
      ...preparedWorktree,
      projectKey: command.payload.projectKey,
      sessionId: command.sessionId,
    };

    this.sessionRegistry.register(baseWorkspace);

    await onProgress?.('DOCKER_STARTING');
    const sandboxRef = await this.sandboxPort.start({
      branchName: preparedWorktree.branchName,
      modelId: command.payload.modelId,
      previewConfig,
      projectKey: command.payload.projectKey,
      repositoryPath: preparedWorktree.repositoryPath,
      sessionId: command.sessionId,
      worktreePath: preparedWorktree.worktreePath,
    });

    await onProgress?.('PREVIEW_STARTING');
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
    const workspace: SessionWorkspace = {
      ...baseWorkspace,
      previewUrl: tunnelRef.publicUrl,
      sandboxRef,
      tunnelRef,
    };

    this.sessionRegistry.register(workspace);
    return workspace;
  }

  async close(command: SessionCloseCommandEnvelope): Promise<SessionCloseResult> {
    const workspace = this.sessionRegistry.unregister(command.sessionId);

    if (!workspace) {
      return { cleaned: true };
    }

    const previewConfig = this.previewConfigs[workspace.projectKey];

    if (workspace.tunnelRef) {
      await this.previewTunnelPort.close(workspace.tunnelRef, previewConfig);
    }

    if (workspace.sandboxRef) {
      await this.sandboxPort.stop(workspace.sandboxRef, previewConfig);
    }

    await this.worktreeService.cleanup(workspace, command.payload.mode);
    return { cleaned: true };
  }

  findWorkspace(sessionId: string): SessionWorkspace | null {
    return this.sessionRegistry.find(sessionId);
  }
}
