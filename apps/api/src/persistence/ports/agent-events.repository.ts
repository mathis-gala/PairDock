import type { AgentEventRecord } from '@pairdock/domain';

export interface CreateAgentEventInput {
  sessionId?: string | null;
  agentId?: string | null;
  type: string;
  payload: Record<string, unknown>;
}

export interface AgentEventsRepository {
  create(input: CreateAgentEventInput): Promise<AgentEventRecord>;
  listBySessionId(sessionId: string): Promise<AgentEventRecord[]>;
}
