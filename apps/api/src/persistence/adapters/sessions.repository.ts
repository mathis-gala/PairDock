import { Inject, Injectable } from '@nestjs/common';
import type { Session } from '@pairdock/domain';
import { DatabaseClient, type DatabaseExecutor } from '../client.js';
import type { CreateSessionInput, ListedSession, SessionsRepository } from '../ports/sessions.repository.js';
import { mapSession } from './mappers.js';

@Injectable()
export class SessionsRepositoryAdapter implements SessionsRepository {
  constructor(@Inject(DatabaseClient) private readonly prisma: DatabaseExecutor) {}

  async create(input: CreateSessionInput): Promise<Session> {
    const record = await this.prisma.session.create({
      data: {
        projectId: input.projectId,
        createdByUserId: input.createdByUserId,
        status: input.status,
        modelId: input.modelId,
        reasoningEffort: input.reasoningEffort,
        branchName: input.branchName ?? null,
        worktreeRef: input.worktreeRef ?? null,
        previewUrl: input.previewUrl ?? null,
        lastError: input.lastError ?? null,
        closedAt: input.closedAt ?? null,
      },
    });

    return mapSession(record);
  }

  async findById(id: string): Promise<Session | null> {
    const record = await this.prisma.session.findUnique({ where: { id } });
    return record ? mapSession(record) : null;
  }

  async listByProjectIds(projectIds: string[], createdByUserId?: string): Promise<ListedSession[]> {
    if (projectIds.length === 0) {
      return [];
    }

    const records = await this.prisma.session.findMany({
      where: {
        projectId: {
          in: projectIds,
        },
        ...(createdByUserId ? { createdByUserId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          where: { role: { in: ['pm', 'developer', 'user'] } },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          take: 1,
          select: { content: true },
        },
      },
    });

    return records.map((record) => ({ ...mapSession(record), firstPrompt: record.messages[0]?.content ?? null }));
  }

  async updateStatus(input: {
    id: string;
    status: Session['status'];
    lastError?: string | null;
    previewUrl?: string | null;
    closedAt?: Date | null;
  }): Promise<Session> {
    const record = await this.prisma.session.update({
      where: { id: input.id },
      data: {
        status: input.status,
        ...(input.lastError !== undefined ? { lastError: input.lastError } : {}),
        ...(input.previewUrl !== undefined ? { previewUrl: input.previewUrl } : {}),
        ...(input.closedAt !== undefined ? { closedAt: input.closedAt } : {}),
      },
    });

    return mapSession(record);
  }
}
