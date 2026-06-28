import type { SessionMember } from '@pairdock/domain';

export interface AddSessionMemberInput {
  sessionId: string;
  userId: string;
  role: string;
}

export interface SessionMembersRepository {
  add(input: AddSessionMemberInput): Promise<SessionMember>;
  listBySessionId(sessionId: string): Promise<SessionMember[]>;
  findBySessionIdAndUserId(sessionId: string, userId: string): Promise<SessionMember | null>;
}
