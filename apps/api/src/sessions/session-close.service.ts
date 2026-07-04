import { randomUUID } from 'node:crypto';
import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import type { Session } from '@pairdock/domain';
import { AGENT_PROTOCOL_VERSION, type SessionCloseCommandEnvelope } from '@pairdock/shared-contracts';
import { AgentCommandRouterService } from '../agent-gateway/agent-command-router.service.js';
import { SESSIONS_REPOSITORY } from '../persistence/persistence.tokens.js';
import type { SessionsRepository } from '../persistence/ports/sessions.repository.js';
import { SessionStateMachine } from './session-state-machine.js';

@Injectable()
export class SessionCloseService {
  private readonly stateMachine = new SessionStateMachine();

  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessionsRepository: SessionsRepository,
    @Optional()
    @Inject(AgentCommandRouterService)
    private readonly agentCommandRouter?: AgentCommandRouterService,
  ) {}

  async closeSession(sessionId: string): Promise<Session> {
    const session = await this.sessionsRepository.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} was not found.`);
    }

    if (session.status === 'CLOSED') {
      return session;
    }

    const cleanupError = await this.requestLocalCleanup(session);
    const nextSession = this.stateMachine.closeSession(session, new Date());

    return this.sessionsRepository.updateStatus({
      id: nextSession.id,
      status: nextSession.status,
      lastError: cleanupError,
      closedAt: nextSession.closedAt,
    });
  }

  private async requestLocalCleanup(session: Session): Promise<string | null> {
    if (!this.agentCommandRouter || session.status === 'CREATED' || session.status === 'FAILED') {
      return null;
    }

    try {
      await this.agentCommandRouter.routeToOwningAgent(session.id, buildSessionCloseCommand(session.id), {
        waitForCompletion: true,
      });
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }
}

function buildSessionCloseCommand(sessionId: string): SessionCloseCommandEnvelope {
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: randomUUID(),
    sessionId,
    sentAt: new Date().toISOString(),
    type: 'session.close',
    payload: {
      sessionId,
      mode: 'delete-local',
    },
  };
}
