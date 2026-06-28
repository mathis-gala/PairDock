import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { AgentEventsRepositoryAdapter } from '../../../../../apps/api/src/persistence/adapters/agent-events.repository.js';
import { ExternalIdentitiesRepositoryAdapter } from '../../../../../apps/api/src/persistence/adapters/external-identities.repository.js';
import { ProjectsRepositoryAdapter } from '../../../../../apps/api/src/persistence/adapters/projects.repository.js';
import { SessionMembersRepositoryAdapter } from '../../../../../apps/api/src/persistence/adapters/session-members.repository.js';
import { SessionsRepositoryAdapter } from '../../../../../apps/api/src/persistence/adapters/sessions.repository.js';
import { SourceControlConnectionsRepositoryAdapter } from '../../../../../apps/api/src/persistence/adapters/source-control-connections.repository.js';
import { PersistenceUnitOfWorkAdapter } from '../../../../../apps/api/src/persistence/adapters/unit-of-work.js';
import { UsersRepositoryAdapter } from '../../../../../apps/api/src/persistence/adapters/users.repository.js';
import { DatabaseClient } from '../../../../../apps/api/src/persistence/client.js';

const prisma = new DatabaseClient();

const users = new UsersRepositoryAdapter(prisma);
const externalIdentities = new ExternalIdentitiesRepositoryAdapter(prisma);
const sourceControlConnections = new SourceControlConnectionsRepositoryAdapter(prisma);
const projects = new ProjectsRepositoryAdapter(prisma);
const sessions = new SessionsRepositoryAdapter(prisma);
const sessionMembers = new SessionMembersRepositoryAdapter(prisma);
const agentEvents = new AgentEventsRepositoryAdapter(prisma);
const unitOfWork = new PersistenceUnitOfWorkAdapter(prisma);

async function resetDatabase() {
  await prisma.pullRequest.deleteMany();
  await prisma.validationRun.deleteMany();
  await prisma.agentEvent.deleteMany();
  await prisma.message.deleteMany();
  await prisma.sessionMember.deleteMany();
  await prisma.session.deleteMany();
  await prisma.project.deleteMany();
  await prisma.sourceControlConnection.deleteMany();
  await prisma.externalIdentity.deleteMany();
  await prisma.user.deleteMany();
}

async function seedSessionFixture() {
  const developer = await users.create({
    email: `dev-${randomUUID()}@pairdock.test`,
    displayName: 'Dev',
    kind: 'developer',
  });

  const pm = await users.create({
    email: `pm-${randomUUID()}@pairdock.test`,
    displayName: 'PM',
    kind: 'pm',
  });

  await externalIdentities.create({
    userId: pm.id,
    provider: 'slack',
    providerUserId: `slack-${randomUUID()}`,
    providerTeamId: 'team-1',
    metadata: { invited: true },
  });

  const connection = await sourceControlConnections.create({
    ownerUserId: developer.id,
    provider: 'github',
    providerConnectionId: `gh-install-${randomUUID()}`,
    accountLogin: 'pairdock-dev',
  });

  const project = await projects.create({
    ownerUserId: developer.id,
    sourceControlConnectionId: connection.id,
    name: 'PairDock',
    repoFullName: 'mathis/pairdock',
    defaultBranch: 'main',
    agentProjectKey: `project-${randomUUID()}`,
  });

  const session = await sessions.create({
    projectId: project.id,
    createdByUserId: developer.id,
    status: 'CREATED',
    modelId: 'codex-cli/gpt-5.4',
  });

  await sessionMembers.add({
    sessionId: session.id,
    userId: developer.id,
    role: 'developer',
  });

  await sessionMembers.add({
    sessionId: session.id,
    userId: pm.id,
    role: 'pm',
  });

  return { connection, developer, pm, project, session };
}

test.before(async () => {
  await prisma.$connect();
});

test.after(async () => {
  await prisma.$disconnect();
});

test.beforeEach(async () => {
  await resetDatabase();
});

test('BT-002: SessionsRepository backed by Prisma persists a created session', async () => {
  const { project, session } = await seedSessionFixture();

  const persisted = await sessions.findById(session.id);

  assert.ok(persisted);
  assert.equal(persisted.status, 'CREATED');
  assert.equal(persisted.modelId, 'codex-cli/gpt-5.4');
  assert.equal(persisted.projectId, project.id);
});

test('BT-003: AgentEventsRepository backed by Prisma persists a valid agent event', async () => {
  const { session } = await seedSessionFixture();

  await agentEvents.create({
    sessionId: session.id,
    agentId: 'agent-local-1',
    type: 'session.progress',
    payload: { status: 'AGENT_CONNECTING', message: 'Connecting local agent' },
  });

  const persistedEvents = await agentEvents.listBySessionId(session.id);

  assert.equal(persistedEvents.length, 1);
  assert.equal(persistedEvents[0]?.type, 'session.progress');
  assert.deepEqual(persistedEvents[0]?.payload, {
    status: 'AGENT_CONNECTING',
    message: 'Connecting local agent',
  });
});

test('BT-038: persistence unit of work commits session status updates and agent events atomically', async () => {
  const { session } = await seedSessionFixture();

  await unitOfWork.execute(async (repositories) => {
    await repositories.agentEvents.create({
      sessionId: session.id,
      agentId: 'agent-local-1',
      type: 'session.progress',
      payload: { status: 'AGENT_CONNECTING' },
    });

    await repositories.sessions.updateStatus({
      id: session.id,
      status: 'AGENT_CONNECTING',
    });
  });

  const committedSession = await sessions.findById(session.id);
  const committedEvents = await agentEvents.listBySessionId(session.id);

  assert.equal(committedSession?.status, 'AGENT_CONNECTING');
  assert.equal(committedEvents.length, 1);

  await assert.rejects(async () => {
    await unitOfWork.execute(async (repositories) => {
      await repositories.agentEvents.create({
        sessionId: session.id,
        agentId: 'agent-local-1',
        type: 'session.progress',
        payload: { status: 'READY' },
      });

      await repositories.sessions.updateStatus({
        id: session.id,
        status: 'READY',
      });

      throw new Error('force rollback');
    });
  }, /force rollback/);

  const rolledBackSession = await sessions.findById(session.id);
  const rolledBackEvents = await agentEvents.listBySessionId(session.id);

  assert.equal(rolledBackSession?.status, 'AGENT_CONNECTING');
  assert.equal(rolledBackEvents.length, 1);
});

test('BT-040: SourceControlConnectionsRepository exposes a provider-neutral connection contract', async () => {
  const developer = await users.create({
    email: `dev-${randomUUID()}@pairdock.test`,
    displayName: 'Dev',
    kind: 'developer',
  });

  const connection = await sourceControlConnections.create({
    ownerUserId: developer.id,
    provider: 'github',
    providerConnectionId: `gh-install-${randomUUID()}`,
    accountLogin: 'pairdock-dev',
  });

  assert.equal(connection.provider, 'github');
  assert.ok(connection.providerConnectionId.startsWith('gh-install-'));
});
