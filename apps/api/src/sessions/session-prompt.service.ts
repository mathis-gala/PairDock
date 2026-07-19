import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { PairDockIdentity, SessionMember } from '@pairdock/domain';
import {
  AGENT_PROTOCOL_VERSION,
  type AgentCancelCommandEnvelope,
  type AgentPromptCommandEnvelope,
} from '@pairdock/shared-contracts';
import { AgentCommandRouterService } from '../agent-gateway/agent-command-router.service.js';
import { MESSAGES_REPOSITORY, SESSIONS_REPOSITORY } from '../persistence/persistence.tokens.js';
import type { MessagesRepository } from '../persistence/ports/messages.repository.js';
import type { SessionsRepository } from '../persistence/ports/sessions.repository.js';

export interface SessionPromptActor {
  userId: string;
  role: string;
}

export interface CreatePromptRequest {
  user?: PairDockIdentity;
  sessionMember?: SessionMember;
  content?: string;
}

@Injectable()
export class SessionPromptService {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessionsRepository: SessionsRepository,
    @Inject(MESSAGES_REPOSITORY)
    private readonly messagesRepository: MessagesRepository,
    @Inject(AgentCommandRouterService)
    private readonly agentCommandRouter: AgentCommandRouterService,
  ) {}

  async createPromptResponse(sessionId: string, request: CreatePromptRequest) {
    const content = request.content?.trim();

    if (!content) {
      throw new BadRequestException('Prompt content is required.');
    }

    const message = await this.createPrompt(sessionId, this.requirePromptActor(request), content);

    return {
      ...message,
      createdAt: message.createdAt.toISOString(),
    };
  }

  async createPrompt(sessionId: string, actor: SessionPromptActor, content: string) {
    const session = await this.requireSession(sessionId);

    const promptableStatuses = new Set(['READY', 'AWAITING_PM_VALIDATION', 'FAILED']);

    if (!promptableStatuses.has(session.status)) {
      throw new ConflictException(
        `Session ${sessionId} must be ready, awaiting PM validation, or recoverable before prompting the local agent.`,
      );
    }

    const command = buildAgentPromptCommand(sessionId, content, session.modelId, session.reasoningEffort);
    await this.agentCommandRouter.routeToOwningAgent(sessionId, command);

    return this.messagesRepository.create({
      sessionId,
      userId: actor.userId,
      role: actor.role,
      content,
    });
  }

  async cancelPromptResponse(sessionId: string) {
    await this.cancelPrompt(sessionId);

    return {
      accepted: true,
      sessionId,
    };
  }

  async cancelPrompt(sessionId: string): Promise<void> {
    const session = await this.requireSession(sessionId);

    if (session.status !== 'AGENT_RUNNING') {
      throw new ConflictException(`Session ${sessionId} must be AGENT_RUNNING before cancellation is allowed.`);
    }

    await this.agentCommandRouter.routeToOwningAgent(sessionId, buildAgentCancelCommand(sessionId));
  }

  private requirePromptActor(request: CreatePromptRequest): SessionPromptActor {
    if (!request.user || !request.sessionMember) {
      throw new InternalServerErrorException('Authenticated session membership was not resolved.');
    }

    return {
      userId: request.user.id,
      role: request.sessionMember.role,
    };
  }

  private async requireSession(sessionId: string) {
    const session = await this.sessionsRepository.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} was not found.`);
    }

    return session;
  }
}

function buildAgentPromptCommand(
  sessionId: string,
  prompt: string,
  modelId: string,
  reasoningEffort: string,
): AgentPromptCommandEnvelope {
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: randomUUID(),
    sessionId,
    sentAt: new Date().toISOString(),
    type: 'agent.prompt',
    payload: {
      sessionId,
      prompt,
      modelId,
      reasoningEffort,
    },
  };
}

function buildAgentCancelCommand(sessionId: string): AgentCancelCommandEnvelope {
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: randomUUID(),
    sessionId,
    sentAt: new Date().toISOString(),
    type: 'agent.cancel',
    payload: {
      sessionId,
    },
  };
}
