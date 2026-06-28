import { Injectable } from '@nestjs/common';
import type { SessionMember } from '@pairdock/domain';
import type { DatabaseExecutor } from '../client.js';
import type { AddSessionMemberInput, SessionMembersRepository } from '../ports/session-members.repository.js';
import { mapSessionMember } from './mappers.js';

@Injectable()
export class SessionMembersRepositoryAdapter implements SessionMembersRepository {
  constructor(private readonly prisma: DatabaseExecutor) {}

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
}
