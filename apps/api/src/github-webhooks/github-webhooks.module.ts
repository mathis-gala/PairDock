import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { GithubWebhookSignatureService } from './github-webhook-signature.service.js';
import { GithubWebhooksController } from './github-webhooks.controller.js';
import { GithubWebhooksService } from './github-webhooks.service.js';

@Module({
  imports: [PersistenceModule],
  controllers: [GithubWebhooksController],
  providers: [GithubWebhookSignatureService, GithubWebhooksService],
})
export class GithubWebhooksModule {}
