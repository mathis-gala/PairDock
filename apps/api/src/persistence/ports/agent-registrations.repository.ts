import type { AgentRegistration } from '@pairdock/domain';

export interface UpsertAgentRegistrationInput {
  agentId: string;
  protocolVersion: string;
  capabilities: string[];
  models: AgentRegistration['models'];
  projects: AgentRegistration['projects'];
}

export interface AgentRegistrationsRepository {
  markConnected(input: UpsertAgentRegistrationInput): Promise<AgentRegistration>;
  markDisconnected(agentId: string): Promise<AgentRegistration | null>;
  findByAgentId(agentId: string): Promise<AgentRegistration | null>;
}
