import type { ReviewRequestRecord } from '@pairdock/domain';

export interface CreateReviewRequestInput {
  sessionId: string;
  reviewRequestNumber?: number | null;
  reviewRequestUrl?: string | null;
  status: string;
}

export interface ReviewRequestsRepository {
  create(input: CreateReviewRequestInput): Promise<ReviewRequestRecord>;
  findBySessionId(sessionId: string): Promise<ReviewRequestRecord | null>;
}
