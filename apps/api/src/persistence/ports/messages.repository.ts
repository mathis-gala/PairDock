import type { SessionMessage } from '@pairdock/domain';

export interface CreateMessageInput {
  sessionId: string;
  userId?: string | null;
  role: string;
  content: string;
}

export interface MessagesRepository {
  create(input: CreateMessageInput): Promise<SessionMessage>;
  listBySessionId(sessionId: string): Promise<SessionMessage[]>;
}
