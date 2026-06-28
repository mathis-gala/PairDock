import { Inject, Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  type AgentCommandEnvelope,
  type AgentConnectedEventEnvelope,
  type AgentEventEnvelope,
  agentEventEnvelopeSchema,
  agentProtocolMessageEventName,
  type ErrorEventEnvelope,
} from '@pairdock/shared-contracts';
import type { Server, Socket } from 'socket.io';
import { AGENT_EVENTS_REPOSITORY } from '../persistence/persistence.tokens.js';
import type { AgentEventsRepository } from '../persistence/ports/agent-events.repository.js';
import { UiGateway } from '../ui-gateway/ui.gateway.js';
import { ConnectedAgentsRegistry } from './connected-agents.registry.js';

@Injectable()
@WebSocketGateway({ namespace: '/agent', cors: { origin: '*' } })
export class AgentGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  constructor(
    @Inject(AGENT_EVENTS_REPOSITORY)
    private readonly agentEventsRepository: AgentEventsRepository,
    @Inject(UiGateway)
    private readonly uiGateway: UiGateway,
    @Inject(ConnectedAgentsRegistry)
    private readonly connectedAgentsRegistry: ConnectedAgentsRegistry,
  ) {}

  handleDisconnect(client: Socket): void {
    this.connectedAgentsRegistry.unregister(client.id);
  }

  @SubscribeMessage(agentProtocolMessageEventName)
  async handleAgentProtocolMessage(@MessageBody() payload: unknown, @ConnectedSocket() client: Socket) {
    const event = agentEventEnvelopeSchema.parse(payload);
    const agentId = this.resolveAgentId(client, event);
    const sessionId = this.resolveSessionId(event);

    if (this.isAgentConnectedEvent(event)) {
      this.connectedAgentsRegistry.register(client.id, event.payload.agentId);
    }

    await this.agentEventsRepository.create({
      sessionId,
      agentId,
      type: event.type,
      payload: event.payload,
    });

    if (sessionId) {
      this.uiGateway.publishSessionEvent(sessionId, event);
    }

    return { accepted: true };
  }

  emitToAgent(agentId: string, command: AgentCommandEnvelope): boolean {
    const socketId = this.connectedAgentsRegistry.findSocketId(agentId);

    if (!socketId) {
      return false;
    }

    this.server.to(socketId).emit(agentProtocolMessageEventName, command);
    return true;
  }

  private resolveAgentId(client: Socket, event: AgentEventEnvelope): string | null {
    if (this.isAgentConnectedEvent(event)) {
      return event.payload.agentId;
    }

    return this.connectedAgentsRegistry.findAgentId(client.id);
  }

  private resolveSessionId(event: AgentEventEnvelope): string | null {
    if (event.sessionId) {
      return event.sessionId;
    }

    if (this.isErrorEvent(event)) {
      return event.payload.sessionId ?? null;
    }

    return null;
  }

  private isAgentConnectedEvent(event: AgentEventEnvelope): event is AgentConnectedEventEnvelope {
    return event.type === 'agent.connected';
  }

  private isErrorEvent(event: AgentEventEnvelope): event is ErrorEventEnvelope {
    return event.type === 'error';
  }
}
