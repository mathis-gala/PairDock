import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { NormalizedIdentity, PmIdentityPort } from '@pairdock/domain';

@Injectable()
export class SlackPmIdentityAdapter implements PmIdentityPort {
  async getPmIdentity(accessToken: string): Promise<NormalizedIdentity> {
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
}
