import { Injectable } from '@nestjs/common';
import type { PairDockUser } from '@pairdock/domain';
import type { DatabaseExecutor } from '../client.js';
import type { CreateUserInput, UsersRepository } from '../ports/users.repository.js';
import { mapUser } from './mappers.js';

@Injectable()
export class UsersRepositoryAdapter implements UsersRepository {
  constructor(private readonly prisma: DatabaseExecutor) {}

  async create(input: CreateUserInput): Promise<PairDockUser> {
    const record = await this.prisma.user.create({
      data: {
        email: input.email,
        displayName: input.displayName ?? null,
        kind: input.kind,
      },
    });

    return mapUser(record);
  }

  async findById(id: string): Promise<PairDockUser | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? mapUser(record) : null;
  }
}
