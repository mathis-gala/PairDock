import type { Session, SessionStatus } from '@pairdock/domain';

export interface CreateSessionInput {
  projectId: string;
  createdByUserId: string;
  status: Session['status'];
  modelId: string;
  reasoningEffort: string;
  branchName?: string | null;
  worktreeRef?: string | null;
  previewUrl?: string | null;
  lastError?: string | null;
  closedAt?: Date | null;
}

export interface SessionsRepository {
  create(input: CreateSessionInput): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  listByProjectIds(projectIds: string[]): Promise<Session[]>;
  updateStatus(input: {
    id: string;
    status: SessionStatus;
    lastError?: string | null;
    previewUrl?: string | null;
    closedAt?: Date | null;
  }): Promise<Session>;
}
