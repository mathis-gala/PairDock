import { timingSafeEqual } from 'node:crypto';
import { Inject, Injectable, Optional, UnauthorizedException } from '@nestjs/common';

const MINIMUM_AGENT_TOKEN_LENGTH = 32;

export interface AgentAuthenticationOptions {
  nodeEnv?: string;
  credentials?: Record<string, AgentCredentialInput>;
  credentialsJson?: string;
}

export interface AgentCredentialInput {
  projectKeys: string[];
  token: string;
}

export interface AuthenticatedAgentPrincipal {
  agentId: string;
  projectKeys: string[];
}

export const AGENT_AUTHENTICATION_OPTIONS = Symbol('AGENT_AUTHENTICATION_OPTIONS');

@Injectable()
export class AgentAuthenticationService {
  private readonly credentials: Array<AuthenticatedAgentPrincipal & { token: Buffer }>;

  constructor(
    @Optional()
    @Inject(AGENT_AUTHENTICATION_OPTIONS)
    options: AgentAuthenticationOptions = {},
  ) {
    const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV;
    const configuredCredentials =
      options.credentials ?? parseCredentials(options.credentialsJson ?? process.env.AGENT_AUTH_CREDENTIALS_JSON);

    if (!configuredCredentials || Object.keys(configuredCredentials).length === 0) {
      if (nodeEnv !== 'test') {
        throw new Error('AGENT_AUTH_CREDENTIALS_JSON is required outside automated tests.');
      }

      this.credentials = [];
      return;
    }

    const tokens = new Set<string>();
    const assignedProjectKeys = new Set<string>();
    this.credentials = Object.entries(configuredCredentials).map(([agentId, credential]) => {
      if (!/^[A-Za-z0-9._-]{1,128}$/.test(agentId)) {
        throw new Error(`Invalid agent id in AGENT_AUTH_CREDENTIALS_JSON: ${agentId}.`);
      }

      if (!isRecord(credential) || !Array.isArray(credential.projectKeys)) {
        throw new Error(`Credential for ${agentId} must define token and projectKeys.`);
      }

      const { token } = credential;
      if (typeof token !== 'string' || Buffer.byteLength(token) < MINIMUM_AGENT_TOKEN_LENGTH) {
        throw new Error(`Agent authentication tokens must contain at least ${MINIMUM_AGENT_TOKEN_LENGTH} bytes.`);
      }

      if (tokens.has(token)) {
        throw new Error('Agent authentication tokens must be unique.');
      }

      tokens.add(token);
      const projectKeys = [...new Set(credential.projectKeys)];

      if (projectKeys.length === 0 || projectKeys.some((key) => !/^[A-Za-z0-9._-]{1,128}$/.test(key))) {
        throw new Error(`Credential for ${agentId} must contain at least one valid project key.`);
      }

      for (const projectKey of projectKeys) {
        if (assignedProjectKeys.has(projectKey)) {
          throw new Error(`Agent project key ${projectKey} must be assigned to exactly one credential.`);
        }
        assignedProjectKeys.add(projectKey);
      }

      return { agentId, projectKeys, token: Buffer.from(token) };
    });
  }

  authenticate(authorizationHeader: string | string[] | undefined): AuthenticatedAgentPrincipal | null {
    if (this.credentials.length === 0) {
      return null;
    }

    const suppliedToken = extractBearerToken(authorizationHeader);
    const suppliedBuffer = Buffer.from(suppliedToken);

    for (const credential of this.credentials) {
      if (suppliedBuffer.length === credential.token.length && timingSafeEqual(suppliedBuffer, credential.token)) {
        return { agentId: credential.agentId, projectKeys: [...credential.projectKeys] };
      }
    }

    throw new UnauthorizedException('Invalid agent authentication token.');
  }
}

function parseCredentials(rawCredentials: string | undefined): Record<string, AgentCredentialInput> | undefined {
  if (!rawCredentials) {
    return undefined;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawCredentials);
  } catch {
    throw new Error('AGENT_AUTH_CREDENTIALS_JSON must contain valid JSON.');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('AGENT_AUTH_CREDENTIALS_JSON must be a JSON object mapping agent ids to tokens.');
  }

  return parsed as Record<string, AgentCredentialInput>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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
