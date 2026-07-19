import type { SandboxRef } from '../docker/sandbox.port.js';
import type { PreparedWorktree } from '../git/worktree.service.js';
import type { PreviewTunnelRef } from '../tunnel/preview-tunnel.port.js';
import { InMemorySessionWorkspaceStore, type SessionWorkspaceStore } from './session-workspace.store.js';

export interface SessionWorkspace extends PreparedWorktree {
  sessionId: string;
  projectKey: string;
  sandboxRef?: SandboxRef;
  tunnelRef?: PreviewTunnelRef;
  previewUrl?: string;
}

export class SessionRegistry {
  private readonly workspaces = new Map<string, SessionWorkspace>();
  private readonly persistedWorkspaces = new Map<string, SessionWorkspace>();
  private operation = Promise.resolve();

  constructor(private readonly store: SessionWorkspaceStore = new InMemorySessionWorkspaceStore()) {}

  async restore(): Promise<SessionWorkspace[]> {
    return this.withLock(async () => {
      const storedWorkspaces = await this.store.load();
      this.workspaces.clear();
      this.persistedWorkspaces.clear();

      for (const workspace of storedWorkspaces) {
        this.workspaces.set(workspace.sessionId, workspace);
        this.persistedWorkspaces.set(workspace.sessionId, workspace);
      }

      return storedWorkspaces;
    });
  }

  async register(workspace: SessionWorkspace): Promise<void> {
    await this.withLock(async () => {
      const previousWorkspace = this.persistedWorkspaces.get(workspace.sessionId);
      const wasActive = this.workspaces.has(workspace.sessionId);
      this.workspaces.set(workspace.sessionId, workspace);
      this.persistedWorkspaces.set(workspace.sessionId, workspace);

      try {
        await this.persist();
      } catch (error) {
        if (previousWorkspace) {
          this.persistedWorkspaces.set(workspace.sessionId, previousWorkspace);
          if (wasActive) {
            this.workspaces.set(workspace.sessionId, previousWorkspace);
          } else {
            this.workspaces.delete(workspace.sessionId);
          }
        } else {
          this.workspaces.delete(workspace.sessionId);
          this.persistedWorkspaces.delete(workspace.sessionId);
        }
        throw error;
      }
    });
  }

  async update(workspace: SessionWorkspace): Promise<void> {
    await this.withLock(async () => {
      const previousWorkspace = this.persistedWorkspaces.get(workspace.sessionId);
      if (!previousWorkspace) {
        throw new Error(`Session ${workspace.sessionId} is not persisted on this agent.`);
      }

      const wasActive = this.workspaces.has(workspace.sessionId);
      this.persistedWorkspaces.set(workspace.sessionId, workspace);
      if (wasActive) {
        this.workspaces.set(workspace.sessionId, workspace);
      }

      try {
        await this.persist();
      } catch (error) {
        this.persistedWorkspaces.set(workspace.sessionId, previousWorkspace);
        if (wasActive) {
          this.workspaces.set(workspace.sessionId, previousWorkspace);
        }
        throw error;
      }
    });
  }

  find(sessionId: string): SessionWorkspace | null {
    return this.workspaces.get(sessionId) ?? null;
  }

  findPersisted(sessionId: string): SessionWorkspace | null {
    return this.persistedWorkspaces.get(sessionId) ?? null;
  }

  suspend(sessionId: string): void {
    this.workspaces.delete(sessionId);
  }

  async unregister(sessionId: string): Promise<SessionWorkspace | null> {
    return this.withLock(async () => {
      const workspace = this.persistedWorkspaces.get(sessionId) ?? null;

      if (!workspace) {
        return null;
      }

      const wasActive = this.workspaces.has(sessionId);
      this.workspaces.delete(sessionId);
      this.persistedWorkspaces.delete(sessionId);

      try {
        await this.persist();
      } catch (error) {
        this.persistedWorkspaces.set(sessionId, workspace);
        if (wasActive) {
          this.workspaces.set(sessionId, workspace);
        }
        throw error;
      }

      return workspace;
    });
  }

  private persist(): Promise<void> {
    return this.store.save([...this.persistedWorkspaces.values()]);
  }

  private async withLock<T>(operation: () => Promise<T>): Promise<T> {
    const previousOperation = this.operation;
    let release!: () => void;
    this.operation = new Promise<void>((resolve) => {
      release = resolve;
    });

    await previousOperation.catch(() => undefined);

    try {
      return await operation();
    } finally {
      release();
    }
  }
}
