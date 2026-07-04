import { Inject, Injectable } from '@nestjs/common';
import type { ProjectMembership, SessionMember } from '@pairdock/domain';
import { PROJECT_MEMBERS_REPOSITORY, SESSION_MEMBERS_REPOSITORY } from '../persistence/persistence.tokens.js';
import type { ProjectMembersRepository } from '../persistence/ports/project-members.repository.js';
import type { SessionMembersRepository } from '../persistence/ports/session-members.repository.js';

@Injectable()
export class InvitationsService {
  constructor(
    @Inject(PROJECT_MEMBERS_REPOSITORY)
    private readonly projectMembersRepository: ProjectMembersRepository,
    @Inject(SESSION_MEMBERS_REPOSITORY)
    private readonly sessionMembersRepository: SessionMembersRepository,
  ) {}

  findMembership(sessionId: string, userId: string): Promise<SessionMember | null> {
    return this.findSessionMembership(sessionId, userId);
  }

  findSessionMembership(sessionId: string, userId: string): Promise<SessionMember | null> {
    return this.sessionMembersRepository.findBySessionIdAndUserId(sessionId, userId);
  }

  findProjectMembership(projectId: string, userId: string): Promise<ProjectMembership | null> {
    return this.projectMembersRepository.findByProjectIdAndUserId(projectId, userId);
  }
}
