import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { PairDockIdentity } from '@pairdock/domain';

interface TokenPayload extends PairDockIdentity {
  iat: string;
}

@Injectable()
export class AuthTokenService {
  private readonly secret = createHmac('sha256', 'pairdock-auth-bootstrap')
    .update(`${process.pid}:${Date.now()}`)
    .digest();

  issue(user: PairDockIdentity): string {
    const payload = Buffer.from(
      JSON.stringify({ ...user, iat: new Date().toISOString() } satisfies TokenPayload),
    ).toString('base64url');
    const signature = this.sign(payload);

    return `${payload}.${signature}`;
  }

  verify(token: string): PairDockIdentity {
    const [payload, signature] = token.split('.');

    if (!payload || !signature) {
      throw new UnauthorizedException('Missing authentication token.');
    }

    const expectedSignature = this.sign(payload);

    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      throw new UnauthorizedException('Invalid authentication token.');
    }

    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as TokenPayload;

    return {
      id: parsed.id,
      email: parsed.email,
      displayName: parsed.displayName,
      kind: parsed.kind,
    };
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.secret).update(payload).digest('base64url');
  }
}
