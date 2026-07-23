import { randomUUID } from 'node:crypto';
import {
  AGENT_PROTOCOL_VERSION,
  type AgentCommandEnvelope,
  type AgentConnectedEventEnvelope,
  type AgentDoneEventEnvelope,
  type AgentEventEnvelope,
  type AgentOutputEventEnvelope,
  agentCommandEnvelopeSchema,
  agentEventEnvelopeSchema,
  type ChecksResultEventEnvelope,
  type ErrorEventEnvelope,
  type GitBranchPushedEventEnvelope,
  type GitDiffEventEnvelope,
  type ReadinessResultEventEnvelope,
  type SessionClosedEventEnvelope,
  type SessionProgressEventEnvelope,
  type SessionReadyEventEnvelope,
  type SessionRecoveredEventEnvelope,
} from '@pairdock/shared-contracts';

export function buildAgentConnectedEvent(input: {
  agentId: string;
  capabilities: string[];
  models?: AgentConnectedEventEnvelope['payload']['models'];
  projects?: AgentConnectedEventEnvelope['payload']['projects'];
}): AgentConnectedEventEnvelope {
  return buildEnvelope({
    type: 'agent.connected',
    payload: {
      agentId: input.agentId,
      capabilities: [...input.capabilities],
      models: input.models ?? [],
      projects: input.projects ?? [],
    },
  });
}

export function buildReadinessResultEvent(
  input: ReadinessResultEventEnvelope['payload'],
): ReadinessResultEventEnvelope {
  return buildEnvelope({
    type: 'readiness.result',
    payload: {
      projectKey: input.projectKey,
      ...(input.sessionId ? { sessionId: input.sessionId } : {}),
      ok: input.ok,
      checks: input.checks,
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

export function buildSessionReadyEvent(input: { sessionId: string; previewUrl: string }): SessionReadyEventEnvelope {
  return buildEnvelope({
    sessionId: input.sessionId,
    type: 'session.ready',
    payload: {
      sessionId: input.sessionId,
      previewUrl: input.previewUrl,
    },
  });
}

export function buildSessionRecoveredEvent(input: {
  sessionId: string;
  previewUrl: string;
}): SessionRecoveredEventEnvelope {
  return buildEnvelope({
    sessionId: input.sessionId,
    type: 'session.recovered',
    payload: {
      sessionId: input.sessionId,
      previewUrl: input.previewUrl,
    },
  });
}

export function buildAgentOutputEvent(input: {
  sessionId: string;
  stream: AgentOutputEventEnvelope['payload']['stream'];
  kind?: AgentOutputEventEnvelope['payload']['kind'];
  text: string;
}): AgentOutputEventEnvelope {
  return buildEnvelope({
    sessionId: input.sessionId,
    type: 'agent.output',
    payload: {
      sessionId: input.sessionId,
      stream: input.stream,
      ...(input.kind ? { kind: input.kind } : {}),
      text: input.text,
    },
  });
}

export function buildAgentDoneEvent(input: {
  sessionId: string;
  exitCode: number;
  changesDetected?: boolean;
}): AgentDoneEventEnvelope {
  return buildEnvelope({
    sessionId: input.sessionId,
    type: 'agent.done',
    payload: {
      sessionId: input.sessionId,
      exitCode: input.exitCode,
      ...(input.changesDetected !== undefined ? { changesDetected: input.changesDetected } : {}),
    },
  });
}

export function buildGitDiffEvent(input: {
  sessionId: string;
  diff: string;
  changedFiles: string[];
}): GitDiffEventEnvelope {
  return buildEnvelope({
    sessionId: input.sessionId,
    type: 'git.diff',
    payload: {
      sessionId: input.sessionId,
      diff: input.diff,
      changedFiles: [...input.changedFiles],
    },
  });
}

export function buildGitBranchPushedEvent(input: {
  sessionId: string;
  branchName: string;
}): GitBranchPushedEventEnvelope {
  return buildEnvelope({
    sessionId: input.sessionId,
    type: 'git.branchPushed',
    payload: {
      sessionId: input.sessionId,
      branchName: input.branchName,
    },
  });
}

export function buildChecksResultEvent(input: {
  sessionId: string;
  result: Omit<ChecksResultEventEnvelope['payload'], 'sessionId'>;
}): ChecksResultEventEnvelope {
  return buildEnvelope({
    sessionId: input.sessionId,
    type: 'checks.result',
    payload: {
      sessionId: input.sessionId,
      ...input.result,
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

type EnvelopeMetadata = 'protocolVersion' | 'messageId' | 'sentAt';
type AgentEventEnvelopeInput = Omit<AgentEventEnvelope, EnvelopeMetadata>;

function buildEnvelope(envelope: Omit<AgentConnectedEventEnvelope, EnvelopeMetadata>): AgentConnectedEventEnvelope;
function buildEnvelope(envelope: Omit<ReadinessResultEventEnvelope, EnvelopeMetadata>): ReadinessResultEventEnvelope;
function buildEnvelope(envelope: Omit<SessionProgressEventEnvelope, EnvelopeMetadata>): SessionProgressEventEnvelope;
function buildEnvelope(envelope: Omit<SessionReadyEventEnvelope, EnvelopeMetadata>): SessionReadyEventEnvelope;
function buildEnvelope(envelope: Omit<SessionRecoveredEventEnvelope, EnvelopeMetadata>): SessionRecoveredEventEnvelope;
function buildEnvelope(envelope: Omit<AgentOutputEventEnvelope, EnvelopeMetadata>): AgentOutputEventEnvelope;
function buildEnvelope(envelope: Omit<AgentDoneEventEnvelope, EnvelopeMetadata>): AgentDoneEventEnvelope;
function buildEnvelope(envelope: Omit<GitDiffEventEnvelope, EnvelopeMetadata>): GitDiffEventEnvelope;
function buildEnvelope(envelope: Omit<GitBranchPushedEventEnvelope, EnvelopeMetadata>): GitBranchPushedEventEnvelope;
function buildEnvelope(envelope: Omit<ChecksResultEventEnvelope, EnvelopeMetadata>): ChecksResultEventEnvelope;
function buildEnvelope(envelope: Omit<SessionClosedEventEnvelope, EnvelopeMetadata>): SessionClosedEventEnvelope;
function buildEnvelope(envelope: Omit<ErrorEventEnvelope, EnvelopeMetadata>): ErrorEventEnvelope;
function buildEnvelope(envelope: AgentEventEnvelopeInput): AgentEventEnvelope {
  return agentEventEnvelopeSchema.parse({
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: randomUUID(),
    sentAt: new Date().toISOString(),
    ...envelope,
  });
}
