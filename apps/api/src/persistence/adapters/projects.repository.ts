import { Inject, Injectable } from '@nestjs/common';
import type { Project } from '@pairdock/domain';
import { DatabaseClient, type DatabaseExecutor } from '../client.js';
import type {
  CreateProjectInput,
  DeveloperProjectRecord,
  ProjectsRepository,
  SharedProjectRecord,
} from '../ports/projects.repository.js';
import { mapProject } from './mappers.js';

@Injectable()
export class ProjectsRepositoryAdapter implements ProjectsRepository {
  constructor(@Inject(DatabaseClient) private readonly prisma: DatabaseExecutor) {}

  async create(input: CreateProjectInput): Promise<Project> {
    const record = await this.prisma.project.create({
      data: {
        ownerUserId: input.ownerUserId,
        sourceControlConnectionId: input.sourceControlConnectionId,
        name: input.name,
        description: input.description ?? null,
        repoFullName: input.repoFullName,
        defaultBranch: input.defaultBranch,
        defaultModelId: input.defaultModelId,
        pmCanStartSessions: input.pmCanStartSessions,
        agentProjectKey: input.agentProjectKey,
      },
    });

    return mapProject(record);
  }

  async findById(id: string): Promise<Project | null> {
    const record = await this.prisma.project.findUnique({ where: { id } });
    return record ? mapProject(record) : null;
  }

  async findByAgentProjectKey(agentProjectKey: string): Promise<Project | null> {
    const record = await this.prisma.project.findFirst({ where: { agentProjectKey } });
    return record ? mapProject(record) : null;
  }

  async listOwnedByUserId(userId: string): Promise<DeveloperProjectRecord[]> {
    const records = await this.prisma.project.findMany({
      where: { ownerUserId: userId },
      include: {
        sourceControlConnection: {
          select: {
            accountLogin: true,
          },
        },
        _count: {
          select: {
            projectMembers: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record) => ({
      project: mapProject(record),
      sourceControlAccountLogin: record.sourceControlConnection.accountLogin,
      pmMemberCount: record._count.projectMembers,
    }));
  }

  async listSharedByUserId(userId: string): Promise<SharedProjectRecord[]> {
    const records = await this.prisma.project.findMany({
      where: {
        projectMembers: {
          some: {
            userId,
          },
        },
      },
      include: {
        ownerUser: {
          select: {
            email: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record) => ({
      project: mapProject(record),
      ownerDisplayName: record.ownerUser.displayName ?? record.ownerUser.email,
    }));
  }
}
