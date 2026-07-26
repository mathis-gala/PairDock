import type { ReviewRequestRecord } from '@pairdock/domain';

export interface CreateReviewRequestInput {
  sessionId: string;
  reviewRequestNumber?: number | null;
  reviewRequestUrl?: string | null;
  status: string;
}

export interface UpdateReviewRequestStatusInput {
  providerConnectionId: string;
  repoFullName: string;
  reviewRequestNumber: number;
  reviewRequestUrl: string;
  status: 'draft' | 'open' | 'closed' | 'merged';
  statusUpdatedAt: Date;
}

export interface ReviewRequestsRepository {
  create(input: CreateReviewRequestInput): Promise<ReviewRequestRecord>;
  findBySessionId(sessionId: string): Promise<ReviewRequestRecord | null>;
  findManyBySessionIds(sessionIds: string[]): Promise<ReviewRequestRecord[]>;
  updateStatus(input: UpdateReviewRequestStatusInput): Promise<boolean>;
}
