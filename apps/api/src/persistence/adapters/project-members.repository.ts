import { Inject, Injectable } from '@nestjs/common';
import type { ProjectMembership } from '@pairdock/domain';
import { DatabaseClient, type DatabaseExecutor } from '../client.js';
import type { AddProjectMemberInput, ProjectMembersRepository } from '../ports/project-members.repository.js';
import { mapProjectMembership } from './mappers.js';

@Injectable()
export class ProjectMembersRepositoryAdapter implements ProjectMembersRepository {
  constructor(@Inject(DatabaseClient) private readonly prisma: DatabaseExecutor) {}

  async add(input: AddProjectMemberInput): Promise<ProjectMembership> {
    const record = await this.prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: input.projectId,
          userId: input.userId,
        },
      },
      create: {
        projectId: input.projectId,
        userId: input.userId,
        role: input.role,
      },
      update: {
        role: input.role,
      },
    });

    return mapProjectMembership(record);
  }

  async findByProjectIdAndUserId(projectId: string, userId: string): Promise<ProjectMembership | null> {
    const record = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    return record ? mapProjectMembership(record) : null;
  }

  async listByProjectId(projectId: string): Promise<ProjectMembership[]> {
    const records = await this.prisma.projectMember.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    return records.map(mapProjectMembership);
  }
}
