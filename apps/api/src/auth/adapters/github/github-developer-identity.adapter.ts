import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { DeveloperIdentityPort, NormalizedIdentity } from '@pairdock/domain';

@Injectable()
export class GithubDeveloperIdentityAdapter implements DeveloperIdentityPort {
  async getDeveloperIdentity(accessToken: string): Promise<NormalizedIdentity> {
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
}
