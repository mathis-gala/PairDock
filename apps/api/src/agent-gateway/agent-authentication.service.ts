import { timingSafeEqual } from 'node:crypto';
import { Inject, Injectable, Optional, UnauthorizedException } from '@nestjs/common';

const MINIMUM_AGENT_TOKEN_LENGTH = 32;

export interface AgentAuthenticationOptions {
  nodeEnv?: string;
  token?: string;
}

export const AGENT_AUTHENTICATION_OPTIONS = Symbol('AGENT_AUTHENTICATION_OPTIONS');

@Injectable()
export class AgentAuthenticationService {
  private readonly token: Buffer | null;

  constructor(
    @Optional()
    @Inject(AGENT_AUTHENTICATION_OPTIONS)
    options: AgentAuthenticationOptions = {},
  ) {
    const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV;
    const configuredToken = options.token ?? process.env.AGENT_AUTH_TOKEN;

    if (!configuredToken) {
      if (nodeEnv === 'production') {
        throw new Error('AGENT_AUTH_TOKEN is required in production.');
      }

      this.token = null;
      return;
    }

    if (Buffer.byteLength(configuredToken) < MINIMUM_AGENT_TOKEN_LENGTH) {
      throw new Error(`AGENT_AUTH_TOKEN must contain at least ${MINIMUM_AGENT_TOKEN_LENGTH} bytes.`);
    }

    this.token = Buffer.from(configuredToken);
  }

  assertAuthorized(authorizationHeader: string | string[] | undefined): void {
    if (!this.token) {
      return;
    }

    const suppliedToken = extractBearerToken(authorizationHeader);
    const suppliedBuffer = Buffer.from(suppliedToken);

    if (suppliedBuffer.length !== this.token.length || !timingSafeEqual(suppliedBuffer, this.token)) {
      throw new UnauthorizedException('Invalid agent authentication token.');
    }
  }
}

function extractBearerToken(authorizationHeader: string | string[] | undefined): string {
  if (typeof authorizationHeader !== 'string' || !authorizationHeader.startsWith('Bearer ')) {
    throw new UnauthorizedException('Missing agent authentication token.');
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();

  if (!token) {
    throw new UnauthorizedException('Missing agent authentication token.');
  }

  return token;
}
