import { Injectable } from '@nestjs/common';
import type { Project } from '@pairdock/domain';
import type { DatabaseExecutor } from '../client.js';
import type { CreateProjectInput, ProjectsRepository } from '../ports/projects.repository.js';
import { mapProject } from './mappers.js';

@Injectable()
export class ProjectsRepositoryAdapter implements ProjectsRepository {
  constructor(private readonly prisma: DatabaseExecutor) {}

  async create(input: CreateProjectInput): Promise<Project> {
    const record = await this.prisma.project.create({
      data: {
        ownerUserId: input.ownerUserId,
        sourceControlConnectionId: input.sourceControlConnectionId,
        name: input.name,
        repoFullName: input.repoFullName,
        defaultBranch: input.defaultBranch,
        agentProjectKey: input.agentProjectKey,
      },
    });

    return mapProject(record);
  }

  async findById(id: string): Promise<Project | null> {
    const record = await this.prisma.project.findUnique({ where: { id } });
    return record ? mapProject(record) : null;
  }
}
