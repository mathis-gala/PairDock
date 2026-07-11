import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import type { PairDockIdentity, Project, ReviewRequestRecord, Session, ValidationRun } from '@pairdock/domain';
import type { AgentCommandEnvelope } from '@pairdock/shared-contracts';
import type { AgentCommandRouterService } from '../../../../../apps/api/src/agent-gateway/agent-command-router.service.js';
import type {
  PersistenceRepositories,
  PersistenceUnitOfWork,
} from '../../../../../apps/api/src/persistence/ports/persistence-unit-of-work.js';
import type { ProjectsRepository } from '../../../../../apps/api/src/persistence/ports/projects.repository.js';
import type { ReviewRequestsRepository } from '../../../../../apps/api/src/persistence/ports/review-requests.repository.js';
import type { SessionMembersRepository } from '../../../../../apps/api/src/persistence/ports/session-members.repository.js';
import type { SessionsRepository } from '../../../../../apps/api/src/persistence/ports/sessions.repository.js';
import type { SourceControlConnectionsRepository } from '../../../../../apps/api/src/persistence/ports/source-control-connections.repository.js';
import type { ValidationRunsRepository } from '../../../../../apps/api/src/persistence/ports/validation-runs.repository.js';
import { CreateDraftReviewRequestUseCase } from '../../../../../apps/api/src/review-requests/create-draft-review-request.use-case.js';
import type { SourceControlPort } from '../../../../../apps/api/src/source-control/source-control.port.js';
import { ValidationPolicy } from '../../../../../apps/api/src/validation/validation.policy.js';

const developer: PairDockIdentity = {
  id: '10000000-0000-4000-8000-000000000001',
  email: 'dev@pairdock.test',
  displayName: 'Dev Owner',
  kind: 'developer',
};

const pm: PairDockIdentity = {
  id: '10000000-0000-4000-8000-000000000002',
  email: 'pm@pairdock.test',
  displayName: 'PM Reviewer',
  kind: 'pm',
};

function buildFixture(overrides: { validation?: Partial<ValidationRun>; session?: Partial<Session> } = {}) {
  const projectId = '20000000-0000-4000-8000-000000000001';
  const sessionId = '30000000-0000-4000-8000-000000000001';
  const connectionId = '40000000-0000-4000-8000-000000000001';
  const project: Project = {
    id: projectId,
    ownerUserId: developer.id,
    sourceControlConnectionId: connectionId,
    name: 'PairDock',
    description: null,
    repoFullName: 'mathis/pairdock-test',
    defaultBranch: 'main',
    defaultModelId: 'codex-cli/gpt-5.4',
    pmCanStartSessions: true,
    agentProjectKey: 'agent-local-1',
    createdAt: new Date('2026-07-04T10:00:00.000Z'),
  };
  const session: Session = {
    id: sessionId,
    projectId,
    createdByUserId: developer.id,
    status: 'AWAITING_PM_VALIDATION',
    modelId: 'codex-cli/gpt-5.4',
    branchName: 'pairdock/session-30000000',
    worktreeRef: null,
    previewUrl: 'https://preview.pairdock.test',
    lastError: null,
    createdAt: new Date('2026-07-04T10:00:00.000Z'),
    closedAt: null,
    ...overrides.session,
  };
  const validation: ValidationRun = {
    id: '50000000-0000-4000-8000-000000000001',
    sessionId,
    status: 'passed',
    buildStatus: 'passed',
    testStatus: 'passed',
    lintStatus: 'passed',
    previewStatus: 'passed',
    logsRef: null,
    createdAt: new Date('2026-07-04T10:05:00.000Z'),
    ...overrides.validation,
  };
  const repositories = new InMemoryRepositories(project, session, validation, {
    id: connectionId,
    ownerUserId: developer.id,
    provider: 'github',
    providerConnectionId: 'test-installation-1',
    accountLogin: 'mathis',
    createdAt: new Date('2026-07-04T09:00:00.000Z'),
  });
  const router = new RecordingAgentCommandRouter(repositories.callOrder);
  const sourceControl = new RecordingSourceControlPort(repositories.callOrder);
  const useCase = new CreateDraftReviewRequestUseCase(
    repositories.sessions,
    repositories.projects,
    repositories.validationRuns,
    repositories.sourceControlConnections,
    repositories.sessionMembers,
    repositories.unitOfWork,
    router as unknown as AgentCommandRouterService,
    sourceControl,
    new ValidationPolicy(),
  );

  return { repositories, router, sessionId, sourceControl, useCase };
}

test('BT-030: failed validation blocks draft review request creation before push or source-control calls', async () => {
  const { repositories, router, sessionId, sourceControl, useCase } = buildFixture({
    validation: {
      status: 'failed',
      testStatus: 'failed',
    },
  });

  await assert.rejects(() => useCase.create(sessionId, pm), /Test validation must pass/);

  assert.deepEqual(router.commands, []);
  assert.deepEqual(sourceControl.requests, []);
  assert.equal(repositories.reviewRequests.records.length, 0);
});

test('BT-031 and BT-032: branch push is requested before draft review request creation and persisted', async () => {
  const { repositories, router, sessionId, sourceControl, useCase } = buildFixture();

  const response = await useCase.create(sessionId, pm);

  assert.deepEqual(
    router.commands.map((command) => command.type),
    ['git.pushBranch'],
  );
  assert.equal(sourceControl.requests.length, 1);
  assert.deepEqual(repositories.callOrder, [
    'push',
    'source-control',
    'persist-review-request',
    'persist-session-status',
  ]);
  assert.equal(sourceControl.requests[0]?.repoFullName, 'mathis/pairdock-test');
  assert.equal(sourceControl.requests[0]?.branchName, 'pairdock/session-30000000');
  assert.equal(sourceControl.requests[0]?.baseBranch, 'main');
  assert.equal(response.reviewRequestUrl, 'https://github.test/mathis/pairdock-test/pull/42');
  assert.equal(
    repositories.reviewRequests.records[0]?.reviewRequestUrl,
    'https://github.test/mathis/pairdock-test/pull/42',
  );
  assert.equal(repositories.currentSession.status, 'REVIEW_REQUEST_CREATED');
});

