import { Inject, Injectable, Logger } from '@nestjs/common';
import { REVIEW_REQUESTS_REPOSITORY } from '../persistence/persistence.tokens.js';
import type { ReviewRequestsRepository } from '../persistence/ports/review-requests.repository.js';
import { parseGithubPullRequestEvent } from './github-pull-request-event.js';

@Injectable()
export class GithubWebhooksService {
  private readonly logger = new Logger(GithubWebhooksService.name);

  constructor(
    @Inject(REVIEW_REQUESTS_REPOSITORY)
    private readonly reviewRequestsRepository: ReviewRequestsRepository,
  ) {}

  async handle(eventName: string, payload: unknown): Promise<void> {
    if (eventName !== 'pull_request') {
      return;
    }

    const update = parseGithubPullRequestEvent(payload);
    const updated = await this.reviewRequestsRepository.updateStatus(update);

    if (!updated) {
      this.logger.debug(
        `Ignored unmatched or stale pull request webhook for ${update.repoFullName}#${update.reviewRequestNumber}.`,
      );
    }
  }
}
