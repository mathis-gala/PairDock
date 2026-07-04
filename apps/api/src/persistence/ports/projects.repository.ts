import type { Project } from '@pairdock/domain';

export interface CreateProjectInput {
  ownerUserId: string;
  sourceControlConnectionId: string;
  name: string;
  description?: string | null;
  repoFullName: string;
  defaultBranch: string;
  defaultModelId?: string;
  pmCanStartSessions?: boolean;
  agentProjectKey: string;
}

export interface SharedProjectRecord {
  project: Project;
  ownerDisplayName: string;
}

export interface ProjectsRepository {
  create(input: CreateProjectInput): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  findByAgentProjectKey(agentProjectKey: string): Promise<Project | null>;
  listSharedByUserId(userId: string): Promise<SharedProjectRecord[]>;
}
