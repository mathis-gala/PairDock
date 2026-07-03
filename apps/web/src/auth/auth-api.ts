import { z } from 'zod';
import { getBackendUrl } from '../lib/backend-url.js';
import type { AuthenticatedUser, AuthSession } from './auth-types.js';

const authResponseSchema = z.object({
  accessToken: z.string().min(1),
  created: z.boolean(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    displayName: z.string().nullable(),
    kind: z.enum(['developer', 'pm']),
  }),
});

export async function authenticateDeveloper(seed: string): Promise<AuthSession> {
  const trimmedSeed = normalizeSeed(seed, 'developer');
  const response = await fetch(`${getBackendUrl()}/auth/developer/callback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      accessToken: `github:${trimmedSeed}:dev-${trimmedSeed}@pairdock.test:Dev ${trimmedSeed}`,
    }),
  });

  return toAuthSession(response, 'github');
}

export async function authenticatePm(seed: string, teamId: string): Promise<AuthSession> {
  const trimmedSeed = normalizeSeed(seed, 'pm');
  const trimmedTeamId = normalizeSeed(teamId, 'team');
  const response = await fetch(`${getBackendUrl()}/auth/pm/callback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      accessToken: `slack:${trimmedSeed}:${trimmedTeamId}:pm-${trimmedSeed}@pairdock.test:PM ${trimmedSeed}`,
    }),
  });

  return toAuthSession(response, 'slack');
}

export function createBrowserSeed(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }

  return `${prefix}-${Math.random().toString(16).slice(2, 10)}`;
}

async function toAuthSession(response: Response, provider: AuthSession['provider']): Promise<AuthSession> {
  const body = authResponseSchema.parse(await response.json());

  if (!response.ok) {
    throw new Error('Authentication failed.');
  }

  return {
    accessToken: body.accessToken,
    provider,
    user: body.user satisfies AuthenticatedUser,
  };
}

function normalizeSeed(value: string, fieldName: string): string {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    throw new Error(`${fieldName} is required.`);
  }

  return trimmedValue;
}
