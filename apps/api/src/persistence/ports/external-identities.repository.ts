import type { ExternalIdentity } from '@pairdock/domain';

export interface CreateExternalIdentityInput {
  userId: string;
  provider: ExternalIdentity['provider'];
  providerUserId: string;
  providerTeamId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ExternalIdentitiesRepository {
  create(input: CreateExternalIdentityInput): Promise<ExternalIdentity>;
  findById(id: string): Promise<ExternalIdentity | null>;
  findByUserAndProvider(input: {
    userId: string;
    provider: ExternalIdentity['provider'];
  }): Promise<ExternalIdentity | null>;
  findByProviderIdentity(input: {
    provider: ExternalIdentity['provider'];
    providerUserId: string;
    providerTeamId?: string | null;
  }): Promise<ExternalIdentity | null>;
  updateMetadata(id: string, metadata: Record<string, unknown>): Promise<ExternalIdentity>;
}
