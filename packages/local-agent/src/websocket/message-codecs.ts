import { randomUUID } from 'node:crypto';
import {
  AGENT_PROTOCOL_VERSION,
  type AgentCommandEnvelope,
  type AgentConnectedEventEnvelope,
  agentCommandEnvelopeSchema,
} from '@pairdock/shared-contracts';

export function buildAgentConnectedEvent(input: {
  agentId: string;
  capabilities: string[];
}): AgentConnectedEventEnvelope {
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: randomUUID(),
    sentAt: new Date().toISOString(),
    type: 'agent.connected',
    payload: {
      agentId: input.agentId,
      capabilities: [...input.capabilities],
    },
  };
}

export function parseAgentCommandEnvelope(payload: unknown): AgentCommandEnvelope {
  return agentCommandEnvelopeSchema.parse(payload);
}
