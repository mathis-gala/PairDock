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
  isPromptableSessionStatus,
  MAX_AGENT_PROMPT_LENGTH,
} from '@pairdock/shared-contracts';
import { AgentCommandRouterService } from '../agent-gateway/agent-command-router.service.js';
import type { UploadedScreenshot } from '../attachments/screenshot-validation.js';
import { SessionAttachmentsService } from '../attachments/session-attachments.service.js';
import { PERSISTENCE_UNIT_OF_WORK, SESSIONS_REPOSITORY } from '../persistence/persistence.tokens.js';
import type { PersistenceUnitOfWork } from '../persistence/ports/persistence-unit-of-work.js';
import type { SessionsRepository } from '../persistence/ports/sessions.repository.js';

export interface SessionPromptActor {
  userId: string;
  role: string;
}

export interface CreatePromptRequest {
  user?: PairDockIdentity;
  sessionMember?: SessionMember;
  content?: string;
  screenshots?: UploadedScreenshot[];
}

@Injectable()
export class SessionPromptService {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessionsRepository: SessionsRepository,
    @Inject(PERSISTENCE_UNIT_OF_WORK)
    private readonly persistenceUnitOfWork: PersistenceUnitOfWork,
    @Inject(AgentCommandRouterService)
    private readonly agentCommandRouter: AgentCommandRouterService,
    @Inject(SessionAttachmentsService)
    private readonly sessionAttachments: SessionAttachmentsService,
  ) {}

  async createPromptResponse(sessionId: string, request: CreatePromptRequest) {
    const content = request.content?.trim() ?? '';

    if (!content && !request.screenshots?.length) {
      throw new BadRequestException('Prompt content or at least one screenshot is required.');
    }

    if (content.length > MAX_AGENT_PROMPT_LENGTH) {
      throw new BadRequestException(`Prompt content must not exceed ${MAX_AGENT_PROMPT_LENGTH} characters.`);
    }

    const message = await this.createPrompt(sessionId, this.requirePromptActor(request), content, request.screenshots);

    return {
      ...message,
      createdAt: message.createdAt.toISOString(),
      attachments: message.attachments.map(toAttachmentView),
    };
  }

  async createPrompt(
    sessionId: string,
    actor: SessionPromptActor,
    content: string,
    screenshots?: UploadedScreenshot[],
  ) {
    const session = await this.requireSession(sessionId);

    if (!isPromptableSessionStatus(session.status)) {
      throw new ConflictException(
        `Session ${sessionId} must be ready, awaiting PM validation, or recoverable before prompting the local agent.`,
      );
    }

    const attachments = await this.sessionAttachments.create({
      sessionId,
      createdByUserId: actor.userId,
      purpose: 'prompt',
      visibility: 'private',
      files: screenshots,
    });

    try {
      const prompt = content || 'Analyse les captures jointes et applique les modifications nécessaires.';
      const command = buildAgentPromptCommand(sessionId, prompt, session.modelId, session.reasoningEffort, attachments);
      await this.agentCommandRouter.routeToOwningAgent(sessionId, command);
      const message = await this.persistenceUnitOfWork.execute(async (repositories) => {
        const createdMessage = await repositories.messages.create({
          sessionId,
          userId: actor.userId,
          role: actor.role,
          content,
        });
        await repositories.attachments.updateMessageId(
          attachments.map((attachment) => attachment.id),
          createdMessage.id,
        );
        return createdMessage;
      });
      return { ...message, attachments };
    } catch (error) {
      await this.sessionAttachments.remove(attachments);
      throw error;
    }
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
  attachments: Awaited<ReturnType<SessionAttachmentsService['create']>>,
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
      ...(attachments.length
        ? {
            attachments: attachments.map(toAttachmentView),
          }
        : {}),
      modelId,
      reasoningEffort,
    },
  };
}

function toAttachmentView(attachment: Awaited<ReturnType<SessionAttachmentsService['create']>>[number]) {
  return {
    id: attachment.id,
    fileName: attachment.originalName,
    mimeType: attachment.mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
    byteSize: attachment.byteSize,
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
