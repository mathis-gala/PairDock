import { Inject, Injectable } from '@nestjs/common';
import type { ExternalIdentity } from '@pairdock/domain';
import type { DatabaseExecutor } from '../client.js';
import { DatabaseClient } from '../client.js';
import type {
  CreateExternalIdentityInput,
  ExternalIdentitiesRepository,
} from '../ports/external-identities.repository.js';
import { serializeJsonObject } from './json-parsers.js';
import { mapExternalIdentity } from './mappers.js';

@Injectable()
export class ExternalIdentitiesRepositoryAdapter implements ExternalIdentitiesRepository {
  constructor(@Inject(DatabaseClient) private readonly prisma: DatabaseExecutor) {}

  async create(input: CreateExternalIdentityInput): Promise<ExternalIdentity> {
    const record = await this.prisma.externalIdentity.create({
      data: {
        userId: input.userId,
        provider: input.provider,
        providerUserId: input.providerUserId,
        providerTeamId: input.providerTeamId ?? null,
        metadata: serializeJsonObject(input.metadata ?? {}),
      },
    });

    return mapExternalIdentity(record);
  }

  async findById(id: string): Promise<ExternalIdentity | null> {
    const record = await this.prisma.externalIdentity.findUnique({ where: { id } });
    return record ? mapExternalIdentity(record) : null;
  }

  async findByProviderIdentity(input: {
    provider: ExternalIdentity['provider'];
    providerUserId: string;
    providerTeamId?: string | null;
  }): Promise<ExternalIdentity | null> {
    const record = await this.prisma.externalIdentity.findFirst({
      where: {
        provider: input.provider,
        providerUserId: input.providerUserId,
        providerTeamId: input.providerTeamId ?? null,
      },
    });

    return record ? mapExternalIdentity(record) : null;
  }
}
