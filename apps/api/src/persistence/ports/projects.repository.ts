import type { Project } from '@pairdock/domain';

export interface CreateProjectInput {
  ownerUserId: string;
  sourceControlConnectionId: string;
  name: string;
  repoFullName: string;
  defaultBranch: string;
  agentProjectKey: string;
}

export interface ProjectsRepository {
  create(input: CreateProjectInput): Promise<Project>;
  findById(id: string): Promise<Project | null>;
}
