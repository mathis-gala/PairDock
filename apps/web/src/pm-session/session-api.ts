import {
  type SharedProjectSummary,
  sharedProjectSummaryListSchema,
  uiSessionEventName,
  uiSessionSubscribedEventName,
  uiSessionSubscribeEventName,
} from '@pairdock/shared-contracts';
import { getBackendUrl } from '../lib/backend-url.js';
import {
  type SessionEventRecordView,
  type SessionMessageView,
  type SessionView,
  sessionEventRecordSchema,
  sessionMessageSchema,
  sessionSchema,
} from './session-schemas.js';

interface CreateSessionInput {
  projectId: string;
  modelId: string;
  startSource: 'pm';
}

export async function fetchSharedProjects(accessToken: string): Promise<SharedProjectSummary[]> {
  const response = await fetch(`${getBackendUrl()}/projects/shared`, {
    headers: authorizationHeader(accessToken),
  });

  return sharedProjectSummaryListSchema.parse(await parseResponse(response));
}

export async function createPmSession(accessToken: string, input: CreateSessionInput): Promise<SessionView> {
  const response = await fetch(`${getBackendUrl()}/sessions`, {
    method: 'POST',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify(input),
  });

  return sessionSchema.parse(await parseResponse(response));
}

export async function fetchSession(accessToken: string, sessionId: string): Promise<SessionView> {
  const response = await fetch(`${getBackendUrl()}/sessions/${sessionId}`, {
    headers: authorizationHeader(accessToken),
  });

  return sessionSchema.parse(await parseResponse(response));
}

export async function fetchSessionMessages(accessToken: string, sessionId: string): Promise<SessionMessageView[]> {
  const response = await fetch(`${getBackendUrl()}/sessions/${sessionId}/messages`, {
    headers: authorizationHeader(accessToken),
  });

  return sessionMessageSchema.array().parse(await parseResponse(response));
}

export async function fetchSessionEvents(accessToken: string, sessionId: string): Promise<SessionEventRecordView[]> {
  const response = await fetch(`${getBackendUrl()}/sessions/${sessionId}/events`, {
    headers: authorizationHeader(accessToken),
  });

  return sessionEventRecordSchema.array().parse(await parseResponse(response));
}

export async function sendSessionPrompt(
  accessToken: string,
  sessionId: string,
  content: string,
): Promise<SessionMessageView> {
  const response = await fetch(`${getBackendUrl()}/sessions/${sessionId}/prompts`, {
    method: 'POST',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify({ content }),
  });

  return sessionMessageSchema.parse(await parseResponse(response));
}

export async function cancelSessionPrompt(accessToken: string, sessionId: string): Promise<void> {
  const response = await fetch(`${getBackendUrl()}/sessions/${sessionId}/prompts/cancel`, {
    method: 'POST',
    headers: authorizationHeader(accessToken),
  });

  await parseResponse(response);
}

export { uiSessionEventName, uiSessionSubscribedEventName, uiSessionSubscribeEventName };

function authorizationHeader(accessToken: string): HeadersInit {
  return { authorization: `Bearer ${accessToken}` };
}

function jsonHeaders(accessToken: string): HeadersInit {
  return {
    ...authorizationHeader(accessToken),
    'content-type': 'application/json',
  };
}

async function parseResponse(response: Response): Promise<unknown> {
  const body = (await response.json().catch(() => null)) as { message?: string } | null;

  if (!response.ok) {
    throw new Error(body?.message ?? 'Request failed.');
  }

  return body;
}
