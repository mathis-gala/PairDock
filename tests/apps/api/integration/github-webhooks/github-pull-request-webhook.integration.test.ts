import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import test from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../../../apps/api/src/app.module.js';
import { DatabaseClient } from '../../../../../apps/api/src/persistence/client.js';

const WEBHOOK_SECRET = 'pairdock-github-webhook-test-secret';
const prisma = new DatabaseClient();

let app: INestApplication;
let baseUrl: string;

async function resetDatabase() {
  await prisma.pullRequest.deleteMany();
  await prisma.validationRun.deleteMany();
  await prisma.agentEvent.deleteMany();
  await prisma.attachment.deleteMany();
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

async function createDraftReviewRequest({
  providerConnectionId = '123456',
  repoFullName = 'mathis-gala/PairDock',
}: {
  providerConnectionId?: string;
  repoFullName?: string;
} = {}) {
  const developer = await prisma.user.create({
    data: {
      email: `developer-${randomUUID()}@pairdock.test`,
      displayName: 'PairDock developer',
      kind: 'developer',
    },
  });
  const connection = await prisma.sourceControlConnection.create({
    data: {
      ownerUserId: developer.id,
      providerConnectionId,
      accountLogin: 'mathis-gala',
    },
  });
  const project = await prisma.project.create({
    data: {
      ownerUserId: developer.id,
      sourceControlConnectionId: connection.id,
      name: 'PairDock',
      repoFullName,
      defaultBranch: 'main',
      agentProjectKey: `pairdock-${randomUUID()}`,
    },
  });
  const session = await prisma.session.create({
    data: {
      projectId: project.id,
      createdByUserId: developer.id,
      status: 'REVIEW_REQUEST_CREATED',
      modelId: 'gpt-5.6-terra',
    },
  });

  return prisma.pullRequest.create({
    data: {
      sessionId: session.id,
      githubPrNumber: 57,
      githubPrUrl: 'https://github.com/mathis-gala/PairDock/pull/57',
      status: 'draft',
    },
  });
}

function sign(payload: string) {
  return `sha256=${createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex')}`;
}

test.before(async () => {
  process.env.GITHUB_WEBHOOK_SECRET = WEBHOOK_SECRET;
  await prisma.$connect();
  app = await NestFactory.create(AppModule, { logger: false, rawBody: true });
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
  delete process.env.GITHUB_WEBHOOK_SECRET;
});

test.beforeEach(resetDatabase);

test('a signed pull_request webhook updates the matching draft review request to merged', async () => {
  const reviewRequest = await createDraftReviewRequest();
  const unrelatedReviewRequest = await createDraftReviewRequest({
    providerConnectionId: '654321',
    repoFullName: 'another-owner/another-repository',
  });
  const payload = JSON.stringify({
    action: 'closed',
    installation: { id: 123456 },
    number: 57,
    repository: { full_name: 'mathis-gala/PairDock' },
    pull_request: {
      number: 57,
      html_url: 'https://github.com/mathis-gala/PairDock/pull/57',
      state: 'closed',
      draft: false,
      merged: true,
      merged_at: '2026-07-26T19:05:00.000Z',
      updated_at: '2026-07-26T19:05:00.000Z',
    },
  });

  const response = await fetch(`${baseUrl}/webhooks/github`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-github-delivery': randomUUID(),
      'x-github-event': 'pull_request',
      'x-hub-signature-256': sign(payload),
    },
    body: payload,
  });

  assert.equal(response.status, 202, await response.text());
  const persisted = await prisma.pullRequest.findUniqueOrThrow({ where: { id: reviewRequest.id } });
  const unrelatedPersisted = await prisma.pullRequest.findUniqueOrThrow({
    where: { id: unrelatedReviewRequest.id },
  });
  assert.equal(persisted.status, 'merged');
  assert.equal(unrelatedPersisted.status, 'draft');
});

test('an invalid signature is rejected without changing the review request', async () => {
  const reviewRequest = await createDraftReviewRequest();
  const payload = JSON.stringify({
    action: 'closed',
    installation: { id: 123456 },
    number: 57,
    repository: { full_name: 'mathis-gala/PairDock' },
    pull_request: {
      number: 57,
      html_url: 'https://github.com/mathis-gala/PairDock/pull/57',
      state: 'closed',
      draft: false,
      merged: false,
      merged_at: null,
      updated_at: '2026-07-26T19:05:00.000Z',
    },
  });

  const response = await fetch(`${baseUrl}/webhooks/github`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-github-delivery': randomUUID(),
      'x-github-event': 'pull_request',
      'x-hub-signature-256': `sha256=${'0'.repeat(64)}`,
    },
    body: payload,
  });

  assert.equal(response.status, 401);
  const persisted = await prisma.pullRequest.findUniqueOrThrow({ where: { id: reviewRequest.id } });
  assert.equal(persisted.status, 'draft');
});

test('an older delivery cannot revert a newer review request status', async () => {
  const reviewRequest = await createDraftReviewRequest();
  const latestUpdate = new Date('2026-07-26T20:00:00.000Z');
  await prisma.pullRequest.update({
    where: { id: reviewRequest.id },
    data: {
      status: 'merged',
      statusUpdatedAt: latestUpdate,
    },
  });
  const payload = JSON.stringify({
    action: 'reopened',
    installation: { id: 123456 },
    number: 57,
    repository: { full_name: 'mathis-gala/PairDock' },
    pull_request: {
      number: 57,
      html_url: 'https://github.com/mathis-gala/PairDock/pull/57',
      state: 'open',
      draft: false,
      merged: false,
      merged_at: null,
      updated_at: '2026-07-26T19:00:00.000Z',
    },
  });

  const response = await fetch(`${baseUrl}/webhooks/github`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-github-delivery': randomUUID(),
      'x-github-event': 'pull_request',
      'x-hub-signature-256': sign(payload),
    },
    body: payload,
  });

  assert.equal(response.status, 202);
  const persisted = await prisma.pullRequest.findUniqueOrThrow({ where: { id: reviewRequest.id } });
  assert.equal(persisted.status, 'merged');
  assert.deepEqual(persisted.statusUpdatedAt, latestUpdate);
});
