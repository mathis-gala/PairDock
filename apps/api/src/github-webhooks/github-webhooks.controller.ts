import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
} from '@nestjs/common';
import { GithubWebhookSignatureService } from './github-webhook-signature.service.js';
import { GithubWebhooksService } from './github-webhooks.service.js';

interface RawBodyRequest {
  rawBody?: Buffer;
}

@Controller('webhooks/github')
export class GithubWebhooksController {
  constructor(
    @Inject(GithubWebhookSignatureService)
    private readonly signatureService: GithubWebhookSignatureService,
    @Inject(GithubWebhooksService)
    private readonly webhooksService: GithubWebhooksService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Req() request: RawBodyRequest,
    @Body() payload: unknown,
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Headers('x-github-event') eventName: string | undefined,
    @Headers('x-github-delivery') deliveryId: string | undefined,
  ): Promise<{ accepted: true }> {
    if (!request.rawBody) {
      throw new BadRequestException('Raw GitHub webhook body is unavailable.');
    }

    this.signatureService.verify(request.rawBody, signature);

    if (!eventName?.trim()) {
      throw new BadRequestException('Missing X-GitHub-Event header.');
    }

    if (!deliveryId?.trim()) {
      throw new BadRequestException('Missing X-GitHub-Delivery header.');
    }

    await this.webhooksService.handle(eventName, payload);

    return { accepted: true };
  }
}
