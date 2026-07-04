import { Module } from '@nestjs/common';
import { AgentEventsRepositoryAdapter } from './adapters/agent-events.repository.js';
import { ExternalIdentitiesRepositoryAdapter } from './adapters/external-identities.repository.js';
import { MessagesRepositoryAdapter } from './adapters/messages.repository.js';
import { NotificationsRepositoryAdapter } from './adapters/notifications.repository.js';
import { ProjectMembersRepositoryAdapter } from './adapters/project-members.repository.js';
import { ProjectReadinessRepositoryAdapter } from './adapters/project-readiness.repository.js';
import { ProjectsRepositoryAdapter } from './adapters/projects.repository.js';
import { ReviewRequestsRepositoryAdapter } from './adapters/review-requests.repository.js';
import { SessionMembersRepositoryAdapter } from './adapters/session-members.repository.js';
import { SessionsRepositoryAdapter } from './adapters/sessions.repository.js';
import { SourceControlConnectionsRepositoryAdapter } from './adapters/source-control-connections.repository.js';
import { PersistenceUnitOfWorkAdapter } from './adapters/unit-of-work.js';
import { UsersRepositoryAdapter } from './adapters/users.repository.js';
import { ValidationRunsRepositoryAdapter } from './adapters/validation-runs.repository.js';
import { DatabaseClient } from './client.js';
import {
  AGENT_EVENTS_REPOSITORY,
  EXTERNAL_IDENTITIES_REPOSITORY,
  MESSAGES_REPOSITORY,
  NOTIFICATIONS_REPOSITORY,
  PERSISTENCE_UNIT_OF_WORK,
  PROJECT_MEMBERS_REPOSITORY,
  PROJECT_READINESS_REPOSITORY,
  PROJECTS_REPOSITORY,
  REVIEW_REQUESTS_REPOSITORY,
  SESSION_MEMBERS_REPOSITORY,
  SESSIONS_REPOSITORY,
  SOURCE_CONTROL_CONNECTIONS_REPOSITORY,
  USERS_REPOSITORY,
  VALIDATION_RUNS_REPOSITORY,
} from './persistence.tokens.js';

@Module({
  providers: [
    DatabaseClient,
    UsersRepositoryAdapter,
    ExternalIdentitiesRepositoryAdapter,
    SourceControlConnectionsRepositoryAdapter,
    ProjectsRepositoryAdapter,
    ProjectMembersRepositoryAdapter,
    ProjectReadinessRepositoryAdapter,
    SessionsRepositoryAdapter,
    SessionMembersRepositoryAdapter,
    MessagesRepositoryAdapter,
    AgentEventsRepositoryAdapter,
    ValidationRunsRepositoryAdapter,
    ReviewRequestsRepositoryAdapter,
    NotificationsRepositoryAdapter,
    PersistenceUnitOfWorkAdapter,
    { provide: USERS_REPOSITORY, useExisting: UsersRepositoryAdapter },
    { provide: EXTERNAL_IDENTITIES_REPOSITORY, useExisting: ExternalIdentitiesRepositoryAdapter },
    { provide: SOURCE_CONTROL_CONNECTIONS_REPOSITORY, useExisting: SourceControlConnectionsRepositoryAdapter },
    { provide: PROJECTS_REPOSITORY, useExisting: ProjectsRepositoryAdapter },
    { provide: PROJECT_MEMBERS_REPOSITORY, useExisting: ProjectMembersRepositoryAdapter },
    { provide: PROJECT_READINESS_REPOSITORY, useExisting: ProjectReadinessRepositoryAdapter },
    { provide: SESSIONS_REPOSITORY, useExisting: SessionsRepositoryAdapter },
    { provide: SESSION_MEMBERS_REPOSITORY, useExisting: SessionMembersRepositoryAdapter },
    { provide: MESSAGES_REPOSITORY, useExisting: MessagesRepositoryAdapter },
    { provide: AGENT_EVENTS_REPOSITORY, useExisting: AgentEventsRepositoryAdapter },
    { provide: VALIDATION_RUNS_REPOSITORY, useExisting: ValidationRunsRepositoryAdapter },
    { provide: REVIEW_REQUESTS_REPOSITORY, useExisting: ReviewRequestsRepositoryAdapter },
    { provide: NOTIFICATIONS_REPOSITORY, useExisting: NotificationsRepositoryAdapter },
    { provide: PERSISTENCE_UNIT_OF_WORK, useExisting: PersistenceUnitOfWorkAdapter },
  ],
  exports: [
    DatabaseClient,
    USERS_REPOSITORY,
    EXTERNAL_IDENTITIES_REPOSITORY,
    SOURCE_CONTROL_CONNECTIONS_REPOSITORY,
    PROJECTS_REPOSITORY,
    PROJECT_MEMBERS_REPOSITORY,
    PROJECT_READINESS_REPOSITORY,
    SESSIONS_REPOSITORY,
    SESSION_MEMBERS_REPOSITORY,
    MESSAGES_REPOSITORY,
    AGENT_EVENTS_REPOSITORY,
    VALIDATION_RUNS_REPOSITORY,
    REVIEW_REQUESTS_REPOSITORY,
    NOTIFICATIONS_REPOSITORY,
    PERSISTENCE_UNIT_OF_WORK,
  ],
})
export class PersistenceModule {}
