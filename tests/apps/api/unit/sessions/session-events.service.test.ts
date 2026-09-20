import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';
import type { AgentEventRecord, Session, ValidationRun } from '@pairdock/domain';
import type { CreateAgentEventInput } from '../../../../../apps/api/src/persistence/ports/agent-events.repository.js';
import type {
  PersistenceRepositories,
  PersistenceUnitOfWork,
} from '../../../../../apps/api/src/persistence/ports/persistence-unit-of-work.js';
import type { SessionsRepository } from '../../../../../apps/api/src/persistence/ports/sessions.repository.js';
import type { CreateValidationRunInput } from '../../../../../apps/api/src/persistence/ports/validation-runs.repository.js';
import { SessionEventsService } from '../../../../../apps/api/src/sessions/session-events.service.js';
import { InvalidSessionTransitionError } from '../../../../../apps/api/src/sessions/session-state-machine.js';

test('a prompt without changes restores the persisted validation outcome and records the original event', async () => {
  for (const status of ['passed', 'failed', null] as const) {
    const fixture = createFixture('AGENT_RUNNING', status);
    const event = { type: 'agent.done', payload: { exitCode: 0, changesDetected: false } } as const;

    const session = await fixture.service.apply(fixture.sessionId, event, 'agent-local');

    assert.equal(
      session?.status,
      status === 'passed' ? 'AWAITING_PM_VALIDATION' : status === 'failed' ? 'FAILED' : 'READY',
    );
    assert.equal(fixture.state.session.status, session?.status);
    assert.equal(fixture.state.validations.length, status ? 1 : 0);
    assert.equal(fixture.state.events.length, 1);
    assert.deepEqual(fixture.state.events[0]?.payload, event.payload);
    assert.equal(fixture.state.events[0]?.agentId, 'agent-local');
  }
});

test('check results commit validation, session outcome, and the unmodified event together', async () => {
  for (const lintStatus of ['passed', 'failed', 'skipped'] as const) {
    const fixture = createFixture('CHECKS_RUNNING');
    const event = {
      type: 'checks.result',
      payload: {
        sessionId: fixture.sessionId,
        ok: true,
        build: { status: 'passed' },
        tests: { status: 'passed' },
        lint: { status: lintStatus, logs: 'Lint failed on src/app.ts' },
        preview: { status: 'passed' },
      },
    } as const;

    const session = await fixture.service.apply(fixture.sessionId, event, 'agent-local');

    const passed = lintStatus === 'passed';
    assert.equal(session?.status, passed ? 'AWAITING_PM_VALIDATION' : 'FAILED');
    assert.equal(session?.previewUrl, 'https://preview.pairdock.test');
    assert.equal(fixture.state.session.status, session?.status);
    assert.equal(fixture.state.validations.length, 1);
    assert.equal(fixture.state.validations[0]?.status, passed ? 'passed' : 'failed');
    assert.equal(fixture.state.validations[0]?.lintStatus, lintStatus);
    assert.equal(fixture.state.events.length, 1);
    assert.deepEqual(fixture.state.events[0]?.payload, event.payload);
    if (passed) {
      assert.equal(session?.lastError, null);
    } else {
      assert.match(session?.lastError ?? '', /Lint failed on src\/app\.ts/);
    }
  }
});

test('a failed session write rolls back both the event and its new validation', async () => {
  const fixture = createFixture('CHECKS_RUNNING', 'failed');
  const before = structuredClone(fixture.state);
  fixture.failSessionUpdate();

  await assert.rejects(
    () =>
      fixture.service.apply(fixture.sessionId, {
        type: 'checks.result',
        payload: {
          sessionId: fixture.sessionId,
          ok: true,
          build: { status: 'passed' },
          tests: { status: 'passed' },
          lint: { status: 'passed' },
          preview: { status: 'passed' },
        },
      }),
    /Session write failed/,
  );

  assert.deepEqual(fixture.state, before);
});

test('an invalid lifecycle transition preserves the session and its event history', async () => {
  const fixture = createFixture('CREATED');
  const before = structuredClone(fixture.state);

  await assert.rejects(
    () => fixture.service.apply(fixture.sessionId, { type: 'agent.done', payload: { exitCode: 0 } }),
    InvalidSessionTransitionError,
  );

  assert.deepEqual(fixture.state, before);
});

