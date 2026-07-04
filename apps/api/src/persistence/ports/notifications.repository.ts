import type { NotificationRecord, NotificationStatus, NotificationType } from '@pairdock/domain';

export type { NotificationRecord } from '@pairdock/domain';

export interface CreateNotificationInput {
  userId: string;
  sessionId?: string | null;
  type: NotificationType;
  provider?: string | null;
  providerMessageId?: string | null;
  status: NotificationStatus;
}

export interface NotificationsRepository {
  create(input: CreateNotificationInput): Promise<NotificationRecord>;
  findManyBySessionId(sessionId: string): Promise<NotificationRecord[]>;
}
