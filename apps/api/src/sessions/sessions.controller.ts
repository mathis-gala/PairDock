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
import type { AuthenticatedRequest } from '../auth/authenticated-request.js';
import { RequireAuth } from '../auth/require-auth.decorator.js';
import { RequireSessionAccess } from '../auth/require-session-access.decorator.js';
import { DiffService } from '../diff/diff.service.js';
import { SESSIONS_REPOSITORY } from '../persistence/persistence.tokens.js';
import type { SessionsRepository } from '../persistence/ports/sessions.repository.js';
import { ValidationService } from '../validation/validation.service.js';
import { SessionCloseService } from './session-close.service.js';
import { SessionPromptService } from './session-prompt.service.js';
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
    const [latestDiff, latestValidation] = await Promise.all([
      this.diffService.getLatestDiff(session.id),
      this.validationService.getLatestValidation(session.id),
    ]);

    return {
      ...session,
      latestDiff,
      latestValidation,
      createdAt: session.createdAt.toISOString(),
      closedAt: session.closedAt?.toISOString() ?? null,
    };
  }
}
