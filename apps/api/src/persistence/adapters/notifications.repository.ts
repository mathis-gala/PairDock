import { Inject, Injectable } from '@nestjs/common';
import type { NotificationRecord } from '@pairdock/domain';
import { DatabaseClient, type DatabaseExecutor } from '../client.js';
import type { CreateNotificationInput, NotificationsRepository } from '../ports/notifications.repository.js';
import { mapNotification } from './mappers.js';

@Injectable()
export class NotificationsRepositoryAdapter implements NotificationsRepository {
  constructor(@Inject(DatabaseClient) private readonly prisma: DatabaseExecutor) {}

  async create(input: CreateNotificationInput): Promise<NotificationRecord> {
    const record = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        sessionId: input.sessionId ?? null,
        type: input.type,
        provider: input.provider ?? null,
        providerMessageId: input.providerMessageId ?? null,
        status: input.status,
      },
    });

    return mapNotification(record);
  }

  async findManyBySessionId(sessionId: string): Promise<NotificationRecord[]> {
    const records = await this.prisma.notification.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(mapNotification);
  }
}
