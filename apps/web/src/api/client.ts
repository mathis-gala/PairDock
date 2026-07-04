import { type SharedProjectSummary, sharedProjectSummaryListSchema } from '@pairdock/shared-contracts';
import { z } from 'zod';
import { getBackendUrl } from '../lib/backend-url.js';
import { type AuthSession, authResponseSchema } from '../schemas/auth.js';
import {
  type SessionEventRecordView,
  type SessionMessageView,
  type SessionView,
  sessionEventRecordSchema,
  sessionMessageSchema,
  sessionSchema,
} from '../schemas/session.js';

interface CreateSessionInput {
  projectId: string;
  modelId: string;
  startSource: 'pm';
}

export interface ApiClient {
  readonly projects: {
    listShared(): Promise<SharedProjectSummary[]>;
  };
  readonly sessions: {
    create(input: CreateSessionInput): Promise<SessionView>;
    get(sessionId: string): Promise<SessionView>;
    listMessages(sessionId: string): Promise<SessionMessageView[]>;
    listEvents(sessionId: string): Promise<SessionEventRecordView[]>;
    sendPrompt(sessionId: string, content: string): Promise<SessionMessageView>;
    cancelPrompt(sessionId: string): Promise<void>;
  };
}

export function createApiClient(accessToken: string): ApiClient {
  return {
    projects: {
      async listShared(): Promise<SharedProjectSummary[]> {
        const value = await requestJson('/projects/shared', {
          method: 'GET',
          headers: authHeaders(accessToken),
        });
        return sharedProjectSummaryListSchema.parse(value);
      },
    },
    sessions: {
      async create(input: CreateSessionInput): Promise<SessionView> {
        const value = await requestJson('/sessions', {
          method: 'POST',
          headers: jsonHeaders(accessToken),
          body: JSON.stringify(input),
        });
        return sessionSchema.parse(value);
      },
      async get(sessionId: string): Promise<SessionView> {
        const value = await requestJson(`/sessions/${sessionId}`, {
          method: 'GET',
          headers: authHeaders(accessToken),
        });
        return sessionSchema.parse(value);
      },
      async listMessages(sessionId: string): Promise<SessionMessageView[]> {
        const value = await requestJson(`/sessions/${sessionId}/messages`, {
          method: 'GET',
          headers: authHeaders(accessToken),
        });
        return sessionMessageSchema.array().parse(value);
      },
      async listEvents(sessionId: string): Promise<SessionEventRecordView[]> {
        const value = await requestJson(`/sessions/${sessionId}/events`, {
          method: 'GET',
          headers: authHeaders(accessToken),
        });
        return sessionEventRecordSchema.array().parse(value);
      },
      async sendPrompt(sessionId: string, content: string): Promise<SessionMessageView> {
        const value = await requestJson(`/sessions/${sessionId}/prompts`, {
          method: 'POST',
          headers: jsonHeaders(accessToken),
          body: JSON.stringify({ content }),
        });
        return sessionMessageSchema.parse(value);
      },
      async cancelPrompt(sessionId: string): Promise<void> {
        await requestJson(`/sessions/${sessionId}/prompts/cancel`, {
          method: 'POST',
          headers: authHeaders(accessToken),
        });
      },
    },
  };
}

export const authApi: {
  authenticateDeveloper(rawAccessToken: string): Promise<AuthSession>;
  authenticatePm(rawAccessToken: string): Promise<AuthSession>;
} = {
  async authenticateDeveloper(rawAccessToken: string): Promise<AuthSession> {
    const response = await fetch(`${getBackendUrl()}/auth/developer/callback`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accessToken: rawAccessToken }),
    });

    return toAuthSession(response, 'github');
  },

  async authenticatePm(rawAccessToken: string): Promise<AuthSession> {
    const response = await fetch(`${getBackendUrl()}/auth/pm/callback`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accessToken: rawAccessToken }),
    });

    return toAuthSession(response, 'slack');
  },
};

interface RequestOptions {
  method: string;
  headers: Record<string, string>;
  body?: string;
}

async function requestJson(path: string, options: RequestOptions): Promise<unknown> {
  const response = await fetch(`${getBackendUrl()}${path}`, options);
  const body = await response.json().catch(() => null);
  const errorBody = responseErrorSchema.safeParse(body);

  if (!response.ok) {
    const message = errorBody.success && errorBody.data ? errorBody.data.message : undefined;
    throw new Error(message ?? 'Request failed.');
  }

  return body;
}

const responseErrorSchema = z.object({ message: z.string().optional() }).nullable();

function authHeaders(accessToken: string): Record<string, string> {
  return { authorization: `Bearer ${accessToken}` };
}

function jsonHeaders(accessToken: string): Record<string, string> {
  return { ...authHeaders(accessToken), 'content-type': 'application/json' };
}

async function toAuthSession(response: Response, provider: AuthSession['provider']): Promise<AuthSession> {
  const body = authResponseSchema.parse(await response.json());

  if (!response.ok) {
    throw new Error('Authentication failed.');
  }

  return {
    accessToken: body.accessToken,
    provider,
    user: body.user,
  };
}
