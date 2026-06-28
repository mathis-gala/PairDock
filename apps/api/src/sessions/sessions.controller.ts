import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { PairDockIdentity, Session } from '@pairdock/domain';
import type { AuthenticatedRequest } from '../auth/authenticated-request.js';
import { RequireAuth } from '../auth/require-auth.decorator.js';
import { RequireSessionAccess } from '../auth/require-session-access.decorator.js';
import { MESSAGES_REPOSITORY, SESSIONS_REPOSITORY } from '../persistence/persistence.tokens.js';
import type { MessagesRepository } from '../persistence/ports/messages.repository.js';
import type { SessionsRepository } from '../persistence/ports/sessions.repository.js';
import { SessionCloseService } from './session-close.service.js';
import type { SessionAgentEvent } from './session-state-machine.js';
import { SessionsService } from './sessions.service.js';

interface CreatePromptBody {
  content: string;
}

interface CreateSessionBody {
  projectId: string;
  modelId: string;
}

@Controller('sessions')
export class SessionsController {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessionsRepository: SessionsRepository,
    @Inject(MESSAGES_REPOSITORY)
    private readonly messagesRepository: MessagesRepository,
    @Inject(SessionsService)
    private readonly sessionsService: SessionsService,
    @Inject(SessionCloseService)
    private readonly sessionCloseService: SessionCloseService,
  ) {}

  @Get(':sessionId')
  @RequireSessionAccess()
  async getSession(@Param('sessionId') sessionId: string) {
    const session = await this.sessionsRepository.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} was not found.`);
    }

    return this.serializeSession(session);
  }

  @Post()
  @RequireAuth()
  async createSession(@Body() body: CreateSessionBody, @Req() request: AuthenticatedRequest) {
    const projectId = body.projectId?.trim();
    const modelId = body.modelId?.trim();
    const user = this.requireUser(request.user);

    if (!projectId) {
      throw new BadRequestException('Project id is required.');
    }

    if (!modelId) {
      throw new BadRequestException('Model id is required.');
    }

    const session = await this.sessionsService.createSession({ projectId, modelId }, user);

    return this.serializeSession(session);
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

    return this.serializeSession(session);
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

    return this.serializeSession(closedSession);
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

    const message = await this.messagesRepository.create({
      sessionId,
      userId: user.id,
      role: sessionMember.role,
      content,
    });

    return {
      ...message,
      createdAt: message.createdAt.toISOString(),
    };
  }

  private requireUser(user: PairDockIdentity | undefined): PairDockIdentity {
    if (!user) {
      throw new InternalServerErrorException('Authenticated user was not resolved.');
    }

    return user;
  }

  private serializeSession(session: Session) {
    return {
      ...session,
      createdAt: session.createdAt.toISOString(),
      closedAt: session.closedAt?.toISOString() ?? null,
    };
  }
}
