import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PairDockIdentity, Session } from '@pairdock/domain';
import {
  PERSISTENCE_UNIT_OF_WORK,
  PROJECTS_REPOSITORY,
  SESSIONS_REPOSITORY,
} from '../persistence/persistence.tokens.js';
import type { PersistenceUnitOfWork } from '../persistence/ports/persistence-unit-of-work.js';
import type { ProjectsRepository } from '../persistence/ports/projects.repository.js';
import type { SessionsRepository } from '../persistence/ports/sessions.repository.js';
import { SessionStartPolicy, type SessionStartSource } from './session-start-policy.js';
import { InvalidSessionTransitionError, type SessionAgentEvent, SessionStateMachine } from './session-state-machine.js';

export interface CreateSessionInput {
  projectId: string;
  modelId: string;
  startSource?: SessionStartSource;
}

@Injectable()
export class SessionsService {
  private readonly stateMachine = new SessionStateMachine();

  constructor(
    @Inject(PROJECTS_REPOSITORY)
    private readonly projectsRepository: ProjectsRepository,
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessionsRepository: SessionsRepository,
    @Inject(PERSISTENCE_UNIT_OF_WORK)
    private readonly persistenceUnitOfWork: PersistenceUnitOfWork,
    @Inject(SessionStartPolicy)
    private readonly sessionStartPolicy: SessionStartPolicy,
  ) {}

  async getSession(sessionId: string): Promise<Session> {
    const session = await this.sessionsRepository.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} was not found.`);
    }

    return session;
  }

  async createSession(input: CreateSessionInput, user: PairDockIdentity): Promise<Session> {
    const project = await this.sessionStartPolicy.assertCanStart(input.projectId, user, input.startSource);
    const sessionMembers =
      user.kind === 'pm'
        ? [
            { userId: project.ownerUserId, role: 'developer' as const },
            { userId: user.id, role: 'pm' as const },
          ]
        : [{ userId: user.id, role: 'developer' as const }];

    return this.persistenceUnitOfWork.execute(async (repositories) => {
      const session = await repositories.sessions.create({
        projectId: project.id,
        createdByUserId: user.id,
        status: 'CREATED',
        modelId: input.modelId,
      });

      for (const sessionMember of sessionMembers) {
        await repositories.sessionMembers.add({
          sessionId: session.id,
          userId: sessionMember.userId,
          role: sessionMember.role,
        });
      }

      return session;
    });
  }

  async applyAgentEvent(sessionId: string, event: SessionAgentEvent, user: PairDockIdentity): Promise<Session> {
    const session = await this.getSession(sessionId);
    await this.assertOwnerAccess(session, user);

    try {
      return await this.persistenceUnitOfWork.execute(async (repositories) => {
        const currentSession = await repositories.sessions.findById(sessionId);

        if (!currentSession) {
          throw new NotFoundException(`Session ${sessionId} was not found.`);
        }

        const nextSession = this.stateMachine.applyAgentEvent(currentSession, event);

        await repositories.agentEvents.create({
          sessionId,
          type: event.type,
          payload: event.payload,
        });

        return repositories.sessions.updateStatus({
          id: sessionId,
          status: nextSession.status,
          lastError: nextSession.lastError,
          previewUrl: nextSession.previewUrl,
          closedAt: nextSession.closedAt,
        });
      });
    } catch (error) {
      if (error instanceof InvalidSessionTransitionError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  private async assertOwnerAccess(session: Session, user: PairDockIdentity): Promise<void> {
    if (user.kind !== 'developer') {
      throw new ForbiddenException('Only developers can manage session lifecycle.');
    }

    const project = await this.projectsRepository.findById(session.projectId);

    if (!project) {
      throw new NotFoundException(`Project ${session.projectId} was not found.`);
    }

    if (project.ownerUserId !== user.id) {
      throw new ForbiddenException('Only the owning developer can manage this session.');
    }
  }
}
