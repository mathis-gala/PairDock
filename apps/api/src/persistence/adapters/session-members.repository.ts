import { Inject, Injectable } from '@nestjs/common';
import type { SessionMember } from '@pairdock/domain';
import { DatabaseClient, type DatabaseExecutor } from '../client.js';
import type { AddSessionMemberInput, SessionMembersRepository } from '../ports/session-members.repository.js';
import { mapSessionMember } from './mappers.js';

@Injectable()
export class SessionMembersRepositoryAdapter implements SessionMembersRepository {
  constructor(@Inject(DatabaseClient) private readonly prisma: DatabaseExecutor) {}

  async add(input: AddSessionMemberInput): Promise<SessionMember> {
    const record = await this.prisma.sessionMember.create({
      data: {
        sessionId: input.sessionId,
        userId: input.userId,
        role: input.role,
      },
    });

    return mapSessionMember(record);
  }

  async listBySessionId(sessionId: string): Promise<SessionMember[]> {
    const records = await this.prisma.sessionMember.findMany({
      where: { sessionId },
      orderBy: { id: 'asc' },
    });

    return records.map(mapSessionMember);
  }

  async findBySessionIdAndUserId(sessionId: string, userId: string): Promise<SessionMember | null> {
    const record = await this.prisma.sessionMember.findFirst({
      where: { sessionId, userId },
    });

    return record ? mapSessionMember(record) : null;
  }
}
