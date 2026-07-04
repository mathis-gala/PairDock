import { Body, Controller, Get, HttpCode, Inject, Param, Post, Req } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-request.js';
import { RequireAuth } from '../auth/require-auth.decorator.js';
import { RequireSessionAccess } from '../auth/require-session-access.decorator.js';
import { SessionPromptService } from './session-prompt.service.js';
import type { SessionStartSource } from './session-start-policy.js';
import { SessionsService } from './sessions.service.js';

interface CreatePromptBody {
  content?: string;
}

interface CreateSessionBody {
  projectId?: string;
  modelId?: string;
  startSource?: SessionStartSource;
}

@Controller('sessions')
export class SessionsController {
  constructor(
    @Inject(SessionsService)
    private readonly sessionsService: SessionsService,
    @Inject(SessionPromptService)
    private readonly sessionPromptService: SessionPromptService,
  ) {}

  @Get(':sessionId')
  @RequireSessionAccess()
  getSession(@Param('sessionId') sessionId: string) {
    return this.sessionsService.getSessionResponse(sessionId);
  }

  @Get(':sessionId/messages')
  @RequireSessionAccess()
  listMessages(@Param('sessionId') sessionId: string) {
    return this.sessionsService.listMessages(sessionId);
  }

  @Get(':sessionId/events')
  @RequireSessionAccess()
  listEvents(@Param('sessionId') sessionId: string) {
    return this.sessionsService.listEvents(sessionId);
  }

  @Post()
  @RequireAuth()
  createSession(@Body() body: CreateSessionBody | undefined, @Req() request: AuthenticatedRequest) {
    return this.sessionsService.createSessionResponse(body, request.user);
  }

  @Post(':sessionId/events')
  @RequireAuth()
  applyAgentEvent(@Param('sessionId') sessionId: string, @Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return this.sessionsService.applyAgentEventResponse(sessionId, body, request.user);
  }

  @Post(':sessionId/close')
  @RequireAuth()
  closeSession(@Param('sessionId') sessionId: string, @Req() request: AuthenticatedRequest) {
    return this.sessionsService.closeSessionResponse(sessionId, request.user);
  }

  @Post(':sessionId/prompts')
  @RequireSessionAccess()
  createPrompt(
    @Param('sessionId') sessionId: string,
    @Body() body: CreatePromptBody | undefined,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.sessionPromptService.createPromptResponse(sessionId, {
      content: body?.content,
      sessionMember: request.sessionMember,
      user: request.user,
    });
  }

  @Post(':sessionId/prompts/cancel')
  @HttpCode(202)
  @RequireSessionAccess()
  cancelPrompt(@Param('sessionId') sessionId: string) {
    return this.sessionPromptService.cancelPromptResponse(sessionId);
  }
}
