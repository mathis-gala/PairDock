import type { Project } from '@pairdock/domain';

export interface CreateProjectInput {
  ownerUserId: string;
  sourceControlConnectionId: string;
  name: string;
  description?: string | null;
  repoFullName: string;
  defaultBranch: string;
  defaultModelId?: string;
  defaultReasoningEffort: string;
  pmCanStartSessions?: boolean;
  agentProjectKey: string;
}

export interface SharedProjectRecord {
  project: Project;
  ownerDisplayName: string;
}

export interface DeveloperProjectRecord {
  project: Project;
  sourceControlAccountLogin: string;
  pmMemberCount: number;
}

export interface ProjectsRepository {
  create(input: CreateProjectInput): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  findByAgentProjectKey(agentProjectKey: string): Promise<Project | null>;
  listByAgentProjectKey(agentProjectKey: string): Promise<Project[]>;
  listOwnedByUserId(userId: string): Promise<DeveloperProjectRecord[]>;
  listSharedByUserId(userId: string): Promise<SharedProjectRecord[]>;
  updateExecutionDefaults(input: {
    id: string;
    defaultModelId: string;
    defaultReasoningEffort: string;
  }): Promise<Project>;
}
