import { Module } from '@nestjs/common';
import { QueuedNotificationAdapter } from './adapters/queued-notification.adapter.js';
import { NOTIFICATION_PORT } from './notifications.tokens.js';

@Module({
  providers: [QueuedNotificationAdapter, { provide: NOTIFICATION_PORT, useExisting: QueuedNotificationAdapter }],
  exports: [NOTIFICATION_PORT],
})
export class NotificationsModule {}
