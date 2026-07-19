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

    if (previousSocketId && previousSocketId !== socketId) {
      throw new Error(`Agent ${agentId} is already connected.`);
    }

    const previousAgentId = this.agentIdBySocketId.get(socketId);

    if (previousAgentId && previousAgentId !== agentId) {
      throw new Error(`Socket ${socketId} is already registered to agent ${previousAgentId}.`);
    }

    for (const project of snapshot.projects) {
      const conflictingAgent = [...this.snapshotByAgentId.values()].find(
        (registeredSnapshot) =>
          registeredSnapshot.agentId !== agentId &&
          registeredSnapshot.projects.some((registeredProject) => registeredProject.key === project.key),
      );

      if (conflictingAgent) {
        throw new Error(`Agent project key ${project.key} is already connected by ${conflictingAgent.agentId}.`);
      }
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

  findSocketId(agentIdOrProjectKey: string): string | null {
    return this.socketIdByAgentId.get(agentIdOrProjectKey) ?? this.findSocketIdByProjectKey(agentIdOrProjectKey);
  }

  findSnapshot(agentId: string): ConnectedAgentSnapshot | null {
    const snapshot = this.snapshotByAgentId.get(agentId);
    return snapshot ? cloneSnapshot(snapshot) : null;
  }

  findSnapshotBySocketId(socketId: string): ConnectedAgentSnapshot | null {
    const agentId = this.findAgentId(socketId);
    return agentId ? this.findSnapshot(agentId) : null;
  }

  listSnapshots(): ConnectedAgentSnapshot[] {
    return [...this.snapshotByAgentId.values()].map(cloneSnapshot);
  }

  private findSocketIdByProjectKey(projectKey: string): string | null {
    for (const snapshot of this.snapshotByAgentId.values()) {
      if (!snapshot.projects.some((project) => project.key === projectKey)) {
        continue;
      }

      return this.socketIdByAgentId.get(snapshot.agentId) ?? null;
    }

    return null;
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
