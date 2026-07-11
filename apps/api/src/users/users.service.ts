import { Inject, Injectable } from '@nestjs/common';
import type { PairDockUser } from '@pairdock/domain';
import { USERS_REPOSITORY } from '../persistence/persistence.tokens.js';
import type { UsersRepository } from '../persistence/ports/users.repository.js';

@Injectable()
export class UsersService {
  constructor(@Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepository) {}

  findById(id: string): Promise<PairDockUser | null> {
    return this.usersRepository.findById(id);
  }

  findByEmail(email: string, kind: PairDockUser['kind']): Promise<PairDockUser | null> {
    return this.usersRepository.findByEmail(email, kind);
  }

  create(input: { email: string; displayName?: string | null; kind: PairDockUser['kind'] }): Promise<PairDockUser> {
    return this.usersRepository.create(input);
  }

  updateProfile(id: string, input: { displayName?: string | null }): Promise<PairDockUser> {
    return this.usersRepository.updateProfile(id, input);
  }
}
