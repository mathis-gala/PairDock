import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../../../apps/api/src/app.module.js';
import { AuthTokenService } from '../../../../../apps/api/src/auth/auth-token.service.js';
import { DatabaseClient } from '../../../../../apps/api/src/persistence/client.js';
import { authResponseSchema, parseJsonResponse, sharedSessionHistoryResponseSchema } from '../test-json.js';

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

async function authenticatePm() {
  const tokenSeed = randomUUID();
  const response = await fetch(`${baseUrl}/auth/pm/callback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      accessToken: `slack:${tokenSeed}:pairdock-testers:pm-${tokenSeed}@pairdock.test:PM ${tokenSeed}`,
    }),
  });

  return parseJsonResponse(response, authResponseSchema);
}

test.before(async () => {
  await prisma.$connect();
  app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0);
  const address = app.getHttpServer().address();

  if (!address || typeof address === 'string') {
    throw new Error('Expected HTTP server to bind to an ephemeral port.');
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  await app.close();
  await prisma.$disconnect();
});

test.beforeEach(resetDatabase);

test('PM browses sessions and draft review requests only for projects shared with them', async () => {
  const pm = await authenticatePm();
  const developer = await prisma.user.create({
    data: { email: `owner-${randomUUID()}@pairdock.test`, displayName: 'Owner', kind: 'developer' },
  });
  const connection = await prisma.sourceControlConnection.create({
    data: {
      ownerUserId: developer.id,
      providerConnectionId: `gh-install-${randomUUID()}`,
      accountLogin: 'pairdock-owner',
    },
  });
  const [sharedProject, privateProject] = await Promise.all([
    prisma.project.create({
      data: {
        ownerUserId: developer.id,
        sourceControlConnectionId: connection.id,
        name: 'Shared TCG',
        repoFullName: 'mathis/tcg-collection',
        defaultBranch: 'main',
        agentProjectKey: `tcg-${randomUUID()}`,
      },
    }),
    prisma.project.create({
      data: {
        ownerUserId: developer.id,
        sourceControlConnectionId: connection.id,
        name: 'Private project',
        repoFullName: 'mathis/private',
        defaultBranch: 'main',
        agentProjectKey: `private-${randomUUID()}`,
      },
    }),
  ]);
  await prisma.projectMember.create({
    data: { projectId: sharedProject.id, userId: pm.user.id, role: 'pm' },
  });
  const [sharedSession, privateSession] = await Promise.all([
    prisma.session.create({
      data: {
        projectId: sharedProject.id,
        createdByUserId: developer.id,
        status: 'REVIEW_REQUEST_CREATED',
        modelId: 'gpt-5.6-sol',
        reasoningEffort: 'high',
      },
    }),
    prisma.session.create({
      data: {
        projectId: privateProject.id,
        createdByUserId: developer.id,
        status: 'READY',
        modelId: 'gpt-5.6-terra',
        reasoningEffort: 'low',
      },
    }),
  ]);
  await prisma.pullRequest.create({
    data: {
      sessionId: sharedSession.id,
      githubPrNumber: 42,
      githubPrUrl: 'https://github.test/mathis/tcg-collection/pull/42',
      status: 'draft',
    },
  });

  const response = await fetch(`${baseUrl}/projects/shared/sessions`, {
    headers: { authorization: `Bearer ${pm.accessToken}` },
  });

  assert.equal(response.status, 200);
  const history = await parseJsonResponse(response, sharedSessionHistoryResponseSchema);
  assert.deepEqual(history, [
    {
      id: sharedSession.id,
      projectId: sharedProject.id,
      projectName: 'Shared TCG',
      repoFullName: 'mathis/tcg-collection',
      status: 'REVIEW_REQUEST_CREATED',
      reviewRequest: {
        url: 'https://github.test/mathis/tcg-collection/pull/42',
        number: 42,
        status: 'draft',
      },
      createdAt: sharedSession.createdAt.toISOString(),
      closedAt: null,
    },
  ]);
  assert.ok(!history.some((session) => session.id === privateSession.id));

  const authTokenService = app.get(AuthTokenService);
  const developerToken = authTokenService.issue({
    id: developer.id,
    email: developer.email,
    displayName: developer.displayName,
    kind: 'developer',
  });
  const forbiddenResponse = await fetch(`${baseUrl}/projects/shared/sessions`, {
    headers: { authorization: `Bearer ${developerToken}` },
  });
  assert.equal(forbiddenResponse.status, 403);
});
