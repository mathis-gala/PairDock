import { Inject, Injectable } from '@nestjs/common';
import type { SessionMessage } from '@pairdock/domain';
import { DatabaseClient, type DatabaseExecutor } from '../client.js';
import type { CreateMessageInput, MessagesRepository } from '../ports/messages.repository.js';
import { mapMessage } from './mappers.js';

@Injectable()
export class MessagesRepositoryAdapter implements MessagesRepository {
  constructor(@Inject(DatabaseClient) private readonly prisma: DatabaseExecutor) {}

  async create(input: CreateMessageInput): Promise<SessionMessage> {
    const record = await this.prisma.message.create({
      data: {
        sessionId: input.sessionId,
        userId: input.userId ?? null,
        role: input.role,
        content: input.content,
      },
    });

    return mapMessage(record);
  }

  async listBySessionId(sessionId: string): Promise<SessionMessage[]> {
    const records = await this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    return records.map(mapMessage);
  }
}
