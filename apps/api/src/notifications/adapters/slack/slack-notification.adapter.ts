import { Injectable } from '@nestjs/common';
import type { NotificationPort } from '@pairdock/domain';

interface SlackNotificationConfig {
  webhookUrl?: string;
}

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

@Injectable()
export class SlackNotificationAdapter implements NotificationPort {
  constructor(
    private readonly config: SlackNotificationConfig = readSlackConfig(),
    private readonly fetcher: Fetcher = fetch,
  ) {}

  async send(input: Parameters<NotificationPort['send']>[0]) {
    if (!this.config.webhookUrl) {
      return {
        provider: 'slack',
        providerMessageId: null,
        status: 'queued' as const,
      };
    }

    const response = await this.fetcher(this.config.webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: buildReviewRequestText(input),
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack review notification failed with ${response.status}.`);
    }

    return {
      provider: 'slack',
      providerMessageId: response.headers.get('x-slack-req-id'),
      status: 'sent' as const,
    };
  }
}

function readSlackConfig(): SlackNotificationConfig {
  return {
    webhookUrl: process.env.SLACK_REVIEW_REQUEST_WEBHOOK_URL,
  };
}

function buildReviewRequestText(input: Parameters<NotificationPort['send']>[0]): string {
  return `A draft review request is ready for ${input.projectName}: ${input.reviewRequestUrl}`;
}
