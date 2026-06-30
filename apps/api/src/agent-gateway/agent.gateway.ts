import { Inject, Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { SessionStatus } from '@pairdock/domain';
import {
  type AgentCommandEnvelope,
  type AgentConnectedEventEnvelope,
  type AgentEventEnvelope,
  agentEventEnvelopeSchema,
  agentProtocolMessageEventName,
  type ErrorEventEnvelope,
} from '@pairdock/shared-contracts';
import type { Server, Socket } from 'socket.io';
import { AGENT_EVENTS_REPOSITORY, PERSISTENCE_UNIT_OF_WORK } from '../persistence/persistence.tokens.js';
import type { AgentEventsRepository } from '../persistence/ports/agent-events.repository.js';
import type { PersistenceUnitOfWork } from '../persistence/ports/persistence-unit-of-work.js';
import { type SessionAgentEvent, SessionStateMachine } from '../sessions/session-state-machine.js';
import { UiGateway } from '../ui-gateway/ui.gateway.js';
import { ConnectedAgentsRegistry } from './connected-agents.registry.js';

const lifecycleProgressStatuses = [
  'AGENT_CONNECTING',
  'WORKTREE_CREATING',
  'DOCKER_STARTING',
  'PREVIEW_STARTING',
  'AGENT_RUNNING',
  'CHECKS_RUNNING',
  'AWAITING_PM_VALIDATION',
  'REVIEW_REQUEST_CREATING',
  'REVIEW_REQUEST_CREATED',
] as const;

@Injectable()
@WebSocketGateway({ namespace: '/agent', cors: { origin: '*' } })
export class AgentGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;
  private readonly stateMachine = new SessionStateMachine();

  constructor(
    @Inject(AGENT_EVENTS_REPOSITORY)
    private readonly agentEventsRepository: AgentEventsRepository,
    @Inject(PERSISTENCE_UNIT_OF_WORK)
    private readonly persistenceUnitOfWork: PersistenceUnitOfWork,
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

    await this.persistEvent(agentId, sessionId, event);

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

  private async persistEvent(
    agentId: string | null,
    sessionId: string | null,
    event: AgentEventEnvelope,
  ): Promise<void> {
    const sessionEvent = sessionId ? toSessionAgentEvent(event) : null;

    if (!sessionId || !sessionEvent) {
      await this.agentEventsRepository.create({
        sessionId,
        agentId,
        type: event.type,
        payload: event.payload,
      });
      return;
    }

    await this.persistenceUnitOfWork.execute(async (repositories) => {
      const currentSession = await repositories.sessions.findById(sessionId);

      if (!currentSession) {
        await repositories.agentEvents.create({
          sessionId,
          agentId,
          type: event.type,
          payload: event.payload,
        });
        return;
      }

      const nextSession = this.stateMachine.applyAgentEvent(currentSession, sessionEvent);

      await repositories.agentEvents.create({
        sessionId,
        agentId,
        type: event.type,
        payload: event.payload,
      });

      await repositories.sessions.updateStatus({
        id: sessionId,
        status: nextSession.status,
        lastError: nextSession.lastError,
        previewUrl: nextSession.previewUrl,
        closedAt: nextSession.closedAt,
      });
    });
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

function toSessionAgentEvent(event: AgentEventEnvelope): SessionAgentEvent | null {
  switch (event.type) {
    case 'session.progress':
      if (!isLifecycleProgressStatus(event.payload.status)) {
        return null;
      }

      return {
        type: event.type,
        payload: {
          status: event.payload.status,
          ...(event.payload.message ? { message: event.payload.message } : {}),
        },
      };
    case 'session.ready':
      return {
        type: event.type,
        payload: {
          previewUrl: event.payload.previewUrl,
        },
      };
    case 'agent.done':
      return {
        type: event.type,
        payload: {
          exitCode: event.payload.exitCode,
        },
      };
    case 'session.closed':
      return {
        type: event.type,
        payload: {
          cleaned: event.payload.cleaned,
        },
      };
    case 'error':
      return {
        type: event.type,
        payload: {
          message: event.payload.message,
          retryable: event.payload.retryable,
        },
      };
    case 'agent.connected':
    case 'agent.output':
    case 'checks.result':
    case 'git.branchPushed':
    case 'git.diff':
      return null;
  }
}

function isLifecycleProgressStatus(
  status: SessionStatus,
): status is Extract<
  SessionStatus,
  | 'AGENT_CONNECTING'
  | 'WORKTREE_CREATING'
  | 'DOCKER_STARTING'
  | 'PREVIEW_STARTING'
  | 'AGENT_RUNNING'
  | 'CHECKS_RUNNING'
  | 'AWAITING_PM_VALIDATION'
  | 'REVIEW_REQUEST_CREATING'
  | 'REVIEW_REQUEST_CREATED'
> {
  return (lifecycleProgressStatuses as readonly SessionStatus[]).includes(status);
}
