import { Injectable } from '@nestjs/common';

@Injectable()
export class ConnectedAgentsRegistry {
  private readonly agentIdBySocketId = new Map<string, string>();
  private readonly socketIdByAgentId = new Map<string, string>();

  register(socketId: string, agentId: string): void {
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
  }

  unregister(socketId: string): void {
    const agentId = this.agentIdBySocketId.get(socketId);

    if (!agentId) {
      return;
    }

    this.agentIdBySocketId.delete(socketId);
    this.socketIdByAgentId.delete(agentId);
  }

  findAgentId(socketId: string): string | null {
    return this.agentIdBySocketId.get(socketId) ?? null;
  }

  findSocketId(agentId: string): string | null {
    return this.socketIdByAgentId.get(agentId) ?? null;
  }
}
