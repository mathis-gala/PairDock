import { Inject, Injectable } from '@nestjs/common';
import type { ProjectReadinessSnapshot } from '@pairdock/domain';
import type { DatabaseExecutor } from '../client.js';
import { DatabaseClient } from '../client.js';
import type { ProjectReadinessRepository, UpsertProjectReadinessInput } from '../ports/project-readiness.repository.js';
import { serializeChecks } from './json-parsers.js';
import { mapProjectReadinessSnapshot } from './mappers.js';

@Injectable()
export class ProjectReadinessRepositoryAdapter implements ProjectReadinessRepository {
  constructor(@Inject(DatabaseClient) private readonly prisma: DatabaseExecutor) {}

  async upsert(input: UpsertProjectReadinessInput): Promise<ProjectReadinessSnapshot> {
    const record = await this.prisma.projectReadinessSnapshot.upsert({
      where: {
        projectId: input.projectId,
      },
      create: {
        projectId: input.projectId,
        ok: input.ok,
        checks: serializeChecks(input.checks),
      },
      update: {
        ok: input.ok,
        checks: serializeChecks(input.checks),
      },
    });

    return mapProjectReadinessSnapshot(record);
  }

  async findByProjectId(projectId: string): Promise<ProjectReadinessSnapshot | null> {
    const record = await this.prisma.projectReadinessSnapshot.findUnique({ where: { projectId } });
    return record ? mapProjectReadinessSnapshot(record) : null;
  }

  async findManyByProjectIds(projectIds: string[]): Promise<ProjectReadinessSnapshot[]> {
    if (projectIds.length === 0) {
      return [];
    }

    const records = await this.prisma.projectReadinessSnapshot.findMany({
      where: {
        projectId: {
          in: projectIds,
        },
      },
    });

    return records.map(mapProjectReadinessSnapshot);
  }
}
