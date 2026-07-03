import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../../../apps/api/src/app.module.js';
import { DatabaseClient } from '../../../../../apps/api/src/persistence/client.js';

interface AuthResponseBody {
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

async function authenticatePm(tokenSeed = randomUUID(), teamId = 'pairdock-testers') {
  const response = await fetch(`${baseUrl}/auth/pm/callback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ accessToken: `slack:${tokenSeed}:${teamId}:pm-${tokenSeed}@pairdock.test:PM ${tokenSeed}` }),
  });

  return {
    status: response.status,
    body: (await response.json()) as AuthResponseBody,
  };
}

async function createSessionFixture(pmUserId: string) {
  const developer = await prisma.user.create({
    data: {
      email: `owner-${randomUUID()}@pairdock.test`,
      displayName: 'Owner',
      kind: 'developer',
    },
  });
  const connection = await prisma.sourceControlConnection.create({
    data: {
      ownerUserId: developer.id,
      providerConnectionId: `gh-install-${randomUUID()}`,
      accountLogin: 'pairdock-owner',
    },
  });
  const project = await prisma.project.create({
    data: {
      ownerUserId: developer.id,
      sourceControlConnectionId: connection.id,
      name: 'History project',
      repoFullName: 'mathis/pairdock-history',
      defaultBranch: 'main',
      agentProjectKey: `project-${randomUUID()}`,
    },
  });
  const session = await prisma.session.create({
    data: {
      projectId: project.id,
      createdByUserId: developer.id,
      status: 'READY',
      modelId: 'codex-cli/gpt-5.4',
    },
  });

  await prisma.sessionMember.createMany({
    data: [
      { sessionId: session.id, userId: developer.id, role: 'developer' },
      { sessionId: session.id, userId: pmUserId, role: 'pm' },
    ],
  });

  return { session };
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

test('Task 12: PM session route can reload persisted prompt history and event history', async () => {
  const pmLogin = await authenticatePm();
  const fixture = await createSessionFixture(pmLogin.body.user.id);

  await prisma.message.createMany({
    data: [
      {
        sessionId: fixture.session.id,
        userId: pmLogin.body.user.id,
        role: 'pm',
        content: 'Please tighten the onboarding copy.',
      },
      {
        sessionId: fixture.session.id,
        userId: null,
        role: 'developer',
        content: 'Acknowledged. Applying a copy pass now.',
      },
    ],
  });
  await prisma.agentEvent.createMany({
    data: [
      {
        sessionId: fixture.session.id,
        agentId: 'agent-local-1',
        type: 'session.progress',
        payload: {
          sessionId: fixture.session.id,
          progress: 'Applying PM feedback',
        },
      },
      {
        sessionId: fixture.session.id,
        agentId: 'agent-local-1',
        type: 'git.diff',
        payload: {
          sessionId: fixture.session.id,
          diff: 'diff --git a/src/app.tsx b/src/app.tsx',
          changedFiles: ['src/app.tsx'],
        },
      },
    ],
  });

  const messagesResponse = await fetch(`${baseUrl}/sessions/${fixture.session.id}/messages`, {
    headers: { authorization: `Bearer ${pmLogin.body.accessToken}` },
  });
  const eventsResponse = await fetch(`${baseUrl}/sessions/${fixture.session.id}/events`, {
    headers: { authorization: `Bearer ${pmLogin.body.accessToken}` },
  });

  assert.equal(messagesResponse.status, 200);
  assert.equal(eventsResponse.status, 200);

  const messages = (await messagesResponse.json()) as Array<{ role: string; content: string }>;
  const events = (await eventsResponse.json()) as Array<{ type: string }>;

  assert.deepEqual(
    messages.map((message) => message.role),
    ['pm', 'developer'],
  );
  assert.deepEqual(
    messages.map((message) => message.content),
    ['Please tighten the onboarding copy.', 'Acknowledged. Applying a copy pass now.'],
  );
  assert.deepEqual(
    events.map((eventRecord) => eventRecord.type),
    ['session.progress', 'git.diff'],
  );
});
