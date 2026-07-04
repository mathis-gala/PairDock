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

    const parsed = parseTokenPayload(Buffer.from(payload, 'base64url').toString('utf8'));

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

function parseTokenPayload(rawPayload: string): TokenPayload {
  let value: unknown;
  try {
    value = JSON.parse(rawPayload);
  } catch {
    throw new UnauthorizedException('Malformed authentication token.');
  }

  if (!isRecord(value)) {
    throw new UnauthorizedException('Malformed authentication token.');
  }

  const { id, email, displayName, kind, iat } = value;

  if (
    typeof id !== 'string' ||
    typeof email !== 'string' ||
    (displayName !== null && typeof displayName !== 'string') ||
    typeof kind !== 'string' ||
    !isUserKind(kind) ||
    typeof iat !== 'string'
  ) {
    throw new UnauthorizedException('Malformed authentication token.');
  }

  return { id, email, displayName, kind, iat };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isUserKind(value: string): value is TokenPayload['kind'] {
  return value === 'developer' || value === 'pm';
}
