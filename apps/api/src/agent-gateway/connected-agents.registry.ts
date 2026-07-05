import { Injectable } from '@nestjs/common';
import type { AgentConnectedEventEnvelope } from '@pairdock/shared-contracts';

export type ConnectedAgentSnapshot = AgentConnectedEventEnvelope['payload'];

@Injectable()
export class ConnectedAgentsRegistry {
  private readonly agentIdBySocketId = new Map<string, string>();
  private readonly socketIdByAgentId = new Map<string, string>();
  private readonly snapshotByAgentId = new Map<string, ConnectedAgentSnapshot>();

  register(socketId: string, input: ConnectedAgentSnapshot | string): void {
    const snapshot = typeof input === 'string' ? { agentId: input, capabilities: [], models: [], projects: [] } : input;
    const agentId = snapshot.agentId;
    const previousSocketId = this.socketIdByAgentId.get(agentId);

    if (previousSocketId) {
      this.agentIdBySocketId.delete(previousSocketId);
    }

    const previousAgentId = this.agentIdBySocketId.get(socketId);

    if (previousAgentId) {
      this.socketIdByAgentId.delete(previousAgentId);
    }

    this.agentIdBySocketId.set(socketId, agentId);
    this.socketIdByAgentId.set(agentId, socketId);
    this.snapshotByAgentId.set(agentId, {
      agentId,
      capabilities: [...snapshot.capabilities],
      models: snapshot.models.map((model) => ({ ...model })),
      projects: snapshot.projects.map((project) => ({
        ...project,
        models: project.models ? [...project.models] : undefined,
      })),
    });
  }

  unregister(socketId: string): void {
    const agentId = this.agentIdBySocketId.get(socketId);

    if (!agentId) {
      return;
    }

    this.agentIdBySocketId.delete(socketId);
    this.socketIdByAgentId.delete(agentId);
    this.snapshotByAgentId.delete(agentId);
  }

  findAgentId(socketId: string): string | null {
    return this.agentIdBySocketId.get(socketId) ?? null;
  }

  findSocketId(agentId: string): string | null {
    return this.socketIdByAgentId.get(agentId) ?? null;
  }

  findSnapshot(agentId: string): ConnectedAgentSnapshot | null {
    const snapshot = this.snapshotByAgentId.get(agentId);
    return snapshot ? cloneSnapshot(snapshot) : null;
  }

  listSnapshots(): ConnectedAgentSnapshot[] {
    return [...this.snapshotByAgentId.values()].map(cloneSnapshot);
  }
}

function cloneSnapshot(snapshot: ConnectedAgentSnapshot): ConnectedAgentSnapshot {
  return {
    agentId: snapshot.agentId,
    capabilities: [...snapshot.capabilities],
    models: snapshot.models.map((model) => ({ ...model })),
    projects: snapshot.projects.map((project) => ({
      ...project,
      models: project.models ? [...project.models] : undefined,
    })),
  };
}
