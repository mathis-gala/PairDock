import type { ProjectReadinessSnapshot, ToolReadinessCheck } from '@pairdock/domain';

export interface UpsertProjectReadinessInput {
  projectId: string;
  ok: boolean;
  checks: ToolReadinessCheck[];
}

export interface ProjectReadinessRepository {
  upsert(input: UpsertProjectReadinessInput): Promise<ProjectReadinessSnapshot>;
  findByProjectId(projectId: string): Promise<ProjectReadinessSnapshot | null>;
  findManyByProjectIds(projectIds: string[]): Promise<ProjectReadinessSnapshot[]>;
}
