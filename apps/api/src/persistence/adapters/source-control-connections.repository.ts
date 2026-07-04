import { Inject, Injectable } from '@nestjs/common';
import type { SourceControlConnection } from '@pairdock/domain';
import { DatabaseClient, type DatabaseExecutor } from '../client.js';
import type {
  CreateSourceControlConnectionInput,
  SourceControlConnectionsRepository,
} from '../ports/source-control-connections.repository.js';
import { mapSourceControlConnection } from './mappers.js';

@Injectable()
export class SourceControlConnectionsRepositoryAdapter implements SourceControlConnectionsRepository {
  constructor(@Inject(DatabaseClient) private readonly prisma: DatabaseExecutor) {}

  async create(input: CreateSourceControlConnectionInput): Promise<SourceControlConnection> {
    const record = await this.prisma.sourceControlConnection.create({
      data: {
        ownerUserId: input.ownerUserId,
        providerConnectionId: input.providerConnectionId,
        accountLogin: input.accountLogin,
      },
    });

    return mapSourceControlConnection(record);
  }

  async findById(id: string): Promise<SourceControlConnection | null> {
    const record = await this.prisma.sourceControlConnection.findUnique({ where: { id } });
    return record ? mapSourceControlConnection(record) : null;
  }

  async findByOwnerAndProviderConnection(input: {
    ownerUserId: string;
    providerConnectionId: string;
  }): Promise<SourceControlConnection | null> {
    const record = await this.prisma.sourceControlConnection.findFirst({
      where: {
        ownerUserId: input.ownerUserId,
        providerConnectionId: input.providerConnectionId,
      },
    });

    return record ? mapSourceControlConnection(record) : null;
  }
}
