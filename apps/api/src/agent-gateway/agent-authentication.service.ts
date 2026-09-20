import { createHash, timingSafeEqual } from 'node:crypto';
import { Inject, Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { AGENT_ENROLLMENT_REPOSITORY } from '../persistence/persistence.tokens.js';
import type { AgentEnrollmentRepository } from '../persistence/ports/agent-enrollment.repository.js';

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
  ownerUserId?: string;
  projectKeyPrefix?: string;
}

export const AGENT_AUTHENTICATION_OPTIONS = Symbol('AGENT_AUTHENTICATION_OPTIONS');

@Injectable()
export class AgentAuthenticationService {
  private readonly credentials: Array<AuthenticatedAgentPrincipal & { token: Buffer }>;
  private readonly allowUnconfiguredTestAgent: boolean;

  constructor(
    @Optional()
    @Inject(AGENT_AUTHENTICATION_OPTIONS)
    options: AgentAuthenticationOptions = {},
    @Optional()
    @Inject(AGENT_ENROLLMENT_REPOSITORY)
    private readonly enrollment?: AgentEnrollmentRepository,
  ) {
    const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV;
    this.allowUnconfiguredTestAgent = nodeEnv === 'test';
    const configuredCredentials =
      options.credentials ?? parseCredentials(options.credentialsJson ?? process.env.AGENT_AUTH_CREDENTIALS_JSON);

    if (!configuredCredentials || Object.keys(configuredCredentials).length === 0) {
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

  async authenticate(authorizationHeader: string | string[] | undefined): Promise<AuthenticatedAgentPrincipal | null> {
    if (this.allowUnconfiguredTestAgent && this.credentials.length === 0 && !authorizationHeader) {
      return null;
    }

    const suppliedToken = extractBearerToken(authorizationHeader);
    const suppliedBuffer = Buffer.from(suppliedToken);

    for (const credential of this.credentials) {
      if (suppliedBuffer.length === credential.token.length && timingSafeEqual(suppliedBuffer, credential.token)) {
        return { agentId: credential.agentId, projectKeys: [...credential.projectKeys] };
      }
    }

    const credential = await this.enrollment?.findCredentialByHash(hashAgentSecret(suppliedToken));
    if (credential && !credential.revokedAt) {
      return {
        agentId: credential.agentId,
        projectKeys: [],
        ownerUserId: credential.ownerUserId,
        projectKeyPrefix: credential.projectKeyPrefix,
      };
    }

    throw new UnauthorizedException('Invalid agent authentication token.');
  }

  async assertActive(principal: AuthenticatedAgentPrincipal): Promise<void> {
    if (!principal.ownerUserId) return;
    const credential = await this.enrollment?.findCredentialByAgentId(principal.agentId);
    if (!credential || credential.revokedAt || credential.ownerUserId !== principal.ownerUserId) {
      throw new UnauthorizedException('Agent credential has been revoked.');
    }
  }

  async assertTestIdentityUnclaimed(agentId: string, projectKeys: string[]): Promise<void> {
    if (!this.enrollment) return;
    const identities = [agentId, ...projectKeys.map((key) => key.slice(0, 42))];
    for (const identity of new Set(identities)) {
      if (await this.enrollment.findCredentialByAgentId(identity)) {
        throw new UnauthorizedException('Paired agents require their credential, including in tests.');
      }
    }
  }
}

export function hashAgentSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

export function isAgentAuthorizedForProject(
  principal: AuthenticatedAgentPrincipal,
  projectKey: string,
  ownerUserId?: string,
): boolean {
  if (!principal.ownerUserId) return principal.projectKeys.includes(projectKey);
  return Boolean(
    principal.projectKeyPrefix &&
      projectKey.startsWith(principal.projectKeyPrefix) &&
      projectKey.length > principal.projectKeyPrefix.length &&
      /^[A-Za-z0-9._-]{1,128}$/.test(projectKey) &&
      (ownerUserId === undefined || ownerUserId === principal.ownerUserId),
  );
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
