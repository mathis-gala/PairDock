import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  DeveloperIdentityPort,
  NormalizedIdentity,
  PairDockIdentity,
  PairDockUser,
  PmIdentityPort,
} from '@pairdock/domain';
import { EXTERNAL_IDENTITIES_REPOSITORY } from '../persistence/persistence.tokens.js';
import type { ExternalIdentitiesRepository } from '../persistence/ports/external-identities.repository.js';
import { UsersService } from '../users/users.service.js';
import { DEVELOPER_IDENTITY_PORT, PM_IDENTITY_PORT } from './auth.tokens.js';
import { AuthTokenService } from './auth-token.service.js';
import { isDevelopmentPmAuthEnabled } from './development-pm-auth.js';
import { GithubAuthStateService } from './github-auth-state.service.js';

export interface AuthResult {
  created: boolean;
  accessToken: string;
  user: PairDockIdentity;
}

export type AuthProvider = 'github' | 'slack';

export interface AuthProviders {
  developmentPmAuthEnabled: boolean;
}

interface OAuthStartUrlConfig {
  frontendUrl: string;
  githubAppSlug?: string;
  githubClientId?: string;
  githubRedirectUri?: string;
  githubOAuthBaseUrl: string;
  slackClientId?: string;
  slackRedirectUri?: string;
  slackOAuthBaseUrl: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DEVELOPER_IDENTITY_PORT)
    private readonly developerIdentityPort: DeveloperIdentityPort,
    @Inject(PM_IDENTITY_PORT)
    private readonly pmIdentityPort: PmIdentityPort,
    @Inject(EXTERNAL_IDENTITIES_REPOSITORY)
    private readonly externalIdentitiesRepository: ExternalIdentitiesRepository,
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(AuthTokenService)
    private readonly authTokenService: AuthTokenService,
    @Inject(GithubAuthStateService)
    private readonly githubAuthStateService: GithubAuthStateService,
  ) {}

  async authenticateDeveloper(accessToken: string): Promise<AuthResult> {
    const identity = await this.developerIdentityPort.getDeveloperIdentity(accessToken);
    return this.authenticate(identity);
  }

  async authenticatePm(accessToken: string): Promise<AuthResult> {
    const identity = await this.pmIdentityPort.getPmIdentity(accessToken);
    return this.authenticate(identity);
  }

  getAuthProviders(): AuthProviders {
    return { developmentPmAuthEnabled: isDevelopmentPmAuthEnabled() };
  }

  async authenticateDevelopmentPm(): Promise<AuthResult> {
    if (!isDevelopmentPmAuthEnabled()) {
      throw new NotFoundException();
    }

    return this.authenticate({
      provider: 'slack',
      providerUserId: 'pairdock-local-pm',
      providerTeamId: 'pairdock-local',
      email: 'pm@pairdock.test',
      displayName: 'PairDock PM',
      kind: 'pm',
      metadata: { localDevelopment: true },
    });
  }

  getDeveloperStartUrl(): string {
    const config = readOAuthStartUrlConfig();

    if (!config.githubClientId) {
      throw new BadRequestException('GitHub App client id is not configured.');
    }

    const params = new URLSearchParams({
      client_id: config.githubClientId,
      scope: 'user:email',
      state: this.githubAuthStateService.issueAuthorizationState(),
    });

    if (config.githubRedirectUri) {
      params.set('redirect_uri', config.githubRedirectUri);
    }

    return `${config.githubOAuthBaseUrl}/login/oauth/authorize?${params}`;
  }

  getDeveloperInstallationUrl(): string {
    const config = readOAuthStartUrlConfig();

    if (!config.githubAppSlug) {
      throw new BadRequestException('GitHub App slug is not configured.');
    }

    const params = new URLSearchParams({
      state: this.githubAuthStateService.issueInstallationState(),
    });

    return `${config.githubOAuthBaseUrl}/apps/${encodeURIComponent(config.githubAppSlug)}/installations/new?${params}`;
  }

  getDeveloperAuthorizationUrl(installationId: string, state: string): string {
    this.githubAuthStateService.verifyInstallationState(state);

    const config = readOAuthStartUrlConfig();

    if (!config.githubClientId) {
      throw new BadRequestException('GitHub App client id is not configured.');
    }

    const params = new URLSearchParams({
      client_id: config.githubClientId,
      scope: 'user:email',
      state: this.githubAuthStateService.issueAuthorizationState(installationId),
    });

    if (config.githubRedirectUri) {
      params.set('redirect_uri', config.githubRedirectUri);
    }

    return `${config.githubOAuthBaseUrl}/login/oauth/authorize?${params}`;
  }

  getPmStartUrl(): string {
    const config = readOAuthStartUrlConfig();

    if (!config.slackClientId) {
      throw new BadRequestException('Slack App client id is not configured.');
    }

    const params = new URLSearchParams({
      client_id: config.slackClientId,
      state: this.githubAuthStateService.issueSlackAuthorizationState(),
      user_scope: 'users:read,users:read.email',
    });

    if (config.slackRedirectUri) {
      params.set('redirect_uri', config.slackRedirectUri);
    }

    return `${config.slackOAuthBaseUrl}/oauth/v2/authorize?${params}`;
  }

  async authenticateDeveloperRedirectUrl(code: string, state: string): Promise<string> {
    const installationId = this.githubAuthStateService.verifyAuthorizationState(state);
    const token = installationId ? `code:${code}:installation:${installationId}` : `code:${code}`;
    const identity = await this.developerIdentityPort.getDeveloperIdentity(token);

    if (!installationId && !hasAccessibleGithubInstallation(identity)) {
      return '/auth/developer/install';
    }

    const result = await this.authenticate(identity);
    return buildFrontendAuthRedirectUrl(result, 'github');
  }

  async authenticatePmRedirectUrl(code: string, state: string): Promise<string> {
    this.githubAuthStateService.verifySlackAuthorizationState(state);
    const result = await this.authenticatePm(`code:${code}`);
    return buildFrontendAuthRedirectUrl(result, 'slack');
  }

  private async authenticate(identity: NormalizedIdentity): Promise<AuthResult> {
    const existingExternalIdentity = await this.externalIdentitiesRepository.findByProviderIdentity({
      provider: identity.provider,
      providerUserId: identity.providerUserId,
      providerTeamId: identity.providerTeamId,
    });

    if (existingExternalIdentity) {
      const existingUser = await this.usersService.findById(existingExternalIdentity.userId);

      if (!existingUser) {
        throw new Error(`External identity ${existingExternalIdentity.id} references a missing user.`);
      }

      await this.externalIdentitiesRepository.updateMetadata(existingExternalIdentity.id, {
        ...existingExternalIdentity.metadata,
        ...identity.metadata,
      });

      return this.buildResult(await this.syncUserProfile(existingUser, identity), false);
    }

    const existingUserByEmail = await this.usersService.findByEmail(identity.email, identity.kind);
    const user =
      (existingUserByEmail ? await this.syncUserProfile(existingUserByEmail, identity) : null) ??
      (await this.usersService.create({
        email: identity.email,
        displayName: identity.displayName,
        kind: identity.kind,
      }));

    await this.externalIdentitiesRepository.create({
      userId: user.id,
      provider: identity.provider,
      providerUserId: identity.providerUserId,
      providerTeamId: identity.providerTeamId,
      metadata: identity.metadata,
    });

    return this.buildResult(user, true);
  }

  private async syncUserProfile(user: PairDockUser, identity: NormalizedIdentity): Promise<PairDockUser> {
    if (user.displayName || !identity.displayName) {
      return user;
    }

    return this.usersService.updateProfile(user.id, { displayName: identity.displayName });
  }

  private buildResult(user: PairDockUser, created: boolean): AuthResult {
    const pairDockIdentity: PairDockIdentity = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      kind: user.kind,
    };

    return {
      created,
      accessToken: this.authTokenService.issue(pairDockIdentity),
      user: pairDockIdentity,
    };
  }
}

