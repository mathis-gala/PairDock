import { Injectable } from '@nestjs/common';
import type { NotificationPort } from '@pairdock/domain';

@Injectable()
export class QueuedNotificationAdapter implements NotificationPort {
  async send(): ReturnType<NotificationPort['send']> {
    return {
      provider: null,
      providerMessageId: null,
      status: 'queued',
    };
  }
}
