import { randomUUID } from 'node:crypto';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { NotificationPort, PairDockIdentity, Project, Session, SourceControlConnection } from '@pairdock/domain';
import { AGENT_PROTOCOL_VERSION, type GitPushBranchCommandEnvelope } from '@pairdock/shared-contracts';
import { AgentCommandRouterService } from '../agent-gateway/agent-command-router.service.js';
import { NOTIFICATION_PORT } from '../notifications/notifications.tokens.js';
import {
  PERSISTENCE_UNIT_OF_WORK,
  PROJECTS_REPOSITORY,
  SESSION_MEMBERS_REPOSITORY,
  SESSIONS_REPOSITORY,
  SOURCE_CONTROL_CONNECTIONS_REPOSITORY,
  USERS_REPOSITORY,
  VALIDATION_RUNS_REPOSITORY,
} from '../persistence/persistence.tokens.js';
import type { PersistenceUnitOfWork } from '../persistence/ports/persistence-unit-of-work.js';
import type { ProjectsRepository } from '../persistence/ports/projects.repository.js';
import type { SessionMembersRepository } from '../persistence/ports/session-members.repository.js';
import type { SessionsRepository } from '../persistence/ports/sessions.repository.js';
import type { SourceControlConnectionsRepository } from '../persistence/ports/source-control-connections.repository.js';
import type { UsersRepository } from '../persistence/ports/users.repository.js';
import type { ValidationRunsRepository } from '../persistence/ports/validation-runs.repository.js';
import type { SourceControlPort } from '../source-control/source-control.port.js';
import { SOURCE_CONTROL_PORT } from '../source-control/source-control.tokens.js';
import { ValidationPolicy } from '../validation/validation.policy.js';

export interface DraftReviewRequestResult {
  sessionId: string;
  reviewRequestNumber: number | null;
  reviewRequestUrl: string;
  status: string;
}

