import type { AgentEventsRepository } from './agent-events.repository.js';
import type { ExternalIdentitiesRepository } from './external-identities.repository.js';
import type { NotificationsRepository } from './notifications.repository.js';
import type { ProjectMembersRepository } from './project-members.repository.js';
import type { ProjectReadinessRepository } from './project-readiness.repository.js';
import type { ProjectsRepository } from './projects.repository.js';
import type { ReviewRequestsRepository } from './review-requests.repository.js';
import type { SessionMembersRepository } from './session-members.repository.js';
import type { SessionsRepository } from './sessions.repository.js';
import type { SourceControlConnectionsRepository } from './source-control-connections.repository.js';
import type { UsersRepository } from './users.repository.js';
import type { ValidationRunsRepository } from './validation-runs.repository.js';

export interface PersistenceRepositories {
  users: UsersRepository;
  externalIdentities: ExternalIdentitiesRepository;
  sourceControlConnections: SourceControlConnectionsRepository;
  projects: ProjectsRepository;
  projectMembers: ProjectMembersRepository;
  projectReadiness: ProjectReadinessRepository;
  sessions: SessionsRepository;
  sessionMembers: SessionMembersRepository;
  agentEvents: AgentEventsRepository;
  validationRuns: ValidationRunsRepository;
  reviewRequests: ReviewRequestsRepository;
  notifications: NotificationsRepository;
}

export interface PersistenceUnitOfWork {
  execute<T>(work: (repositories: PersistenceRepositories) => Promise<T>): Promise<T>;
}
