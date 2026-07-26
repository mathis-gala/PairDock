import { Inject, Injectable } from '@nestjs/common';
import type { ReviewRequestRecord } from '@pairdock/domain';
import { DatabaseClient, type DatabaseExecutor } from '../client.js';
import type {
  CreateReviewRequestInput,
  ReviewRequestsRepository,
  UpdateReviewRequestStatusInput,
} from '../ports/review-requests.repository.js';
import { mapReviewRequest } from './mappers.js';

@Injectable()
export class ReviewRequestsRepositoryAdapter implements ReviewRequestsRepository {
  constructor(@Inject(DatabaseClient) private readonly prisma: DatabaseExecutor) {}

  async create(input: CreateReviewRequestInput): Promise<ReviewRequestRecord> {
    const record = await this.prisma.pullRequest.create({
      data: {
        sessionId: input.sessionId,
        githubPrNumber: input.reviewRequestNumber ?? null,
        githubPrUrl: input.reviewRequestUrl ?? null,
        status: input.status,
      },
    });

    return mapReviewRequest(record);
  }

  async findBySessionId(sessionId: string): Promise<ReviewRequestRecord | null> {
    const record = await this.prisma.pullRequest.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });

    return record ? mapReviewRequest(record) : null;
  }

  async findManyBySessionIds(sessionIds: string[]): Promise<ReviewRequestRecord[]> {
    if (sessionIds.length === 0) {
      return [];
    }

    const records = await this.prisma.pullRequest.findMany({
      where: {
        sessionId: {
          in: sessionIds,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(mapReviewRequest);
  }

  async updateStatus(input: UpdateReviewRequestStatusInput): Promise<boolean> {
    const result = await this.prisma.pullRequest.updateMany({
      where: {
        githubPrNumber: input.reviewRequestNumber,
        session: {
          project: {
            repoFullName: input.repoFullName,
            sourceControlConnection: {
              providerConnectionId: input.providerConnectionId,
            },
          },
        },
        OR: [{ statusUpdatedAt: null }, { statusUpdatedAt: { lte: input.statusUpdatedAt } }],
      },
      data: {
        githubPrUrl: input.reviewRequestUrl,
        status: input.status,
        statusUpdatedAt: input.statusUpdatedAt,
      },
    });

    return result.count > 0;
  }
}
