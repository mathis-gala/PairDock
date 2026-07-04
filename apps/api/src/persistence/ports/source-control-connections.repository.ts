import type { SourceControlConnection } from '@pairdock/domain';

export interface CreateSourceControlConnectionInput {
  ownerUserId: string;
  provider: SourceControlConnection['provider'];
  providerConnectionId: string;
  accountLogin: string;
}

export interface SourceControlConnectionsRepository {
  create(input: CreateSourceControlConnectionInput): Promise<SourceControlConnection>;
  findById(id: string): Promise<SourceControlConnection | null>;
  findByOwnerAndProviderConnection(input: {
    ownerUserId: string;
    providerConnectionId: string;
  }): Promise<SourceControlConnection | null>;
}
