import type { ProjectMembership, ProjectMembershipRole } from '@pairdock/domain';

export interface AddProjectMemberInput {
  projectId: string;
  userId: string;
  role: ProjectMembershipRole;
}

export interface ProjectMembersRepository {
  add(input: AddProjectMemberInput): Promise<ProjectMembership>;
  findByProjectIdAndUserId(projectId: string, userId: string): Promise<ProjectMembership | null>;
  listByProjectId(projectId: string): Promise<ProjectMembership[]>;
}
