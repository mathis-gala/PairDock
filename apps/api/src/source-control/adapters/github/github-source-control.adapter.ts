import { createSign } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { SourceControlPort } from '@pairdock/domain';

interface GithubPullResponse {
  html_url?: unknown;
  number?: unknown;
}

interface GithubSourceControlConfig {
  apiBaseUrl: string;
  token?: string;
  appId?: string;
  appPrivateKey?: string;
}

interface GithubInstallationTokenResponse {
  token?: unknown;
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

    const token = await this.resolveToken(input.providerConnectionId);

    const response = await this.fetcher(`${this.config.apiBaseUrl}/repos/${input.repoFullName}/pulls`, {
      method: 'POST',
      headers: { ...githubHeaders(token), 'content-type': 'application/json' },
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

  private async resolveToken(providerConnectionId: string): Promise<string> {
    if (this.config.token) {
      return this.config.token;
    }

    if (!this.config.appId || !this.config.appPrivateKey) {
      throw new Error('GITHUB_TOKEN or GitHub App credentials are required to access GitHub repositories.');
    }

    const jwt = createGithubAppJwt(this.config.appId, this.config.appPrivateKey);
    const response = await this.fetcher(
      `${this.config.apiBaseUrl}/app/installations/${providerConnectionId}/access_tokens`,
      {
        method: 'POST',
        headers: {
          accept: 'application/vnd.github+json',
          authorization: `Bearer ${jwt}`,
          'x-github-api-version': '2022-11-28',
        },
      },
    );

    if (!response.ok) {
      const message = await response.text().catch(() => '');
      throw new Error(`GitHub installation token creation failed with ${response.status}: ${message}`.trim());
    }

    const payload = (await response.json()) as GithubInstallationTokenResponse;

    if (typeof payload.token !== 'string' || !payload.token) {
      throw new Error('GitHub installation token response did not include token.');
    }

    return payload.token;
  }
}

function readGithubConfig(): GithubSourceControlConfig {
  return {
    apiBaseUrl: process.env.GITHUB_API_BASE_URL ?? 'https://api.github.com',
    token: process.env.GITHUB_TOKEN,
    appId: process.env.GITHUB_APP_ID,
    appPrivateKey: process.env.GITHUB_APP_PRIVATE_KEY,
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

function createGithubAppJwt(appId: string, privateKey: string): string {
  const issuedAt = Math.floor(Date.now() / 1000) - 60;
  const expiresAt = issuedAt + 9 * 60;
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64UrlEncode(JSON.stringify({ iat: issuedAt, exp: expiresAt, iss: appId }));
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${payload}`);
  signer.end();
  const signature = signer.sign(normalizePrivateKey(privateKey), 'base64url');

  return `${header}.${payload}.${signature}`;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function normalizePrivateKey(privateKey: string): string {
  return privateKey.replaceAll('\\n', '\n');
}

function deterministicReviewRequestNumber(sessionId: string): number {
  return Number.parseInt(sessionId.replaceAll('-', '').slice(0, 6), 16) % 1000 || 1;
}
