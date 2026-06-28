import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-request.js';
import { RequireSessionAccess } from '../auth/require-session-access.decorator.js';
import { MESSAGES_REPOSITORY, SESSIONS_REPOSITORY } from '../persistence/persistence.tokens.js';
import type { MessagesRepository } from '../persistence/ports/messages.repository.js';
import type { SessionsRepository } from '../persistence/ports/sessions.repository.js';

interface CreatePromptBody {
  content: string;
}

@Controller('sessions')
@RequireSessionAccess()
export class SessionsController {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessionsRepository: SessionsRepository,
    @Inject(MESSAGES_REPOSITORY)
    private readonly messagesRepository: MessagesRepository,
  ) {}

  @Get(':sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    const session = await this.sessionsRepository.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} was not found.`);
    }

    return {
      ...session,
      createdAt: session.createdAt.toISOString(),
      closedAt: session.closedAt?.toISOString() ?? null,
    };
  }

  @Post(':sessionId/prompts')
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
}
