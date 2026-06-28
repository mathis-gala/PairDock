import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../../../apps/api/src/app.module.js';
import { DatabaseClient } from '../../../../../apps/api/src/persistence/client.js';

interface AuthResponseBody {
  created: boolean;
  accessToken: string;
  user: { id: string; email: string; displayName: string | null; kind: string };
}

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

async function authenticateDeveloper(tokenSeed = randomUUID()) {
  const response = await fetch(`${baseUrl}/auth/developer/callback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ accessToken: `github:${tokenSeed}:dev-${tokenSeed}@pairdock.test:Dev ${tokenSeed}` }),
  });

  return {
    status: response.status,
    body: (await response.json()) as AuthResponseBody,
  };
}

async function createOwnedProject(ownerUserId: string) {
  const connection = await prisma.sourceControlConnection.create({
    data: {
      ownerUserId,
      providerConnectionId: `gh-install-${randomUUID()}`,
      accountLogin: 'pairdock-owner',
    },
  });

  return prisma.project.create({
    data: {
      ownerUserId,
      sourceControlConnectionId: connection.id,
      name: 'PairDock',
      repoFullName: 'mathis/pairdock',
      defaultBranch: 'main',
      agentProjectKey: `project-${randomUUID()}`,
    },
  });
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

test('Task 4: developer owner can create a session and the backend persists it as CREATED', async () => {
  const developerLogin = await authenticateDeveloper();
  const project = await createOwnedProject(developerLogin.body.user.id);

  const response = await fetch(`${baseUrl}/sessions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${developerLogin.body.accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ projectId: project.id, modelId: 'codex-cli/gpt-5.4' }),
  });

  assert.equal(response.status, 201);

  const body = (await response.json()) as {
    id: string;
    status: string;
    projectId: string;
    createdByUserId: string;
    modelId: string;
  };

  assert.equal(body.status, 'CREATED');
  assert.equal(body.projectId, project.id);
  assert.equal(body.createdByUserId, developerLogin.body.user.id);
  assert.equal(body.modelId, 'codex-cli/gpt-5.4');

  const persistedSession = await prisma.session.findUnique({ where: { id: body.id } });
  const sessionMembers = await prisma.sessionMember.findMany({ where: { sessionId: body.id } });

  assert.equal(persistedSession?.status, 'CREATED');
  assert.equal(sessionMembers.length, 1);
  assert.equal(sessionMembers[0]?.userId, developerLogin.body.user.id);
  assert.equal(sessionMembers[0]?.role, 'developer');
});

test('Task 4: backend applies valid agent prepare events in order and reaches READY', async () => {
  const developerLogin = await authenticateDeveloper();
  const project = await createOwnedProject(developerLogin.body.user.id);

  const createResponse = await fetch(`${baseUrl}/sessions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${developerLogin.body.accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ projectId: project.id, modelId: 'codex-cli/gpt-5.4' }),
  });
  const createdSession = (await createResponse.json()) as { id: string };

  const events = [
    { type: 'session.progress', payload: { status: 'AGENT_CONNECTING' } },
    { type: 'session.progress', payload: { status: 'WORKTREE_CREATING' } },
    { type: 'session.progress', payload: { status: 'DOCKER_STARTING' } },
    { type: 'session.progress', payload: { status: 'PREVIEW_STARTING' } },
    { type: 'session.ready', payload: { previewUrl: 'https://preview.pairdock.test' } },
  ];

  let finalBody: { status: string; previewUrl: string | null } | undefined;

  for (const event of events) {
    const eventResponse = await fetch(`${baseUrl}/sessions/${createdSession.id}/events`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${developerLogin.body.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    assert.equal(eventResponse.status, 201);
    finalBody = (await eventResponse.json()) as { status: string; previewUrl: string | null };
  }

  assert.equal(finalBody?.status, 'READY');
  assert.equal(finalBody?.previewUrl, 'https://preview.pairdock.test');

  const storedEvents = await prisma.agentEvent.findMany({ where: { sessionId: createdSession.id } });
  const persistedSession = await prisma.session.findUnique({ where: { id: createdSession.id } });

  assert.equal(storedEvents.length, 5);
  assert.equal(persistedSession?.status, 'READY');
  assert.equal(persistedSession?.previewUrl, 'https://preview.pairdock.test');
});

test('Task 4: backend rejects invalid transitions and close is idempotent', async () => {
  const developerLogin = await authenticateDeveloper();
  const project = await createOwnedProject(developerLogin.body.user.id);

  const createResponse = await fetch(`${baseUrl}/sessions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${developerLogin.body.accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ projectId: project.id, modelId: 'codex-cli/gpt-5.4' }),
  });
  const createdSession = (await createResponse.json()) as { id: string };

  const invalidTransitionResponse = await fetch(`${baseUrl}/sessions/${createdSession.id}/events`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${developerLogin.body.accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ type: 'agent.done', payload: { exitCode: 0 } }),
  });

  assert.equal(invalidTransitionResponse.status, 409);
  assert.equal(await prisma.agentEvent.count({ where: { sessionId: createdSession.id } }), 0);
  assert.equal((await prisma.session.findUnique({ where: { id: createdSession.id } }))?.status, 'CREATED');

  const firstCloseResponse = await fetch(`${baseUrl}/sessions/${createdSession.id}/close`, {
    method: 'POST',
    headers: { authorization: `Bearer ${developerLogin.body.accessToken}` },
  });
  const secondCloseResponse = await fetch(`${baseUrl}/sessions/${createdSession.id}/close`, {
    method: 'POST',
    headers: { authorization: `Bearer ${developerLogin.body.accessToken}` },
  });

  assert.equal(firstCloseResponse.status, 201);
  assert.equal(secondCloseResponse.status, 201);

  const firstCloseBody = (await firstCloseResponse.json()) as { status: string; closedAt: string | null };
  const secondCloseBody = (await secondCloseResponse.json()) as { status: string; closedAt: string | null };

  assert.equal(firstCloseBody.status, 'CLOSED');
  assert.ok(firstCloseBody.closedAt);
  assert.equal(secondCloseBody.status, 'CLOSED');
  assert.equal(secondCloseBody.closedAt, firstCloseBody.closedAt);
});