function createFixture(status: Session['status'], validationStatus: 'passed' | 'failed' | null = null) {
  const session: Session = {
    id: 'b6f03fa4-f7ec-4f1f-bd46-27c163f0b7c2',
    projectId: '863bdcc7-76ab-4c5d-a4c0-b62475455466',
    createdByUserId: '0a598fe2-0cfb-4470-a7a1-248f20467aa6',
    status,
    modelId: 'codex-cli/gpt-5.4',
    reasoningEffort: 'medium',
    branchName: null,
    worktreeRef: null,
    previewUrl: 'https://preview.pairdock.test',
    lastError: null,
    createdAt: new Date('2026-06-28T10:00:00.000Z'),
    closedAt: null,
  };
  const state: { session: Session; validations: ValidationRun[]; events: AgentEventRecord[] } = {
    session,
    validations: [],
    events: [],
  };
  if (validationStatus) {
    state.validations.push({
      id: 'validation-previous',
      sessionId: session.id,
      status: validationStatus,
      buildStatus: 'passed',
      testStatus: 'passed',
      lintStatus: validationStatus,
      previewStatus: 'passed',
      logsRef: null,
      createdAt: session.createdAt,
    });
  }
  let failSessionUpdate = false;
  const unitOfWork: PersistenceUnitOfWork = {
    async execute(work) {
      const transaction = structuredClone(state);
      const repositories: PersistenceRepositories = {
        get users(): never {
          throw new Error('Unexpected users repository access');
        },
        get externalIdentities(): never {
          throw new Error('Unexpected external identities repository access');
        },
        get sourceControlConnections(): never {
          throw new Error('Unexpected source control repository access');
        },
        get projects(): never {
          throw new Error('Unexpected projects repository access');
        },
        get projectMembers(): never {
          throw new Error('Unexpected project members repository access');
        },
        get projectReadiness(): never {
          throw new Error('Unexpected readiness repository access');
        },
        get sessionMembers(): never {
          throw new Error('Unexpected session members repository access');
        },
        get attachments(): never {
          throw new Error('Unexpected attachments repository access');
        },
        get messages(): never {
          throw new Error('Unexpected messages repository access');
        },
        get reviewRequests(): never {
          throw new Error('Unexpected review requests repository access');
        },
        sessions: {
          async create() {
            throw new Error('Unexpected session creation');
          },
          async listByProjectIds() {
            return [{ ...transaction.session, firstPrompt: null }];
          },
          async findById() {
            return transaction.session;
          },
          async updateStatus(input: Parameters<SessionsRepository['updateStatus']>[0]) {
            if (failSessionUpdate) {
              throw new Error('Session write failed');
            }
            transaction.session = { ...transaction.session, ...input };
            return transaction.session;
          },
        },
        agentEvents: {
          async listBySessionId() {
            return transaction.events;
          },
          async create(input: CreateAgentEventInput) {
            const event: AgentEventRecord = {
              id: `event-${transaction.events.length}`,
              sessionId: input.sessionId ?? null,
              agentId: input.agentId ?? null,
              type: input.type,
              payload: input.payload,
              createdAt: new Date(),
            };
            transaction.events.push(event);
            return event;
          },
        },
        validationRuns: {
          async findLatestBySessionId() {
            return transaction.validations.at(-1) ?? null;
          },
          async create(input: CreateValidationRunInput) {
            const validation: ValidationRun = {
              id: `validation-${transaction.validations.length}`,
              sessionId: input.sessionId,
              status: input.status,
              buildStatus: input.buildStatus ?? null,
              testStatus: input.testStatus ?? null,
              lintStatus: input.lintStatus ?? null,
              previewStatus: input.previewStatus ?? null,
              logsRef: input.logsRef ?? null,
              createdAt: new Date(),
            };
            transaction.validations.push(validation);
            return validation;
          },
        },
      };
      const result = await work(repositories);
      Object.assign(state, transaction);
      return result;
    },
  };
  return {
    service: new SessionEventsService(unitOfWork),
    state,
    sessionId: session.id,
    failSessionUpdate() {
      failSessionUpdate = true;
    },
  };
}
