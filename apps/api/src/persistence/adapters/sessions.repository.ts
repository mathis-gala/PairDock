import { Inject, Injectable } from '@nestjs/common';
import type { Session } from '@pairdock/domain';
import { DatabaseClient, type DatabaseExecutor } from '../client.js';
import type { CreateSessionInput, SessionsRepository } from '../ports/sessions.repository.js';
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
