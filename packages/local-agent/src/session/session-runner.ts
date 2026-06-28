import type { SessionCloseCommandEnvelope, SessionPrepareCommandEnvelope } from '@pairdock/shared-contracts';
import { WorktreeService } from '../git/worktree.service.js';
import { SessionRegistry, type SessionWorkspace } from './session-registry.js';

export interface SessionRunnerConfig {
  projectPaths?: Record<string, string>;
}

export interface SessionCloseResult {
  cleaned: boolean;
}

export class SessionRunner {
  private readonly sessionRegistry: SessionRegistry;
  private readonly worktreeService: WorktreeService;
  private readonly projectPaths: Record<string, string>;

  constructor(
    config: SessionRunnerConfig = {},
    dependencies: {
      sessionRegistry?: SessionRegistry;
      worktreeService?: WorktreeService;
    } = {},
  ) {
    this.projectPaths = config.projectPaths ?? {};
    this.sessionRegistry = dependencies.sessionRegistry ?? new SessionRegistry();
    this.worktreeService = dependencies.worktreeService ?? new WorktreeService();
  }

  async prepare(command: SessionPrepareCommandEnvelope): Promise<SessionWorkspace> {
    const repositoryPath = this.projectPaths[command.payload.projectKey];

    if (!repositoryPath) {
      throw new Error(`No local repository path is configured for project key ${command.payload.projectKey}.`);
    }

    const preparedWorktree = await this.worktreeService.prepare(command, repositoryPath);
    const workspace: SessionWorkspace = {
      ...preparedWorktree,
      projectKey: command.payload.projectKey,
      sessionId: command.sessionId,
    };

    this.sessionRegistry.register(workspace);
    return workspace;
  }

  async close(command: SessionCloseCommandEnvelope): Promise<SessionCloseResult> {
    const workspace = this.sessionRegistry.unregister(command.sessionId);

    if (!workspace) {
      return { cleaned: true };
    }

    await this.worktreeService.cleanup(workspace, command.payload.mode);
    return { cleaned: true };
  }

  findWorkspace(sessionId: string): SessionWorkspace | null {
    return this.sessionRegistry.find(sessionId);
  }
}
