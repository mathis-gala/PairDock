import { Inject, Injectable } from '@nestjs/common';
import type { SessionMember } from '@pairdock/domain';
import { SESSION_MEMBERS_REPOSITORY } from '../persistence/persistence.tokens.js';
import type { SessionMembersRepository } from '../persistence/ports/session-members.repository.js';

@Injectable()
export class InvitationsService {
  constructor(
    @Inject(SESSION_MEMBERS_REPOSITORY)
    private readonly sessionMembersRepository: SessionMembersRepository,
  ) {}

  findMembership(sessionId: string, userId: string): Promise<SessionMember | null> {
    return this.sessionMembersRepository.findBySessionIdAndUserId(sessionId, userId);
  }
}
