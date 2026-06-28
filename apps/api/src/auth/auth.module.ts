import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { UsersModule } from '../users/users.module.js';
import { GithubDeveloperIdentityAdapter } from './adapters/github/github-developer-identity.adapter.js';
import { SlackPmIdentityAdapter } from './adapters/slack/slack-pm-identity.adapter.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { DEVELOPER_IDENTITY_PORT, PM_IDENTITY_PORT } from './auth.tokens.js';
import { AuthTokenService } from './auth-token.service.js';
import { AuthenticatedUserGuard } from './authenticated-user.guard.js';

@Module({
  imports: [PersistenceModule, UsersModule],
  controllers: [AuthController],
  providers: [
    GithubDeveloperIdentityAdapter,
    SlackPmIdentityAdapter,
    AuthTokenService,
    AuthenticatedUserGuard,
    AuthService,
    { provide: DEVELOPER_IDENTITY_PORT, useExisting: GithubDeveloperIdentityAdapter },
    { provide: PM_IDENTITY_PORT, useExisting: SlackPmIdentityAdapter },
  ],
  exports: [AuthTokenService, AuthenticatedUserGuard],
})
export class AuthModule {}