class RecordingAgentCommandRouter {
  readonly commands: AgentCommandEnvelope[] = [];

  constructor(private readonly callOrder?: string[]) {}

  async routeToOwningAgent(_sessionId: string, command: AgentCommandEnvelope): Promise<void> {
    this.commands.push(command);
    this.callOrder?.push('push');
  }
}

class RecordingSourceControlPort implements SourceControlPort {
  readonly requests: Parameters<SourceControlPort['createDraftReviewRequest']>[0][] = [];

  constructor(private readonly callOrder?: string[]) {}

  async assertProjectAccess(): Promise<void> {}

  async listInstallationRepositories(): ReturnType<SourceControlPort['listInstallationRepositories']> {
    return [{ fullName: 'mathis/pairdock-test', name: 'pairdock-test', defaultBranch: 'main' }];
  }

  async listRepositoryBranches(): ReturnType<SourceControlPort['listRepositoryBranches']> {
    return ['main'];
  }

  async createDraftReviewRequest(input: Parameters<SourceControlPort['createDraftReviewRequest']>[0]) {
    this.requests.push(input);
    this.callOrder?.push('source-control');
    return {
      reviewRequestNumber: 42,
      reviewRequestUrl: 'https://github.test/mathis/pairdock-test/pull/42',
    };
  }
}

class InMemoryRepositories {
  readonly callOrder: string[] = [];
  readonly reviewRequests = new InMemoryReviewRequestsRepository(this.callOrder);

  readonly sessions: SessionsRepository;
  readonly projects: ProjectsRepository;
  readonly validationRuns: ValidationRunsRepository;
  readonly sourceControlConnections: SourceControlConnectionsRepository;
  readonly sessionMembers: SessionMembersRepository;

  readonly unitOfWork: PersistenceUnitOfWork;
  currentSession: Session;

  constructor(
    project: Project,
    session: Session,
    validation: ValidationRun,
    connection: Parameters<SourceControlConnectionsRepository['create']>[0] & { id: string; createdAt: Date },
  ) {
    this.currentSession = session;
    this.sessions = {
      create: async () => session,
      findById: async (id: string) => (id === session.id ? this.currentSession : null),
      listByProjectIds: async () => [this.currentSession],
      updateStatus: async (input) => {
        this.callOrder.push('persist-session-status');
        this.currentSession = {
          ...this.currentSession,
          status: input.status,
          lastError: input.lastError ?? this.currentSession.lastError,
          previewUrl: input.previewUrl ?? this.currentSession.previewUrl,
          closedAt: input.closedAt ?? this.currentSession.closedAt,
        };
        return this.currentSession;
      },
    };
    this.projects = {
      create: async () => project,
      findByAgentProjectKey: async () => project,
      findById: async (id: string) => (id === project.id ? project : null),
      listByAgentProjectKey: async () => [project],
      listOwnedByUserId: async () => [],
      listSharedByUserId: async () => [],
    };
    this.validationRuns = {
      create: async () => validation,
      findLatestBySessionId: async (id: string) => (id === session.id ? validation : null),
    };
    this.sourceControlConnections = {
      create: async () => connection,
      findById: async (id: string) => (id === connection.id ? connection : null),
      findByOwnerAndProviderConnection: async () => connection,
    };
    this.sessionMembers = {
      add: async () => ({ id: randomUUID(), sessionId: session.id, userId: pm.id, role: 'pm' }),
      findBySessionIdAndUserId: async (_sessionId: string, userId: string) =>
        userId === pm.id ? { id: randomUUID(), sessionId: session.id, userId: pm.id, role: 'pm' } : null,
      listBySessionId: async () => [
        { id: randomUUID(), sessionId: session.id, userId: developer.id, role: 'developer' },
        { id: randomUUID(), sessionId: session.id, userId: pm.id, role: 'pm' },
      ],
    };

    this.unitOfWork = {
      execute: async (work) =>
        work({
          reviewRequests: this.reviewRequests,
          sessions: this.sessions,
        } as unknown as PersistenceRepositories),
    };
  }
}

class InMemoryReviewRequestsRepository implements ReviewRequestsRepository {
  readonly records: ReviewRequestRecord[] = [];

  constructor(private readonly callOrder: string[]) {}

  async create(input: Parameters<ReviewRequestsRepository['create']>[0]): Promise<ReviewRequestRecord> {
    this.callOrder.push('persist-review-request');
    const record = {
      id: randomUUID(),
      createdAt: new Date('2026-07-04T10:10:00.000Z'),
      reviewRequestNumber: input.reviewRequestNumber ?? null,
      reviewRequestUrl: input.reviewRequestUrl ?? null,
      sessionId: input.sessionId,
      status: input.status,
    };
    this.records.push(record);
    return record;
  }

  async findBySessionId(sessionId: string): Promise<ReviewRequestRecord | null> {
    return this.records.find((record) => record.sessionId === sessionId) ?? null;
  }

  async findManyBySessionIds(sessionIds: string[]): Promise<ReviewRequestRecord[]> {
    return this.records.filter((record) => sessionIds.includes(record.sessionId));
  }
}
