import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { PairDockIdentity, Project, Session, SessionStatus } from '@pairdock/domain';
import { AGENT_PROTOCOL_VERSION, type SessionPrepareCommandEnvelope } from '@pairdock/shared-contracts';
import { AgentCommandRouterService } from '../agent-gateway/agent-command-router.service.js';
import { AgentExecutionCapabilitiesService } from '../agent-gateway/agent-execution-capabilities.service.js';
import { ConnectedAgentsRegistry } from '../agent-gateway/connected-agents.registry.js';
import { DiffService } from '../diff/diff.service.js';
import {
  AGENT_EVENTS_REPOSITORY,
  MESSAGES_REPOSITORY,
  PERSISTENCE_UNIT_OF_WORK,
  PROJECT_MEMBERS_REPOSITORY,
  PROJECTS_REPOSITORY,
  REVIEW_REQUESTS_REPOSITORY,
  SESSION_MEMBERS_REPOSITORY,
  SESSIONS_REPOSITORY,
  USERS_REPOSITORY,
} from '../persistence/persistence.tokens.js';
import type { AgentEventsRepository } from '../persistence/ports/agent-events.repository.js';
import type { MessagesRepository } from '../persistence/ports/messages.repository.js';
import type { PersistenceUnitOfWork } from '../persistence/ports/persistence-unit-of-work.js';
import type { ProjectMembersRepository } from '../persistence/ports/project-members.repository.js';
import type { ProjectsRepository } from '../persistence/ports/projects.repository.js';
import type { ReviewRequestsRepository } from '../persistence/ports/review-requests.repository.js';
import type { SessionMembersRepository } from '../persistence/ports/session-members.repository.js';
import type { SessionsRepository } from '../persistence/ports/sessions.repository.js';
import type { UsersRepository } from '../persistence/ports/users.repository.js';
import { ValidationService } from '../validation/validation.service.js';
import { SessionCloseService } from './session-close.service.js';
import { SessionStartPolicy, type SessionStartSource } from './session-start-policy.js';
import { InvalidSessionTransitionError, type SessionAgentEvent, SessionStateMachine } from './session-state-machine.js';

export interface CreateSessionInput {
  projectId: string;
  startSource?: SessionStartSource;
}

export interface CreateSessionRequest {
  projectId?: string;
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
    @Inject(MESSAGES_REPOSITORY)
    private readonly messagesRepository: MessagesRepository,
    @Inject(AGENT_EVENTS_REPOSITORY)
    private readonly agentEventsRepository: AgentEventsRepository,
    @Inject(SESSION_MEMBERS_REPOSITORY)
    private readonly sessionMembersRepository: SessionMembersRepository,
    @Inject(PROJECT_MEMBERS_REPOSITORY)
    private readonly projectMembersRepository: ProjectMembersRepository,
    @Inject(REVIEW_REQUESTS_REPOSITORY)
    private readonly reviewRequestsRepository: ReviewRequestsRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
    @Inject(PERSISTENCE_UNIT_OF_WORK)
    private readonly persistenceUnitOfWork: PersistenceUnitOfWork,
    @Inject(ConnectedAgentsRegistry)
    private readonly connectedAgentsRegistry: ConnectedAgentsRegistry,
    @Inject(AgentCommandRouterService)
    private readonly agentCommandRouter: AgentCommandRouterService,
    @Inject(AgentExecutionCapabilitiesService)
    private readonly agentExecutionCapabilities: AgentExecutionCapabilitiesService,
    @Inject(DiffService)
    private readonly diffService: DiffService,
    @Inject(ValidationService)
    private readonly validationService: ValidationService,
    @Inject(SessionCloseService)
    private readonly sessionCloseService: SessionCloseService,
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

  async getSessionResponse(sessionId: string) {
    return this.buildSessionResponse(await this.getSession(sessionId));
  }

