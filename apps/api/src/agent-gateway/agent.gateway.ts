import { Inject, Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { SessionStatus, ToolReadinessCheck } from '@pairdock/domain';
import {
  type AgentCommandEnvelope,
  type AgentConnectedEventEnvelope,
  type AgentEventEnvelope,
  agentEventEnvelopeSchema,
  agentProtocolMessageEventName,
  type ErrorEventEnvelope,
} from '@pairdock/shared-contracts';
import type { Server, Socket } from 'socket.io';
import {
  AGENT_EVENTS_REPOSITORY,
  AGENT_REGISTRATIONS_REPOSITORY,
  PERSISTENCE_UNIT_OF_WORK,
} from '../persistence/persistence.tokens.js';
import type { AgentEventsRepository } from '../persistence/ports/agent-events.repository.js';
import type { AgentRegistrationsRepository } from '../persistence/ports/agent-registrations.repository.js';
import type { PersistenceUnitOfWork } from '../persistence/ports/persistence-unit-of-work.js';
import { type SessionAgentEvent, SessionStateMachine } from '../sessions/session-state-machine.js';
import { UiGateway } from '../ui-gateway/ui.gateway.js';
import { ValidationService } from '../validation/validation.service.js';
import { ConnectedAgentsRegistry } from './connected-agents.registry.js';

@Injectable()
@WebSocketGateway({ namespace: '/agent', cors: { origin: '*' } })
export class AgentGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;
  private readonly stateMachine = new SessionStateMachine();

  constructor(
    @Inject(AGENT_EVENTS_REPOSITORY)
    private readonly agentEventsRepository: AgentEventsRepository,
    @Inject(AGENT_REGISTRATIONS_REPOSITORY)
    private readonly agentRegistrationsRepository: AgentRegistrationsRepository,
    @Inject(PERSISTENCE_UNIT_OF_WORK)
    private readonly persistenceUnitOfWork: PersistenceUnitOfWork,
    @Inject(UiGateway)
    private readonly uiGateway: UiGateway,
    @Inject(ConnectedAgentsRegistry)
    private readonly connectedAgentsRegistry: ConnectedAgentsRegistry,
    @Inject(ValidationService)
    private readonly validationService: ValidationService,
  ) {}

  async handleDisconnect(client: Socket): Promise<void> {
    const agentId = this.connectedAgentsRegistry.findAgentId(client.id);
    this.connectedAgentsRegistry.unregister(client.id);

    if (agentId) {
      await this.agentRegistrationsRepository.markDisconnected(agentId);
    }
  }

  @SubscribeMessage(agentProtocolMessageEventName)
  async handleAgentProtocolMessage(@MessageBody() payload: unknown, @ConnectedSocket() client: Socket) {
    const event = agentEventEnvelopeSchema.parse(payload);
    const agentId = this.resolveAgentId(client, event);
    const sessionId = this.resolveSessionId(event);

    if (this.isAgentConnectedEvent(event)) {
      this.connectedAgentsRegistry.register(client.id, event.payload);
      await this.agentRegistrationsRepository.markConnected({
        agentId: event.payload.agentId,
        protocolVersion: event.protocolVersion,
        capabilities: event.payload.capabilities,
        models: event.payload.models,
        projects: event.payload.projects,
      });
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

  async emitToAgentAndWait(agentId: string, command: AgentCommandEnvelope): Promise<boolean> {
    const socketId = this.connectedAgentsRegistry.findSocketId(agentId);

    if (!socketId) {
      return false;
    }

    const responses = (await this.server
      .to(socketId)
      .timeout(30_000)
      .emitWithAck(agentProtocolMessageEventName, command)) as unknown[];
    const response = responses[0];

    if (isCommandAcknowledgement(response) && response.accepted) {
      return true;
    }

    if (isCommandAcknowledgement(response) && response.error) {
      throw new Error(response.error);
    }

    throw new Error(`Agent ${agentId} did not acknowledge command ${command.type}.`);
  }

  private async persistEvent(
    agentId: string | null,
    sessionId: string | null,
    event: AgentEventEnvelope,
  ): Promise<void> {
    if (event.type === 'readiness.result') {
      await this.persistenceUnitOfWork.execute(async (repositories) => {
        const project = await repositories.projects.findByAgentProjectKey(event.payload.projectKey);

        await repositories.agentEvents.create({
          sessionId,
          agentId,
          type: event.type,
          payload: event.payload,
        });

        if (!project) {
          return;
        }

        await repositories.projectReadiness.upsert({
          projectId: project.id,
          ok: event.payload.ok,
          checks: event.payload.checks.map<ToolReadinessCheck>((check) => ({
            key: check.key,
            status: check.status,
            required: check.required,
            message: check.message ?? null,
            remediation: check.remediation ?? null,
          })),
        });
      });
      return;
    }

    if (sessionId && event.type === 'checks.result') {
      await this.persistenceUnitOfWork.execute(async (repositories) => {
        const currentSession = await repositories.sessions.findById(sessionId);

        await repositories.agentEvents.create({
          sessionId,
          agentId,
          type: event.type,
          payload: event.payload,
        });

        if (!currentSession) {
          return;
        }

        await repositories.validationRuns.create(this.validationService.toValidationRunInput(sessionId, event.payload));

        const sessionUpdate = this.validationService.toSessionUpdate(event.payload);
        await repositories.sessions.updateStatus({
          id: sessionId,
          status: sessionUpdate.status,
          lastError: sessionUpdate.lastError,
          previewUrl: currentSession.previewUrl,
          closedAt: currentSession.closedAt,
        });
      });
      return;
    }

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
    default:
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
  return (
    status === 'AGENT_CONNECTING' ||
    status === 'WORKTREE_CREATING' ||
    status === 'DOCKER_STARTING' ||
    status === 'PREVIEW_STARTING' ||
    status === 'AGENT_RUNNING' ||
    status === 'CHECKS_RUNNING' ||
    status === 'AWAITING_PM_VALIDATION' ||
    status === 'REVIEW_REQUEST_CREATING' ||
    status === 'REVIEW_REQUEST_CREATED'
  );
}

function isCommandAcknowledgement(value: unknown): value is { accepted: boolean; error?: string } {
  return (
    value !== null &&
    typeof value === 'object' &&
    'accepted' in value &&
    typeof value.accepted === 'boolean' &&
    (!('error' in value) || value.error === undefined || typeof value.error === 'string')
  );
}