function readOAuthStartUrlConfig(): OAuthStartUrlConfig {
  return {
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    githubAppSlug: process.env.GITHUB_APP_SLUG,
    githubClientId: process.env.GITHUB_CLIENT_ID,
    githubRedirectUri: process.env.GITHUB_REDIRECT_URI,
    githubOAuthBaseUrl: process.env.GITHUB_OAUTH_BASE_URL ?? 'https://github.com',
    slackClientId: process.env.SLACK_CLIENT_ID,
    slackRedirectUri: process.env.SLACK_REDIRECT_URI,
    slackOAuthBaseUrl: process.env.SLACK_OAUTH_BASE_URL ?? 'https://slack.com',
  };
}

function buildFrontendAuthRedirectUrl(result: AuthResult, provider: AuthProvider): string {
  const config = readOAuthStartUrlConfig();
  const frontendUrl = new URL(config.frontendUrl);
  const session = encodeURIComponent(
    JSON.stringify({
      accessToken: result.accessToken,
      provider,
      user: result.user,
    }),
  );

  frontendUrl.hash = `pairdock_auth=${session}`;
  return frontendUrl.toString();
}

function hasAccessibleGithubInstallation(identity: NormalizedIdentity): boolean {
  return Array.isArray(identity.metadata.installations) && identity.metadata.installations.length > 0;
}
