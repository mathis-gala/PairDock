import { createHmac, timingSafeEqual } from 'node:crypto';
import { Inject, Injectable, Optional, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';

const MINIMUM_WEBHOOK_SECRET_LENGTH = 24;

export const GITHUB_WEBHOOK_SECRET = Symbol('GITHUB_WEBHOOK_SECRET');

@Injectable()
export class GithubWebhookSignatureService {
  private readonly secret: Buffer | null;

  constructor(
    @Optional()
    @Inject(GITHUB_WEBHOOK_SECRET)
    explicitSecret?: string,
  ) {
    this.secret = resolveSecret(explicitSecret);
  }

  verify(rawBody: Buffer, signatureHeader: string | undefined): void {
    if (!this.secret) {
      throw new ServiceUnavailableException('GitHub webhook handling is not configured.');
    }

    if (!signatureHeader?.startsWith('sha256=')) {
      throw new UnauthorizedException('Missing or invalid GitHub webhook signature.');
    }

    const expectedSignature = `sha256=${createHmac('sha256', this.secret).update(rawBody).digest('hex')}`;
    const actualBuffer = Buffer.from(signatureHeader);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
      throw new UnauthorizedException('Invalid GitHub webhook signature.');
    }
  }
}

function resolveSecret(explicitSecret?: string): Buffer | null {
  const secret = explicitSecret ?? process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('GITHUB_WEBHOOK_SECRET is required in production.');
    }

    return null;
  }

  if (Buffer.byteLength(secret) < MINIMUM_WEBHOOK_SECRET_LENGTH) {
    throw new Error(`GITHUB_WEBHOOK_SECRET must contain at least ${MINIMUM_WEBHOOK_SECRET_LENGTH} bytes.`);
  }

  return Buffer.from(secret);
}
