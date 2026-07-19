import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';

type GithubAuthStatePurpose = 'installation' | 'authorization' | 'slack-authorization';

interface GithubAuthStatePayload {
  exp: number;
  iat: number;
  installationId?: string;
  nonce: string;
  purpose: GithubAuthStatePurpose;
  version: 1;
}

export interface GithubAuthStateOptions {
  now?: () => number;
  secret?: string;
  ttlMs?: number;
}

const DEFAULT_STATE_TTL_MS = 10 * 60 * 1000;
const MINIMUM_SECRET_LENGTH = 32;

@Injectable()
export class GithubAuthStateService {
  private readonly now: () => number;
  private readonly secret: Buffer;
  private readonly ttlMs: number;

  constructor(options: GithubAuthStateOptions = {}) {
    this.now = options.now ?? Date.now;
    this.secret = resolveSecret(options.secret);
    this.ttlMs = options.ttlMs ?? DEFAULT_STATE_TTL_MS;
  }

  issueInstallationState(): string {
    return this.issue('installation');
  }

  verifyInstallationState(state: string): void {
    this.verify(state, 'installation');
  }

  issueAuthorizationState(installationId?: string): string {
    if (installationId !== undefined) {
      assertInstallationId(installationId);
    }

    return this.issue('authorization', installationId);
  }

  verifyAuthorizationState(state: string): string | undefined {
    const payload = this.verify(state, 'authorization');
    return payload.installationId;
  }

  issueSlackAuthorizationState(): string {
    return this.issue('slack-authorization');
  }

  verifySlackAuthorizationState(state: string): void {
    this.verify(state, 'slack-authorization');
  }

  private issue(purpose: GithubAuthStatePurpose, installationId?: string): string {
    const issuedAt = this.now();
    const payload: GithubAuthStatePayload = {
      version: 1,
      purpose,
      nonce: randomBytes(24).toString('base64url'),
      iat: issuedAt,
      exp: issuedAt + this.ttlMs,
      ...(installationId ? { installationId } : {}),
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    return `${encodedPayload}.${this.sign(encodedPayload)}`;
  }

  private verify(state: string, expectedPurpose: GithubAuthStatePurpose): GithubAuthStatePayload {
    const parts = state.split('.');

    if (parts.length !== 2) {
      throw invalidState();
    }

    const [encodedPayload, signature] = parts;

    if (!encodedPayload || !signature || !hasValidSignature(signature, this.sign(encodedPayload))) {
      throw invalidState();
    }

    const payload = parsePayload(encodedPayload);

    if (payload.purpose !== expectedPurpose || payload.exp < this.now()) {
      throw invalidState();
    }

    return payload;
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.secret).update(payload).digest('base64url');
  }
}

function parsePayload(encodedPayload: string): GithubAuthStatePayload {
  let value: unknown;

  try {
    value = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch {
    throw invalidState();
  }

  if (!isRecord(value)) {
    throw invalidState();
  }

  const { exp, iat, installationId, nonce, purpose, version } = value;

  if (
    version !== 1 ||
    (purpose !== 'installation' && purpose !== 'authorization' && purpose !== 'slack-authorization') ||
    typeof nonce !== 'string' ||
    nonce.length < 16 ||
    typeof iat !== 'number' ||
    !Number.isFinite(iat) ||
    typeof exp !== 'number' ||
    !Number.isFinite(exp) ||
    exp <= iat ||
    (installationId !== undefined && (typeof installationId !== 'string' || !isInstallationId(installationId)))
  ) {
    throw invalidState();
  }

  return {
    version,
    purpose,
    nonce,
    iat,
    exp,
    ...(typeof installationId === 'string' ? { installationId } : {}),
  };
}

function resolveSecret(explicitSecret?: string): Buffer {
  const secret = explicitSecret ?? process.env.AUTH_STATE_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_STATE_SECRET is required in production.');
    }

    return randomBytes(32);
  }

  if (Buffer.byteLength(secret) < MINIMUM_SECRET_LENGTH) {
    throw new Error(`AUTH_STATE_SECRET must contain at least ${MINIMUM_SECRET_LENGTH} bytes.`);
  }

  return Buffer.from(secret);
}

function hasValidSignature(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function assertInstallationId(installationId: string): void {
  if (!isInstallationId(installationId)) {
    throw invalidState();
  }
}

function isInstallationId(value: string): boolean {
  return /^\d+$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function invalidState(): BadRequestException {
  return new BadRequestException('Invalid GitHub authentication state.');
}
