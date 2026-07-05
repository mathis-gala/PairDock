import type { PairDockUser } from '@pairdock/domain';

export interface CreateUserInput {
  email: string;
  displayName?: string | null;
  kind: PairDockUser['kind'];
}

export interface UsersRepository {
  create(input: CreateUserInput): Promise<PairDockUser>;
  findById(id: string): Promise<PairDockUser | null>;
  findByEmail(email: string): Promise<PairDockUser | null>;
  updateProfile(id: string, input: { displayName?: string | null }): Promise<PairDockUser>;
}
