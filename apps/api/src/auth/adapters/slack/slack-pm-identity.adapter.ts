import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { NormalizedIdentity, PmIdentityPort } from '@pairdock/domain';
import { areIdentityFixturesEnabled } from '../../development-pm-auth.js';

interface SlackPmIdentityConfig {
  allowFixtures?: boolean;
  apiBaseUrl: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}

interface SlackAuthTestResponse {
  ok?: unknown;
  user_id?: unknown;
  team_id?: unknown;
  error?: unknown;
}

interface SlackUserInfoResponse {
  ok?: unknown;
  error?: unknown;
  user?: {
    id?: unknown;
    profile?: {
      email?: unknown;
      real_name?: unknown;
      display_name?: unknown;
    };
  };
}

interface SlackOAuthResponse {
  ok?: unknown;
  authed_user?: {
    access_token?: unknown;
  };
  access_token?: unknown;
  error?: unknown;
}

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

@Injectable()
export class SlackPmIdentityAdapter implements PmIdentityPort {
  constructor(
    private readonly config: SlackPmIdentityConfig = readSlackConfig(),
    private readonly fetcher: Fetcher = fetch,
  ) {}

  async getPmIdentity(accessToken: string): Promise<NormalizedIdentity> {
    if (accessToken.startsWith('slack:')) {
      if (!this.config.allowFixtures) {
        throw new UnauthorizedException('Development authentication fixtures are disabled.');
      }

      return parseFixtureIdentity(accessToken);
    }

    const token = accessToken.startsWith('code:')
      ? await this.exchangeCode(accessToken.slice('code:'.length))
      : accessToken;
    return this.fetchSlackIdentity(token);
  }

  private async exchangeCode(code: string): Promise<string> {
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new UnauthorizedException('Slack OAuth client credentials are not configured.');
    }

    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
    });

    if (this.config.redirectUri) {
      body.set('redirect_uri', this.config.redirectUri);
    }

    const response = await this.fetcher(`${this.config.apiBaseUrl}/oauth.v2.access`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    const payload = (await response.json()) as SlackOAuthResponse;

    if (!response.ok || payload.ok !== true) {
      throw new UnauthorizedException('Slack OAuth code exchange failed.');
    }

    const token = payload.authed_user?.access_token ?? payload.access_token;

    if (typeof token !== 'string' || !token) {
      throw new UnauthorizedException('Slack OAuth response did not include a user token.');
    }

    return token;
  }

  private async fetchSlackIdentity(accessToken: string): Promise<NormalizedIdentity> {
    const authResponse = await this.fetcher(`${this.config.apiBaseUrl}/auth.test`, {
      method: 'POST',
      headers: slackHeaders(accessToken),
    });
    const auth = (await authResponse.json()) as SlackAuthTestResponse;

    if (!authResponse.ok || auth.ok !== true || typeof auth.user_id !== 'string' || typeof auth.team_id !== 'string') {
      throw new UnauthorizedException('Slack PM identity lookup failed.');
    }

    const userResponse = await this.fetcher(
      `${this.config.apiBaseUrl}/users.info?${new URLSearchParams({ user: auth.user_id })}`,
      {
        method: 'GET',
        headers: slackHeaders(accessToken),
      },
    );
    const userInfo = (await userResponse.json()) as SlackUserInfoResponse;
    const profile = userInfo.user?.profile;

    if (!userResponse.ok || userInfo.ok !== true || typeof profile?.email !== 'string') {
      throw new UnauthorizedException('Slack user profile lookup failed.');
    }

    const displayName =
      typeof profile.real_name === 'string' && profile.real_name
        ? profile.real_name
        : typeof profile.display_name === 'string'
          ? profile.display_name
          : profile.email;

    return {
      provider: 'slack',
      providerUserId: auth.user_id,
      providerTeamId: auth.team_id,
      email: profile.email,
      displayName,
      kind: 'pm',
      metadata: {},
    };
  }
}

function parseFixtureIdentity(accessToken: string): NormalizedIdentity {
  const [provider, providerUserId, providerTeamId, email, ...displayNameParts] = accessToken.split(':');

  if (provider !== 'slack' || !providerUserId || !providerTeamId || !email || displayNameParts.length === 0) {
    throw new UnauthorizedException('Invalid Slack callback token.');
  }

  return {
    provider: 'slack',
    providerUserId,
    providerTeamId,
    email,
    displayName: displayNameParts.join(':').trim(),
    kind: 'pm',
    metadata: {},
  };
}

function readSlackConfig(): SlackPmIdentityConfig {
  return {
    allowFixtures: areIdentityFixturesEnabled(),
    apiBaseUrl: process.env.SLACK_API_BASE_URL ?? 'https://slack.com/api',
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    redirectUri: process.env.SLACK_REDIRECT_URI,
  };
}

function slackHeaders(accessToken: string): Record<string, string> {
  return {
    authorization: `Bearer ${accessToken}`,
  };
}
