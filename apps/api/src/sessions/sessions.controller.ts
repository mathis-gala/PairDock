import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { PairDockIdentity, Session } from '@pairdock/domain';
import { ConnectedAgentsRegistry } from '../agent-gateway/connected-agents.registry.js';
import type { AuthenticatedRequest } from '../auth/authenticated-request.js';
import { RequireAuth } from '../auth/require-auth.decorator.js';
import { RequireSessionAccess } from '../auth/require-session-access.decorator.js';
import { DiffService } from '../diff/diff.service.js';
import {
  AGENT_EVENTS_REPOSITORY,
  MESSAGES_REPOSITORY,
  PROJECTS_REPOSITORY,
  SESSION_MEMBERS_REPOSITORY,
  SESSIONS_REPOSITORY,
  USERS_REPOSITORY,
} from '../persistence/persistence.tokens.js';
import type { AgentEventsRepository } from '../persistence/ports/agent-events.repository.js';
import type { MessagesRepository } from '../persistence/ports/messages.repository.js';
import type { ProjectsRepository } from '../persistence/ports/projects.repository.js';
import type { SessionMembersRepository } from '../persistence/ports/session-members.repository.js';
import type { SessionsRepository } from '../persistence/ports/sessions.repository.js';
import type { UsersRepository } from '../persistence/ports/users.repository.js';
import { ValidationService } from '../validation/validation.service.js';
import { SessionCloseService } from './session-close.service.js';
import { SessionPromptService } from './session-prompt.service.js';
import type { SessionStartSource } from './session-start-policy.js';
import type { SessionAgentEvent } from './session-state-machine.js';
import { SessionsService } from './sessions.service.js';

interface CreatePromptBody {
  content: string;
}

interface CreateSessionBody {
  projectId: string;
  modelId: string;
  startSource?: SessionStartSource;
}

@Controller('sessions')
export class SessionsController {
  constructor(
    @Inject(MESSAGES_REPOSITORY)
    private readonly messagesRepository: MessagesRepository,
    @Inject(AGENT_EVENTS_REPOSITORY)
    private readonly agentEventsRepository: AgentEventsRepository,
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessionsRepository: SessionsRepository,
    @Inject(PROJECTS_REPOSITORY)
    private readonly projectsRepository: ProjectsRepository,
    @Inject(SESSION_MEMBERS_REPOSITORY)
    private readonly sessionMembersRepository: SessionMembersRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
    @Inject(ConnectedAgentsRegistry)
    private readonly connectedAgentsRegistry: ConnectedAgentsRegistry,
    @Inject(DiffService)
    private readonly diffService: DiffService,
    @Inject(ValidationService)
    private readonly validationService: ValidationService,
    @Inject(SessionsService)
    private readonly sessionsService: SessionsService,
    @Inject(SessionCloseService)
    private readonly sessionCloseService: SessionCloseService,
    @Inject(SessionPromptService)
    private readonly sessionPromptService: SessionPromptService,
  ) {}

  @Get(':sessionId')
  @RequireSessionAccess()
  async getSession(@Param('sessionId') sessionId: string) {
    const session = await this.sessionsRepository.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} was not found.`);
    }

    return this.buildSessionResponse(session);
  }

  @Get(':sessionId/messages')
  @RequireSessionAccess()
  async listMessages(@Param('sessionId') sessionId: string) {
    const messages = await this.messagesRepository.listBySessionId(sessionId);

    return messages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
    }));
  }

  @Get(':sessionId/events')
  @RequireSessionAccess()
  async listEvents(@Param('sessionId') sessionId: string) {
    const events = await this.agentEventsRepository.listBySessionId(sessionId);

    return events.map((event) => ({
      ...event,
      createdAt: event.createdAt.toISOString(),
    }));
  }

  @Post()
  @RequireAuth()
  async createSession(@Body() body: CreateSessionBody, @Req() request: AuthenticatedRequest) {
    const projectId = body.projectId?.trim();
    const modelId = body.modelId?.trim();
    const startSource = body.startSource;
    const user = this.requireUser(request.user);

    if (!projectId) {
      throw new BadRequestException('Project id is required.');
    }

    if (!modelId) {
      throw new BadRequestException('Model id is required.');
    }

    const session = await this.sessionsService.createSession({ projectId, modelId, startSource }, user);

    return this.buildSessionResponse(session);
  }

  @Post(':sessionId/events')
  @RequireAuth()
  async applyAgentEvent(
    @Param('sessionId') sessionId: string,
    @Body() body: SessionAgentEvent,
    @Req() request: AuthenticatedRequest,
  ) {
    const user = this.requireUser(request.user);

    if (!body || typeof body !== 'object' || !('type' in body)) {
      throw new BadRequestException('Event type is required.');
    }

    const session = await this.sessionsService.applyAgentEvent(sessionId, body, user);

    return this.buildSessionResponse(session);
  }

  @Post(':sessionId/close')
  @RequireAuth()
  async closeSession(@Param('sessionId') sessionId: string, @Req() request: AuthenticatedRequest) {
    const user = this.requireUser(request.user);
    const session = await this.sessionsService.getSession(sessionId);

    if (user.kind !== 'developer' || session.createdByUserId !== user.id) {
      throw new ForbiddenException('Only the owning developer can close this session.');
    }

    const closedSession = await this.sessionCloseService.closeSession(sessionId);

    return this.buildSessionResponse(closedSession);
  }

  @Post(':sessionId/prompts')
  @RequireSessionAccess()
  async createPrompt(
    @Param('sessionId') sessionId: string,
    @Body() body: CreatePromptBody,
    @Req() request: AuthenticatedRequest,
  ) {
    const content = body.content?.trim();

    if (!content) {
      throw new BadRequestException('Prompt content is required.');
    }

    const user = request.user;
    const sessionMember = request.sessionMember;

    if (!user || !sessionMember) {
      throw new InternalServerErrorException('Authenticated session membership was not resolved.');
    }

    const message = await this.sessionPromptService.createPrompt(
      sessionId,
      {
        userId: user.id,
        role: sessionMember.role,
      },
      content,
    );

    return {
      ...message,
      createdAt: message.createdAt.toISOString(),
    };
  }

  @Post(':sessionId/prompts/cancel')
  @HttpCode(202)
  @RequireSessionAccess()
  async cancelPrompt(@Param('sessionId') sessionId: string) {
    await this.sessionPromptService.cancelPrompt(sessionId);

    return {
      accepted: true,
      sessionId,
    };
  }

  private requireUser(user: PairDockIdentity | undefined): PairDockIdentity {
    if (!user) {
      throw new InternalServerErrorException('Authenticated user was not resolved.');
    }

    return user;
  }

  private async buildSessionResponse(session: Session) {
    const [latestDiff, latestValidation, project, sessionMembers] = await Promise.all([
      this.diffService.getLatestDiff(session.id),
      this.validationService.getLatestValidation(session.id),
      this.projectsRepository.findById(session.projectId),
      this.sessionMembersRepository.listBySessionId(session.id),
    ]);

    if (!project) {
      throw new NotFoundException(`Project ${session.projectId} was not found.`);
    }

    const userIds = [...new Set([project.ownerUserId, ...sessionMembers.map((member) => member.userId)])];
    const users = await Promise.all(
      userIds.map(async (userId) => [userId, await this.usersRepository.findById(userId)] as const),
    );
    const usersById = new Map(users);
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
      createdAt: session.createdAt.toISOString(),
      closedAt: session.closedAt?.toISOString() ?? null,
    };
  }
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