  async listMessages(sessionId: string) {
    const messages = await this.messagesRepository.listBySessionId(sessionId);

    return messages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
    }));
  }

  async listEvents(sessionId: string) {
    const events = await this.agentEventsRepository.listBySessionId(sessionId);

    return events.map((event) => ({
      ...event,
      createdAt: event.createdAt.toISOString(),
    }));
  }

  async createSessionResponse(input: CreateSessionRequest | undefined, user: PairDockIdentity | undefined) {
    const session = await this.createSession(this.parseCreateSessionInput(input), this.requireUser(user));
    return this.buildSessionResponse(session);
  }

  async createSession(input: CreateSessionInput, user: PairDockIdentity): Promise<Session> {
    const project = await this.sessionStartPolicy.assertCanStart(input.projectId, user, input.startSource);
    const executionSelection = this.agentExecutionCapabilities.resolveSessionSelection(project.agentProjectKey, {
      modelId: project.defaultModelId,
      reasoningEffort: project.defaultReasoningEffort,
    });
    const sessionMembers =
      user.kind === 'pm'
        ? [
            { userId: project.ownerUserId, role: 'developer' },
            { userId: user.id, role: 'pm' },
          ]
        : [
            { userId: user.id, role: 'developer' },
            ...(await this.projectMembersRepository.listByProjectId(project.id))
              .filter((member) => member.role === 'pm')
              .map((member) => ({ userId: member.userId, role: 'pm' })),
          ];

    const session = await this.persistenceUnitOfWork.execute(async (repositories) => {
      const session = await repositories.sessions.create({
        projectId: project.id,
        createdByUserId: user.id,
        status: 'CREATED',
        modelId: executionSelection.modelId,
        reasoningEffort: executionSelection.reasoningEffort,
        branchName: `pairdock/session-${randomUUID().slice(0, 8)}`,
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

    await this.prepareSessionIfAgentOnline(session, project);
    return session;
  }

  async applyAgentEventResponse(sessionId: string, event: unknown, user: PairDockIdentity | undefined) {
    const session = await this.applyAgentEvent(sessionId, parseSessionAgentEvent(event), this.requireUser(user));
    return this.buildSessionResponse(session);
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

  async closeSessionResponse(sessionId: string, user: PairDockIdentity | undefined) {
    const actor = this.requireUser(user);
    const session = await this.getSession(sessionId);
    const project = await this.projectsRepository.findById(session.projectId);

    if (!project) {
      throw new NotFoundException(`Project ${session.projectId} was not found.`);
    }

    if (actor.kind !== 'developer' || (session.createdByUserId !== actor.id && project.ownerUserId !== actor.id)) {
      throw new ForbiddenException('Only the owning developer can close this session.');
    }

    return this.buildSessionResponse(await this.sessionCloseService.closeSession(sessionId));
  }

  private parseCreateSessionInput(input: CreateSessionRequest | undefined): CreateSessionInput {
    const projectId = input?.projectId?.trim();

    if (!projectId) {
      throw new BadRequestException('Project id is required.');
    }

    return {
      projectId,
      startSource: input?.startSource,
    };
  }

  private requireUser(user: PairDockIdentity | undefined): PairDockIdentity {
    if (!user) {
      throw new InternalServerErrorException('Authenticated user was not resolved.');
    }

    return user;
  }

  private async buildSessionResponse(session: Session) {
    const [latestDiff, latestValidation, latestReviewRequest, project, sessionMembers] = await Promise.all([
      this.diffService.getLatestDiff(session.id),
      this.validationService.getLatestValidation(session.id),
      this.reviewRequestsRepository.findBySessionId(session.id),
      this.projectsRepository.findById(session.projectId),
      this.sessionMembersRepository.listBySessionId(session.id),
    ]);

    if (!project) {
      throw new NotFoundException(`Project ${session.projectId} was not found.`);
    }

    const userIds = [...new Set([project.ownerUserId, ...sessionMembers.map((member) => member.userId)])];
    const users = await Promise.all(
      userIds.map(async (userId) => ({ userId, user: await this.usersRepository.findById(userId) })),
    );
    const usersById = new Map(users.map(({ userId, user }) => [userId, user]));
    const agentAvailability = this.connectedAgentsRegistry.findSocketId(project.agentProjectKey) ? 'online' : 'offline';

    return {
      ...session,
      project: {
        id: project.id,
        name: project.name,
        defaultBranch: project.defaultBranch,
        ownerDisplayName: formatUserDisplayName(usersById.get(project.ownerUserId), project.ownerUserId),
        owningAgentId: project.agentProjectKey,
        agentAvailability,
      },
      participants: [...sessionMembers].sort(compareSessionMembers).map((member) => ({
        userId: member.userId,
        role: member.role,
        displayName: formatUserDisplayName(usersById.get(member.userId), member.userId),
      })),
      latestDiff,
      latestValidation,
      ...(latestReviewRequest
        ? {
            reviewRequest: {
              url: latestReviewRequest.reviewRequestUrl,
              number: latestReviewRequest.reviewRequestNumber,
              status: latestReviewRequest.status,
            },
          }
        : {}),
      createdAt: session.createdAt.toISOString(),
      closedAt: session.closedAt?.toISOString() ?? null,
    };
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

  private async prepareSessionIfAgentOnline(session: Session, project: Project): Promise<void> {
    if (!this.connectedAgentsRegistry.findSocketId(project.agentProjectKey)) {
      return;
    }

    await this.agentCommandRouter.routeToOwningAgent(
      session.id,
      buildSessionPrepareCommand(session, project.agentProjectKey, project.defaultBranch),
    );
  }
}

function buildSessionPrepareCommand(
  session: Session,
  agentProjectKey: string,
  baseBranch: string,
): SessionPrepareCommandEnvelope {
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: randomUUID(),
    sessionId: session.id,
    sentAt: new Date().toISOString(),
    type: 'session.prepare',
    payload: {
      sessionId: session.id,
      projectKey: agentProjectKey,
      branchName: session.branchName ?? `pairdock/session-${session.id.slice(0, 8)}`,
      baseBranch,
      modelId: session.modelId,
      reasoningEffort: session.reasoningEffort,
    },
  };
}

function parseSessionAgentEvent(value: unknown): SessionAgentEvent {
  const event = requireObject(value, 'Event type is required.');
  const type = event.type;
  const payload = requireObject(event.payload, 'Event payload is required.');

  if (type === 'session.progress') {
    const status = payload.status;

    if (typeof status !== 'string' || !isProgressStatus(status)) {
      throw new BadRequestException('Progress status is invalid.');
    }

    const message = payload.message;

    if (message !== undefined && typeof message !== 'string') {
      throw new BadRequestException('Progress message is invalid.');
    }

    return {
      type,
      payload: {
        status,
        ...(message ? { message } : {}),
      },
    };
  }

  if (type === 'session.ready') {
    const previewUrl = payload.previewUrl;

    if (typeof previewUrl !== 'string') {
      throw new BadRequestException('Preview URL is required.');
    }

    return { type, payload: { previewUrl } };
  }

  if (type === 'agent.done') {
    const exitCode = payload.exitCode;
    const changesDetected = payload.changesDetected;

    if (typeof exitCode !== 'number') {
      throw new BadRequestException('Exit code is required.');
    }

    if (changesDetected !== undefined && typeof changesDetected !== 'boolean') {
      throw new BadRequestException('Changes detected flag is invalid.');
    }

    return {
      type,
      payload: {
        exitCode,
        ...(changesDetected !== undefined ? { changesDetected } : {}),
      },
    };
  }

  if (type === 'session.closed') {
    const cleaned = payload.cleaned;

    if (typeof cleaned !== 'boolean') {
      throw new BadRequestException('Cleaned flag is required.');
    }

    return { type, payload: { cleaned } };
  }

  if (type === 'error') {
    const message = payload.message;
    const retryable = payload.retryable;

    if (typeof message !== 'string' || typeof retryable !== 'boolean') {
      throw new BadRequestException('Error payload is invalid.');
    }

    return { type, payload: { message, retryable } };
  }

  throw new BadRequestException('Event type is required.');
}

function requireObject(value: unknown, message: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new BadRequestException(message);
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isProgressStatus(
  value: string,
): value is Exclude<SessionStatus, 'CREATED' | 'READY' | 'CLOSING' | 'CLOSED' | 'FAILED'> {
  return (
    value === 'AGENT_CONNECTING' ||
    value === 'WORKTREE_CREATING' ||
    value === 'DOCKER_STARTING' ||
    value === 'PREVIEW_STARTING' ||
    value === 'AGENT_RUNNING' ||
    value === 'CHECKS_RUNNING' ||
    value === 'AWAITING_PM_VALIDATION' ||
    value === 'REVIEW_REQUEST_CREATING' ||
    value === 'REVIEW_REQUEST_CREATED'
  );
}

function formatUserDisplayName(
  user: { displayName: string | null; email: string } | null | undefined,
  fallback: string,
): string {
  return user?.displayName ?? user?.email ?? fallback;
}

function compareSessionMembers(
  left: { role: string; userId: string },
  right: { role: string; userId: string },
): number {
  return sessionMemberOrder(left.role) - sessionMemberOrder(right.role) || left.userId.localeCompare(right.userId);
}

function sessionMemberOrder(role: string): number {
  if (role === 'developer') {
    return 0;
  }

  if (role === 'pm') {
    return 1;
  }

  return 2;
}
