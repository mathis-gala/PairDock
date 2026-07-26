import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  InternalServerErrorException,
  Param,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { createDraftReviewRequestInputSchema } from '@pairdock/shared-contracts';
import {
  MAX_SCREENSHOT_BYTES,
  MAX_SCREENSHOT_COUNT,
  type UploadedScreenshot,
} from '../attachments/screenshot-validation.js';
import type { AuthenticatedRequest } from '../auth/authenticated-request.js';
import { RequireAuth } from '../auth/require-auth.decorator.js';
import { RequireSessionAccess } from '../auth/require-session-access.decorator.js';
import { CreateDraftReviewRequestUseCase } from '../review-requests/create-draft-review-request.use-case.js';
import { SessionPromptService } from './session-prompt.service.js';
import type { SessionStartSource } from './session-start-policy.js';
import { SessionsService } from './sessions.service.js';

interface CreatePromptBody {
  content?: string;
}

interface CreateSessionBody {
  projectId?: string;
  startSource?: SessionStartSource;
}

@Controller('sessions')
export class SessionsController {
  constructor(
    @Inject(SessionsService)
    private readonly sessionsService: SessionsService,
    @Inject(SessionPromptService)
    private readonly sessionPromptService: SessionPromptService,
    @Inject(CreateDraftReviewRequestUseCase)
    private readonly createDraftReviewRequestUseCase: CreateDraftReviewRequestUseCase,
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
  @UseInterceptors(
    FilesInterceptor('screenshots', MAX_SCREENSHOT_COUNT, {
      limits: { fileSize: MAX_SCREENSHOT_BYTES },
    }),
  )
  createPrompt(
    @Param('sessionId') sessionId: string,
    @Body() body: CreatePromptBody | undefined,
    @Req() request: AuthenticatedRequest,
    @UploadedFiles() screenshots: UploadedScreenshot[] | undefined,
  ) {
    return this.sessionPromptService.createPromptResponse(sessionId, {
      content: body?.content,
      sessionMember: request.sessionMember,
      user: request.user,
      screenshots,
    });
  }

  @Post(':sessionId/prompts/cancel')
  @HttpCode(202)
  @RequireSessionAccess()
  cancelPrompt(@Param('sessionId') sessionId: string) {
    return this.sessionPromptService.cancelPromptResponse(sessionId);
  }

  @Post(':sessionId/review-request')
  @RequireSessionAccess()
  @UseInterceptors(
    FilesInterceptor('screenshots', MAX_SCREENSHOT_COUNT, {
      limits: { fileSize: MAX_SCREENSHOT_BYTES },
    }),
  )
  createDraftReviewRequest(
    @Param('sessionId') sessionId: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
    @UploadedFiles() screenshots: UploadedScreenshot[] | undefined,
  ) {
    if (!request.user) {
      throw new InternalServerErrorException('Authenticated user was not resolved.');
    }

    const input = createDraftReviewRequestInputSchema.safeParse(body);

    if (!input.success) {
      throw new BadRequestException('PR type, title, and description are required.');
    }

    return this.createDraftReviewRequestUseCase.create(sessionId, request.user, input.data, screenshots);
  }
}
