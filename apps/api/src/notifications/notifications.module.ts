import { Module } from '@nestjs/common';
import { SlackNotificationAdapter } from './adapters/slack/slack-notification.adapter.js';
import { NOTIFICATION_PORT } from './notifications.tokens.js';

@Module({
  providers: [SlackNotificationAdapter, { provide: NOTIFICATION_PORT, useExisting: SlackNotificationAdapter }],
  exports: [NOTIFICATION_PORT],
})
export class NotificationsModule {}
