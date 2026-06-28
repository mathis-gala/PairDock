import { randomUUID } from 'node:crypto';
import {
  AGENT_PROTOCOL_VERSION,
  type AgentCommandEnvelope,
  type AgentConnectedEventEnvelope,
  agentCommandEnvelopeSchema,
  type ErrorEventEnvelope,
  type SessionClosedEventEnvelope,
  type SessionProgressEventEnvelope,
} from '@pairdock/shared-contracts';

export function buildAgentConnectedEvent(input: {
  agentId: string;
  capabilities: string[];
}): AgentConnectedEventEnvelope {
  return buildEnvelope({
    type: 'agent.connected',
    payload: {
      agentId: input.agentId,
      capabilities: [...input.capabilities],
    },
  });
}

export function buildSessionProgressEvent(input: {
  sessionId: string;
  status: SessionProgressEventEnvelope['payload']['status'];
  message?: string;
}): SessionProgressEventEnvelope {
  return buildEnvelope({
    sessionId: input.sessionId,
    type: 'session.progress',
    payload: {
      sessionId: input.sessionId,
      status: input.status,
      ...(input.message ? { message: input.message } : {}),
    },
  });
}

export function buildSessionClosedEvent(input: { sessionId: string; cleaned: boolean }): SessionClosedEventEnvelope {
  return buildEnvelope({
    sessionId: input.sessionId,
    type: 'session.closed',
    payload: {
      sessionId: input.sessionId,
      cleaned: input.cleaned,
    },
  });
}

export function buildErrorEvent(input: {
  code: string;
  message: string;
  retryable: boolean;
  sessionId?: string;
}): ErrorEventEnvelope {
  return buildEnvelope({
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    type: 'error',
    payload: {
      ...(input.sessionId ? { sessionId: input.sessionId } : {}),
      code: input.code,
      message: input.message,
      retryable: input.retryable,
    },
  });
}

export function parseAgentCommandEnvelope(payload: unknown): AgentCommandEnvelope {
  return agentCommandEnvelopeSchema.parse(payload);
}

function buildEnvelope<TEnvelope extends { protocolVersion: string; messageId: string; sentAt: string }>(
  envelope: Omit<TEnvelope, 'protocolVersion' | 'messageId' | 'sentAt'>,
): TEnvelope {
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: randomUUID(),
    sentAt: new Date().toISOString(),
    ...envelope,
  } as TEnvelope;
}
