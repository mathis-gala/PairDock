import { Inject, Injectable } from '@nestjs/common';
import { DatabaseClient, type DatabaseExecutor } from '../client.js';
import type { PersistenceRepositories, PersistenceUnitOfWork } from '../ports/persistence-unit-of-work.js';
import { AgentEventsRepositoryAdapter } from './agent-events.repository.js';
import { ExternalIdentitiesRepositoryAdapter } from './external-identities.repository.js';
import { ProjectsRepositoryAdapter } from './projects.repository.js';
import { ReviewRequestsRepositoryAdapter } from './review-requests.repository.js';
import { SessionMembersRepositoryAdapter } from './session-members.repository.js';
import { SessionsRepositoryAdapter } from './sessions.repository.js';
import { SourceControlConnectionsRepositoryAdapter } from './source-control-connections.repository.js';
import { UsersRepositoryAdapter } from './users.repository.js';
import { ValidationRunsRepositoryAdapter } from './validation-runs.repository.js';

function createPersistenceRepositories(prisma: DatabaseExecutor): PersistenceRepositories {
  return {
    users: new UsersRepositoryAdapter(prisma),
    externalIdentities: new ExternalIdentitiesRepositoryAdapter(prisma),
    sourceControlConnections: new SourceControlConnectionsRepositoryAdapter(prisma),
    projects: new ProjectsRepositoryAdapter(prisma),
    sessions: new SessionsRepositoryAdapter(prisma),
    sessionMembers: new SessionMembersRepositoryAdapter(prisma),
    agentEvents: new AgentEventsRepositoryAdapter(prisma),
    validationRuns: new ValidationRunsRepositoryAdapter(prisma),
    reviewRequests: new ReviewRequestsRepositoryAdapter(prisma),
  };
}

@Injectable()
export class PersistenceUnitOfWorkAdapter implements PersistenceUnitOfWork {
  constructor(@Inject(DatabaseClient) private readonly prisma: DatabaseClient) {}

  async execute<T>(work: (repositories: PersistenceRepositories) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (transaction) => work(createPersistenceRepositories(transaction)));
  }
}
