import type { SessionWorkspace } from './session-registry.js';

export interface SessionWorkspaceStore {
  load(): Promise<SessionWorkspace[]>;
  save(workspaces: SessionWorkspace[]): Promise<void>;
}

export class InMemorySessionWorkspaceStore implements SessionWorkspaceStore {
  private workspaces: SessionWorkspace[] = [];

  async load(): Promise<SessionWorkspace[]> {
    return structuredClone(this.workspaces);
  }

  async save(workspaces: SessionWorkspace[]): Promise<void> {
    this.workspaces = structuredClone(workspaces);
  }
}
