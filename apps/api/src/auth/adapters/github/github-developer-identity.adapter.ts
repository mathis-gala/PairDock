import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { DeveloperIdentityPort, NormalizedIdentity } from '@pairdock/domain';

interface GithubDeveloperIdentityConfig {
  allowFixtures?: boolean;
  apiBaseUrl: string;
  oauthBaseUrl: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
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

interface GithubOAuthResponse {
  access_token?: unknown;
  error?: unknown;
  error_description?: unknown;
}

interface GithubInstallationsResponse {
  installations?: unknown;
}

interface GithubInstallationMetadata {
  accountLogin: string;
  installationId: string;
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
      if (!this.config.allowFixtures) {
        throw new UnauthorizedException('Development authentication fixtures are disabled.');
      }

      return parseFixtureIdentity(accessToken);
    }

    if (accessToken.startsWith('code:')) {
      const callback = parseCodeCallback(accessToken);
      const token = await this.exchangeCode(callback.code);
      return this.fetchGithubIdentity(token, callback.installationId, true);
    }

    return this.fetchGithubIdentity(accessToken);
  }

  private async exchangeCode(code: string): Promise<string> {
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new UnauthorizedException('GitHub OAuth client credentials are not configured.');
    }

    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
    });

    if (this.config.redirectUri) {
      body.set('redirect_uri', this.config.redirectUri);
    }

    const response = await this.fetcher(`${this.config.oauthBaseUrl}/login/oauth/access_token`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const payload = (await response.json()) as GithubOAuthResponse;

    if (!response.ok || typeof payload.access_token !== 'string' || !payload.access_token) {
      throw new UnauthorizedException('GitHub OAuth code exchange failed.');
    }

    return payload.access_token;
  }

  private async fetchGithubIdentity(
    accessToken: string,
    installationId?: string,
    discoverInstallation = false,
  ): Promise<NormalizedIdentity> {
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
    const installations =
      installationId || discoverInstallation ? await this.listAccessibleInstallations(accessToken) : [];
    const installation = installationId
      ? installations.find((candidate) => candidate.installationId === installationId)
      : installations[0];

    if (installationId && !installation) {
      throw new UnauthorizedException('GitHub installation is not accessible to this user.');
    }

    return {
      provider: 'github',
      providerUserId: String(user.id),
      providerTeamId: null,
      email,
      displayName: name,
      kind: 'developer',
      metadata: {
        login,
        ...(discoverInstallation ? { installations } : {}),
        ...(installation
          ? {
              installationAccountLogin: installation.accountLogin,
              installationId: installation.installationId,
            }
          : {}),
      },
    };
  }

  private async listAccessibleInstallations(accessToken: string): Promise<GithubInstallationMetadata[]> {
    const response = await this.fetcher(`${this.config.apiBaseUrl}/user/installations?per_page=100`, {
      method: 'GET',
      headers: githubHeaders(accessToken),
    });
    const payload = (await response.json()) as GithubInstallationsResponse;

    if (!response.ok || !Array.isArray(payload.installations)) {
      throw new UnauthorizedException('GitHub installation verification failed.');
    }

    return payload.installations.flatMap((installation) => {
      const account = isRecord(installation) && isRecord(installation.account) ? installation.account : null;

      if (
        !isRecord(installation) ||
        (typeof installation.id !== 'number' && typeof installation.id !== 'string') ||
        !account ||
        typeof account.login !== 'string' ||
        !account.login
      ) {
        return [];
      }

      return [{ accountLogin: account.login, installationId: String(installation.id) }];
    });
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
  const installationMarkerIndex = displayNameParts.indexOf('installation');
  const installationId = installationMarkerIndex >= 0 ? displayNameParts[installationMarkerIndex + 1] : undefined;
  const displayName =
    installationMarkerIndex >= 0
      ? displayNameParts.slice(0, installationMarkerIndex).join(':')
      : displayNameParts.join(':');

  if (provider !== 'github' || !providerUserId || !email || !displayName) {
    throw new UnauthorizedException('Invalid GitHub callback token.');
  }

  return {
    provider: 'github',
    providerUserId,
    providerTeamId: null,
    email,
    displayName: displayName.trim(),
    kind: 'developer',
    metadata: installationId
      ? { installationAccountLogin: providerUserId, installationId, login: providerUserId }
      : { login: providerUserId },
  };
}

function readGithubConfig(): GithubDeveloperIdentityConfig {
  return {
    allowFixtures: process.env.DEV_AUTH_ENABLED === 'true',
    apiBaseUrl: process.env.GITHUB_API_BASE_URL ?? 'https://api.github.com',
    oauthBaseUrl: process.env.GITHUB_OAUTH_BASE_URL ?? 'https://github.com',
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    redirectUri: process.env.GITHUB_REDIRECT_URI,
  };
}

function githubHeaders(accessToken: string): Record<string, string> {
  return {
    accept: 'application/vnd.github+json',
    authorization: `Bearer ${accessToken}`,
    'x-github-api-version': '2022-11-28',
  };
}

function parseCodeCallback(accessToken: string): { code: string; installationId?: string } {
  const parts = accessToken.split(':');
  const code = parts[1];

  if (!code) {
    throw new UnauthorizedException('Invalid GitHub OAuth callback token.');
  }

  const installationMarkerIndex = parts.indexOf('installation');
  const installationId = installationMarkerIndex >= 0 ? parts[installationMarkerIndex + 1] : undefined;

  return {
    code,
    ...(installationId ? { installationId } : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
