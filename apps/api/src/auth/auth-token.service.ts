import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { PairDockIdentity } from '@pairdock/domain';

interface TokenPayload extends PairDockIdentity {
  aud: 'pairdock-web';
  exp: number;
  iat: number;
  iss: 'pairdock-api';
}

export interface AuthTokenOptions {
  now?: () => number;
  secret?: string;
  ttlMs?: number;
}

const DEFAULT_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const MINIMUM_SECRET_LENGTH = 32;

@Injectable()
export class AuthTokenService {
  private readonly now: () => number;
  private readonly secret: Buffer;
  private readonly ttlMs: number;

  constructor(options: AuthTokenOptions = {}) {
    this.now = options.now ?? Date.now;
    this.secret = resolveSecret(options.secret);
    this.ttlMs = options.ttlMs ?? DEFAULT_TOKEN_TTL_MS;
  }

  issue(user: PairDockIdentity): string {
    const issuedAt = this.now();
    const payload = Buffer.from(
      JSON.stringify({
        ...user,
        aud: 'pairdock-web',
        exp: issuedAt + this.ttlMs,
        iat: issuedAt,
        iss: 'pairdock-api',
      } satisfies TokenPayload),
    ).toString('base64url');
    const signature = this.sign(payload);

    return `${payload}.${signature}`;
  }

  verify(token: string): PairDockIdentity {
    const parts = token.split('.');

    if (parts.length !== 2) {
      throw new UnauthorizedException('Missing authentication token.');
    }

    const [payload, signature] = parts;

    if (!payload || !signature) {
      throw new UnauthorizedException('Missing authentication token.');
    }

    if (!hasValidSignature(signature, this.sign(payload))) {
      throw new UnauthorizedException('Invalid authentication token.');
    }

    const parsed = parseTokenPayload(Buffer.from(payload, 'base64url').toString('utf8'));

    if (parsed.exp <= this.now()) {
      throw new UnauthorizedException('Authentication token has expired.');
    }

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

  const { aud, email, exp, iat, id, iss, displayName, kind } = value;

  if (
    aud !== 'pairdock-web' ||
    typeof id !== 'string' ||
    typeof email !== 'string' ||
    (displayName !== null && typeof displayName !== 'string') ||
    typeof kind !== 'string' ||
    !isUserKind(kind) ||
    typeof iat !== 'number' ||
    !Number.isFinite(iat) ||
    typeof exp !== 'number' ||
    !Number.isFinite(exp) ||
    exp <= iat ||
    iss !== 'pairdock-api'
  ) {
    throw new UnauthorizedException('Malformed authentication token.');
  }

  return { id, email, displayName, kind, aud, exp, iat, iss };
}

function resolveSecret(explicitSecret?: string): Buffer {
  const secret = explicitSecret ?? process.env.AUTH_TOKEN_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_TOKEN_SECRET is required in production.');
    }

    return randomBytes(32);
  }

  if (Buffer.byteLength(secret) < MINIMUM_SECRET_LENGTH) {
    throw new Error(`AUTH_TOKEN_SECRET must contain at least ${MINIMUM_SECRET_LENGTH} bytes.`);
  }

  return Buffer.from(secret);
}

function hasValidSignature(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isUserKind(value: string): value is TokenPayload['kind'] {
  return value === 'developer' || value === 'pm';
}
