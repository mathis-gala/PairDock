import { Injectable } from '@nestjs/common';
import type { SourceControlPort } from '@pairdock/domain';

@Injectable()
export class GithubSourceControlAdapter implements SourceControlPort {
  async assertProjectAccess(): Promise<void> {
    throw new Error('GithubSourceControlAdapter.assertProjectAccess is not implemented yet.');
  }

  async createDraftReviewRequest(): Promise<{ reviewRequestUrl: string }> {
    throw new Error('GithubSourceControlAdapter.createDraftReviewRequest is not implemented yet.');
  }
}
