import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Session } from '@pairdock/domain';
import { SESSIONS_REPOSITORY } from '../persistence/persistence.tokens.js';
import type { SessionsRepository } from '../persistence/ports/sessions.repository.js';
import { SessionStateMachine } from './session-state-machine.js';

@Injectable()
export class SessionCloseService {
  private readonly stateMachine = new SessionStateMachine();

  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async closeSession(sessionId: string): Promise<Session> {
    const session = await this.sessionsRepository.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} was not found.`);
    }

    if (session.status === 'CLOSED') {
      return session;
    }

    const nextSession = this.stateMachine.closeSession(session, new Date());

    return this.sessionsRepository.updateStatus({
      id: nextSession.id,
      status: nextSession.status,
      closedAt: nextSession.closedAt,
    });
  }
}
