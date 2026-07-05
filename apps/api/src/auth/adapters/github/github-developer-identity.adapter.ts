import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { DeveloperIdentityPort, NormalizedIdentity } from '@pairdock/domain';

interface GithubDeveloperIdentityConfig {
  apiBaseUrl: string;
}

interface GithubUserResponse {
  id?: unknown;
  login?: unknown;
  name?: unknown;
  email?: unknown;
}

interface GithubEmailResponse {
  email?: unknown;
  primary?: unknown;
  verified?: unknown;
}

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

@Injectable()
export class GithubDeveloperIdentityAdapter implements DeveloperIdentityPort {
  constructor(
    private readonly config: GithubDeveloperIdentityConfig = readGithubConfig(),
    private readonly fetcher: Fetcher = fetch,
  ) {}

  async getDeveloperIdentity(accessToken: string): Promise<NormalizedIdentity> {
    if (accessToken.startsWith('github:')) {
      return parseFixtureIdentity(accessToken);
    }

    return this.fetchGithubIdentity(accessToken);
  }

  private async fetchGithubIdentity(accessToken: string): Promise<NormalizedIdentity> {
    const userResponse = await this.fetcher(`${this.config.apiBaseUrl}/user`, {
      method: 'GET',
      headers: githubHeaders(accessToken),
    });

    if (!userResponse.ok) {
      throw new UnauthorizedException('GitHub developer identity lookup failed.');
    }

    const user = (await userResponse.json()) as GithubUserResponse;
    const email = typeof user.email === 'string' && user.email ? user.email : await this.fetchPrimaryEmail(accessToken);

    if (typeof user.id !== 'number' && typeof user.id !== 'string') {
      throw new UnauthorizedException('GitHub identity response did not include an id.');
    }

    if (!email) {
      throw new UnauthorizedException('GitHub identity response did not include a verified email.');
    }

    const login = typeof user.login === 'string' ? user.login : String(user.id);
    const name = typeof user.name === 'string' && user.name ? user.name : login;

    return {
      provider: 'github',
      providerUserId: String(user.id),
      providerTeamId: null,
      email,
      displayName: name,
      kind: 'developer',
      metadata: {
        login,
      },
    };
  }

  private async fetchPrimaryEmail(accessToken: string): Promise<string | null> {
    const emailResponse = await this.fetcher(`${this.config.apiBaseUrl}/user/emails`, {
      method: 'GET',
      headers: githubHeaders(accessToken),
    });

    if (!emailResponse.ok) {
      throw new UnauthorizedException('GitHub email lookup failed.');
    }

    const emails = (await emailResponse.json()) as GithubEmailResponse[];
    const primaryEmail = emails.find(
      (email) => email.primary === true && email.verified === true && typeof email.email === 'string',
    );

    return typeof primaryEmail?.email === 'string' ? primaryEmail.email : null;
  }
}

function parseFixtureIdentity(accessToken: string): NormalizedIdentity {
  const [provider, providerUserId, email, ...displayNameParts] = accessToken.split(':');

  if (provider !== 'github' || !providerUserId || !email || displayNameParts.length === 0) {
    throw new UnauthorizedException('Invalid GitHub callback token.');
  }

  return {
    provider: 'github',
    providerUserId,
    providerTeamId: null,
    email,
    displayName: displayNameParts.join(':').trim(),
    kind: 'developer',
    metadata: {},
  };
}

function readGithubConfig(): GithubDeveloperIdentityConfig {
  return {
    apiBaseUrl: process.env.GITHUB_API_BASE_URL ?? 'https://api.github.com',
  };
}

function githubHeaders(accessToken: string): Record<string, string> {
  return {
    accept: 'application/vnd.github+json',
    authorization: `Bearer ${accessToken}`,
    'x-github-api-version': '2022-11-28',
  };
}
