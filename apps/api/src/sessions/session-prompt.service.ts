import { randomUUID } from 'node:crypto';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
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

  async createPrompt(sessionId: string, actor: SessionPromptActor, content: string) {
    const session = await this.requireSession(sessionId);

    if (session.status !== 'READY') {
      throw new ConflictException(`Session ${sessionId} must be READY before prompting the local agent.`);
    }

    const command = buildAgentPromptCommand(sessionId, content, session.modelId);
    await this.agentCommandRouter.routeToOwningAgent(sessionId, command);

    return this.messagesRepository.create({
      sessionId,
      userId: actor.userId,
      role: actor.role,
      content,
    });
  }

  async cancelPrompt(sessionId: string): Promise<void> {
    const session = await this.requireSession(sessionId);

    if (session.status !== 'AGENT_RUNNING') {
      throw new ConflictException(`Session ${sessionId} must be AGENT_RUNNING before cancellation is allowed.`);
    }

    await this.agentCommandRouter.routeToOwningAgent(sessionId, buildAgentCancelCommand(sessionId));
  }

  private async requireSession(sessionId: string) {
    const session = await this.sessionsRepository.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} was not found.`);
    }

    return session;
  }
}

function buildAgentPromptCommand(sessionId: string, prompt: string, modelId: string): AgentPromptCommandEnvelope {
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
