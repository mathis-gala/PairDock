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
      name: 'PairDock',
      repoFullName: 'mathis/pairdock',
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

test('Task 10: session details include the latest persisted git diff snapshot', async () => {
  const pmLogin = await authenticatePm();
  const fixture = await createSessionFixture(pmLogin.body.user.id);

  await prisma.agentEvent.createMany({
    data: [
      {
        sessionId: fixture.session.id,
        agentId: 'agent-local-1',
        type: 'git.diff',
        payload: {
          sessionId: fixture.session.id,
          diff: 'old diff',
          changedFiles: ['old.txt'],
        },
      },
      {
        sessionId: fixture.session.id,
        agentId: 'agent-local-1',
        type: 'git.diff',
        payload: {
          sessionId: fixture.session.id,
          diff: 'diff --git a/README.md b/README.md\n+Updated README',
          changedFiles: ['README.md'],
        },
      },
    ],
  });

  const sessionResponse = await fetch(`${baseUrl}/sessions/${fixture.session.id}`, {
    headers: { authorization: `Bearer ${pmLogin.body.accessToken}` },
  });

  assert.equal(sessionResponse.status, 200);

  const sessionPayload = (await sessionResponse.json()) as {
    latestDiff: { diff: string; changedFiles: string[] } | null;
  };

  assert.deepEqual(sessionPayload.latestDiff, {
    diff: 'diff --git a/README.md b/README.md\n+Updated README',
    changedFiles: ['README.md'],
  });
});