@Injectable()
export class CreateDraftReviewRequestUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessionsRepository: SessionsRepository,
    @Inject(PROJECTS_REPOSITORY)
    private readonly projectsRepository: ProjectsRepository,
    @Inject(VALIDATION_RUNS_REPOSITORY)
    private readonly validationRunsRepository: ValidationRunsRepository,
    @Inject(SOURCE_CONTROL_CONNECTIONS_REPOSITORY)
    private readonly sourceControlConnectionsRepository: SourceControlConnectionsRepository,
    @Inject(SESSION_MEMBERS_REPOSITORY)
    private readonly sessionMembersRepository: SessionMembersRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
    @Inject(PERSISTENCE_UNIT_OF_WORK)
    private readonly persistenceUnitOfWork: PersistenceUnitOfWork,
    @Inject(AgentCommandRouterService)
    private readonly agentCommandRouter: AgentCommandRouterService,
    @Inject(SOURCE_CONTROL_PORT)
    private readonly sourceControl: SourceControlPort,
    @Inject(NOTIFICATION_PORT)
    private readonly notifications: NotificationPort,
    @Inject(ValidationPolicy)
    private readonly validationPolicy: ValidationPolicy,
  ) {}

  async create(sessionId: string, actor: PairDockIdentity): Promise<DraftReviewRequestResult> {
    const session = await this.requireSession(sessionId);
    const project = await this.requireProject(session.projectId);
    const connection = await this.requireSourceControlConnection(project.sourceControlConnectionId);
    await this.assertActorCanCreateReviewRequest(sessionId, actor, project);

    const validationRun = await this.validationRunsRepository.findLatestBySessionId(sessionId);
    const failureReasons = this.validationPolicy.failureReasons(validationRun, session.status);

    if (failureReasons.length > 0) {
      throw new ConflictException(failureReasons.join(' '));
    }

    const branchName = session.branchName ?? buildSessionBranchName(session.id);
    await this.agentCommandRouter.routeToOwningAgent(sessionId, buildGitPushBranchCommand(sessionId), {
      waitForCompletion: true,
    });

    const reviewRequest = await this.sourceControl.createDraftReviewRequest({
      projectId: project.id,
      sessionId: session.id,
      repoFullName: project.repoFullName,
      sourceControlConnectionId: connection.id,
      providerConnectionId: connection.providerConnectionId,
      sourceControlAccountLogin: connection.accountLogin,
      title: `PairDock session ${session.id.slice(0, 8)}`,
      body: buildReviewRequestBody(session, project),
      branchName,
      baseBranch: project.defaultBranch,
    });

    await this.persistenceUnitOfWork.execute(async (repositories) => {
      await repositories.reviewRequests.create({
        sessionId,
        reviewRequestNumber: reviewRequest.reviewRequestNumber,
        reviewRequestUrl: reviewRequest.reviewRequestUrl,
        status: 'draft',
      });
      await repositories.sessions.updateStatus({
        id: sessionId,
        status: 'REVIEW_REQUEST_CREATED',
        lastError: null,
        previewUrl: session.previewUrl,
        closedAt: session.closedAt,
      });
    });

    if (this.shouldNotifyDeveloper(session, actor, project)) {
      await this.notifyDeveloperOwner(session, project, reviewRequest.reviewRequestUrl);
    }

    return {
      sessionId,
      reviewRequestNumber: reviewRequest.reviewRequestNumber,
      reviewRequestUrl: reviewRequest.reviewRequestUrl,
      status: 'draft',
    };
  }

  private async notifyDeveloperOwner(session: Session, project: Project, reviewRequestUrl: string): Promise<void> {
    const owner = await this.usersRepository.findById(project.ownerUserId);

    if (!owner) {
      throw new NotFoundException(`Developer owner ${project.ownerUserId} was not found.`);
    }

    const result = await this.notifications.send({
      recipientUserId: owner.id,
      recipientEmail: owner.email,
      recipientDisplayName: owner.displayName,
      sessionId: session.id,
      type: 'review-request-created',
      reviewRequestUrl,
      projectName: project.name,
    });

    await this.persistenceUnitOfWork.execute(async (repositories) => {
      await repositories.notifications.create({
        userId: owner.id,
        sessionId: session.id,
        type: 'review-request-created',
        provider: result.provider,
        providerMessageId: result.providerMessageId,
        status: result.status,
      });
    });
  }

  private async requireSession(sessionId: string): Promise<Session> {
    const session = await this.sessionsRepository.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} was not found.`);
    }

    return session;
  }

  private async requireProject(projectId: string): Promise<Project> {
    const project = await this.projectsRepository.findById(projectId);

    if (!project) {
      throw new NotFoundException(`Project ${projectId} was not found.`);
    }

    return project;
  }

  private async requireSourceControlConnection(connectionId: string): Promise<SourceControlConnection> {
    const connection = await this.sourceControlConnectionsRepository.findById(connectionId);

    if (!connection) {
      throw new NotFoundException(`Source-control connection ${connectionId} was not found.`);
    }

    return connection;
  }

  private async assertActorCanCreateReviewRequest(
    sessionId: string,
    actor: PairDockIdentity,
    project: Project,
  ): Promise<void> {
    if (actor.kind === 'developer' && actor.id === project.ownerUserId) {
      return;
    }

    const membership = await this.sessionMembersRepository.findBySessionIdAndUserId(sessionId, actor.id);

    if (membership?.role === 'pm') {
      return;
    }

    throw new ConflictException('Only the developer owner or a PM session member can create a draft review request.');
  }

  private shouldNotifyDeveloper(session: Session, actor: PairDockIdentity, project: Project): boolean {
    return actor.kind === 'pm' || session.createdByUserId !== project.ownerUserId;
  }
}

function buildGitPushBranchCommand(sessionId: string): GitPushBranchCommandEnvelope {
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: randomUUID(),
    sessionId,
    sentAt: new Date().toISOString(),
    type: 'git.pushBranch',
    payload: {
      sessionId,
    },
  };
}

function buildSessionBranchName(sessionId: string): string {
  return `pairdock/session-${sessionId.slice(0, 8)}`;
}

function buildReviewRequestBody(session: Session, project: Project): string {
  return [`PairDock generated draft review request for ${project.name}.`, '', `Session: ${session.id}`].join('\n');
}
