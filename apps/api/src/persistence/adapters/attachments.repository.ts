import { Inject, Injectable } from '@nestjs/common';
import type { SessionAttachment } from '@pairdock/domain';
import { DatabaseClient, type DatabaseExecutor } from '../client.js';
import type { AttachmentsRepository, CreateAttachmentInput } from '../ports/attachments.repository.js';
import { mapAttachment } from './mappers.js';

@Injectable()
export class AttachmentsRepositoryAdapter implements AttachmentsRepository {
  constructor(@Inject(DatabaseClient) private readonly prisma: DatabaseExecutor) {}

  async create(input: CreateAttachmentInput): Promise<SessionAttachment> {
    const record = await this.prisma.attachment.create({
      data: {
        ...(input.id ? { id: input.id } : {}),
        sessionId: input.sessionId,
        messageId: input.messageId ?? null,
        createdByUserId: input.createdByUserId,
        purpose: input.purpose,
        visibility: input.visibility,
        objectKey: input.objectKey,
        originalName: input.originalName,
        mimeType: input.mimeType,
        byteSize: input.byteSize,
      },
    });

    return mapAttachment(record);
  }

  async deleteByIds(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.prisma.attachment.deleteMany({ where: { id: { in: ids } } });
  }

  async findById(id: string): Promise<SessionAttachment | null> {
    const record = await this.prisma.attachment.findUnique({ where: { id } });
    return record ? mapAttachment(record) : null;
  }

  async listByMessageIds(messageIds: string[]): Promise<SessionAttachment[]> {
    if (messageIds.length === 0) {
      return [];
    }

    const records = await this.prisma.attachment.findMany({
      where: { messageId: { in: messageIds } },
      orderBy: { createdAt: 'asc' },
    });
    return records.map(mapAttachment);
  }

  async updateMessageId(ids: string[], messageId: string): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.prisma.attachment.updateMany({
      where: { id: { in: ids } },
      data: { messageId },
    });
  }
}
