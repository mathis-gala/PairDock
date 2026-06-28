import { Inject, Injectable } from '@nestjs/common';
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

export interface AuthResult {
  created: boolean;
  accessToken: string;
  user: PairDockIdentity;
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
  ) {}

  async authenticateDeveloper(accessToken: string): Promise<AuthResult> {
    const identity = await this.developerIdentityPort.getDeveloperIdentity(accessToken);
    return this.authenticate(identity);
  }

  async authenticatePm(accessToken: string): Promise<AuthResult> {
    const identity = await this.pmIdentityPort.getPmIdentity(accessToken);
    return this.authenticate(identity);
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

      return this.buildResult(existingUser, false);
    }

    const existingUserByEmail = await this.usersService.findByEmail(identity.email);
    const user =
      existingUserByEmail ??
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
