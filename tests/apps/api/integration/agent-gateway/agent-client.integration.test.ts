import assert from 'node:assert/strict';
import test from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AGENT_PROTOCOL_VERSION } from '@pairdock/shared-contracts';
import { ConnectedAgentsRegistry } from '../../../../../apps/api/src/agent-gateway/connected-agents.registry.js';
import { AppModule } from '../../../../../apps/api/src/app.module.js';
import { DatabaseClient } from '../../../../../apps/api/src/persistence/client.js';
import { AgentClient } from '../../../../../packages/local-agent/src/websocket/agent-client.js';

const prisma = new DatabaseClient();

let app: INestApplication;
let baseUrl: string;

async function resetDatabase() {
  await prisma.agentRegistration.deleteMany();
  await prisma.pullRequest.deleteMany();
  await prisma.validationRun.deleteMany();
  await prisma.agentEvent.deleteMany();
  await prisma.message.deleteMany();
  await prisma.sessionMember.deleteMany();
  await prisma.session.deleteMany();
  await prisma.projectReadinessSnapshot.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.sourceControlConnection.deleteMany();
  await prisma.externalIdentity.deleteMany();
  await prisma.user.deleteMany();
}

async function startApplication() {
  app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0);
  const address = app.getHttpServer().address();

  if (!address || typeof address === 'string') {
    throw new Error('Expected HTTP server to bind to an ephemeral port.');
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
}

async function waitFor<T>(producer: () => Promise<T | null>, errorMessage: string): Promise<T> {
  const maxAttempts = 20;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const value = await producer();

    if (value !== null) {
      return value;
    }

    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  throw new Error(errorMessage);
}

test.before(async () => {
  await prisma.$connect();
  await startApplication();
});

test.after(async () => {
  await app.close();
  await prisma.$disconnect();
});

test.beforeEach(async () => {
  await resetDatabase();
});

test('BT-012: a started local agent is visible from the backend after it announces capabilities', async () => {
  const registry = app.get(ConnectedAgentsRegistry);
  const client = new AgentClient(
    {
      agentId: 'agent-local-1',
      authToken: 'secret-token',
      backendUrl: baseUrl,
      capabilities: ['session.prepare', 'agent.prompt'],
      models: [{ id: 'agent/gpt-5', label: 'GPT-5', provider: 'local-agent' }],
      projects: [
        {
          key: 'pairdock',
          name: 'PairDock',
          repoFullName: 'mathis-gala/PairDock',
          pathAlias: 'PairDock',
          defaultBranch: 'main',
          models: ['agent/gpt-5'],
        },
      ],
      projectPaths: {},
    },
    {
      error() {},
      info() {},
      warn() {},
    },
  );

  try {
    await client.start();

    const socketId = await waitFor(
      async () => registry.findSocketId('agent-local-1'),
      'Expected backend registry to contain the connected agent.',
    );

    assert.ok(socketId.length > 0);

    const persistedEvent = await waitFor(
      async () =>
        prisma.agentEvent.findFirst({
          where: {
            agentId: 'agent-local-1',
            type: 'agent.connected',
          },
          orderBy: { createdAt: 'desc' },
        }),
      'Expected backend persistence to record agent.connected.',
    );

    assert.equal(persistedEvent.type, 'agent.connected');
    assert.deepEqual(persistedEvent.payload, {
      agentId: 'agent-local-1',
      capabilities: ['session.prepare', 'agent.prompt'],
      models: [{ id: 'agent/gpt-5', label: 'GPT-5', provider: 'local-agent' }],
      projects: [
        {
          key: 'pairdock',
          name: 'PairDock',
          repoFullName: 'mathis-gala/PairDock',
          pathAlias: 'PairDock',
          defaultBranch: 'main',
          models: ['agent/gpt-5'],
        },
      ],
    });

    const registration = await waitFor(
      async () => prisma.agentRegistration.findUnique({ where: { agentId: 'agent-local-1' } }),
      'Expected backend persistence to upsert agent registration.',
    );

    assert.equal(registration.protocolVersion, AGENT_PROTOCOL_VERSION);
    assert.deepEqual(registration.capabilities, ['session.prepare', 'agent.prompt']);
    assert.deepEqual(registration.models, [{ id: 'agent/gpt-5', label: 'GPT-5', provider: 'local-agent' }]);
    assert.equal(registration.disconnectedAt, null);

    await client.stop();

    const disconnectedRegistration = await waitFor(async () => {
      const record = await prisma.agentRegistration.findUnique({ where: { agentId: 'agent-local-1' } });
      return record?.disconnectedAt ? record : null;
    }, 'Expected backend persistence to mark agent disconnected.');

    assert.ok(disconnectedRegistration.lastSeenAt >= registration.lastSeenAt);
  } finally {
    await client.stop();
  }
});
