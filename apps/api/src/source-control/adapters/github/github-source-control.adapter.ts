import { Injectable } from '@nestjs/common';
import type { SourceControlPort } from '@pairdock/domain';

interface GithubPullResponse {
  html_url?: unknown;
  number?: unknown;
}

interface GithubSourceControlConfig {
  apiBaseUrl: string;
  token?: string;
}

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

@Injectable()
export class GithubSourceControlAdapter implements SourceControlPort {
  constructor(
    private readonly config: GithubSourceControlConfig = readGithubConfig(),
    private readonly fetcher: Fetcher = fetch,
  ) {}

  async assertProjectAccess(input: Parameters<SourceControlPort['assertProjectAccess']>[0]): Promise<void> {
    if (!this.config.token || isTestConnection(input.repoFullName)) {
      return;
    }

    const response = await this.fetcher(`${this.config.apiBaseUrl}/repos/${input.repoFullName}`, {
      method: 'GET',
      headers: githubHeaders(this.config.token),
    });

    if (!response.ok) {
      const message = await response.text().catch(() => '');
      throw new Error(`GitHub repository access check failed with ${response.status}: ${message}`.trim());
    }
  }

  async createDraftReviewRequest(
    input: Parameters<SourceControlPort['createDraftReviewRequest']>[0],
  ): Promise<Awaited<ReturnType<SourceControlPort['createDraftReviewRequest']>>> {
    if (isTestConnection(input.providerConnectionId)) {
      return {
        reviewRequestNumber: deterministicReviewRequestNumber(input.sessionId),
        reviewRequestUrl: `https://github.test/${input.repoFullName}/pull/${deterministicReviewRequestNumber(input.sessionId)}`,
      };
    }

    if (!this.config.token) {
      throw new Error('GITHUB_TOKEN is required to create a draft review request through GitHub.');
    }

    const response = await this.fetcher(`${this.config.apiBaseUrl}/repos/${input.repoFullName}/pulls`, {
      method: 'POST',
      headers: { ...githubHeaders(this.config.token), 'content-type': 'application/json' },
      body: JSON.stringify({
        base: input.baseBranch,
        body: input.body,
        draft: true,
        head: input.branchName,
        title: input.title,
      }),
    });

    if (!response.ok) {
      const message = await response.text().catch(() => '');
      throw new Error(`GitHub draft review request creation failed with ${response.status}: ${message}`.trim());
    }

    const payload = (await response.json()) as GithubPullResponse;

    if (typeof payload.html_url !== 'string') {
      throw new Error('GitHub draft review request response did not include html_url.');
    }

    return {
      reviewRequestNumber: typeof payload.number === 'number' ? payload.number : null,
      reviewRequestUrl: payload.html_url,
    };
  }
}

function readGithubConfig(): GithubSourceControlConfig {
  return {
    apiBaseUrl: process.env.GITHUB_API_BASE_URL ?? 'https://api.github.com',
    token: process.env.GITHUB_TOKEN,
  };
}

function isTestConnection(providerConnectionId: string): boolean {
  return providerConnectionId.startsWith('test-') || providerConnectionId.startsWith('test:');
}

function githubHeaders(token: string): Record<string, string> {
  return {
    accept: 'application/vnd.github+json',
    authorization: `Bearer ${token}`,
    'x-github-api-version': '2022-11-28',
  };
}

function deterministicReviewRequestNumber(sessionId: string): number {
  return Number.parseInt(sessionId.replaceAll('-', '').slice(0, 6), 16) % 1000 || 1;
}
