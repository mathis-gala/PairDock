import type { PreparedWorktree } from '../git/worktree.service.js';

export interface SessionWorkspace extends PreparedWorktree {
  sessionId: string;
  projectKey: string;
}

export class SessionRegistry {
  private readonly workspaces = new Map<string, SessionWorkspace>();

  register(workspace: SessionWorkspace): void {
    this.workspaces.set(workspace.sessionId, workspace);
  }

  find(sessionId: string): SessionWorkspace | null {
    return this.workspaces.get(sessionId) ?? null;
  }

  unregister(sessionId: string): SessionWorkspace | null {
    const workspace = this.workspaces.get(sessionId) ?? null;

    if (workspace) {
      this.workspaces.delete(sessionId);
    }

    return workspace;
  }
}
