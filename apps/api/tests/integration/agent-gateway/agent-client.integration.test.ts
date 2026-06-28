import assert from 'node:assert/strict';
import test from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AgentClient } from '../../../../../packages/local-agent/src/websocket/agent-client.js';
import { ConnectedAgentsRegistry } from '../../../src/agent-gateway/connected-agents.registry.js';
import { AppModule } from '../../../src/app.module.js';
import { DatabaseClient } from '../../../src/persistence/client.js';

const prisma = new DatabaseClient();

let app: INestApplication;
let baseUrl: string;

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
    });
  } finally {
    await client.stop();
  }
});
