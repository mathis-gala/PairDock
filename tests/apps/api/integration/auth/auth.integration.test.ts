import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  AGENT_PROTOCOL_VERSION,
  type AgentEventEnvelope,
  agentProtocolMessageEventName,
} from '@pairdock/shared-contracts';
import { io, type Socket } from 'socket.io-client';
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

  return {
    session,
    agentProjectKey: project.agentProjectKey,
  };
}

function connectAgentSocket(): Socket {
  return io(`${baseUrl}/agent`, { transports: ['websocket'] });
}

function waitForConnect(socket: Socket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.once('connect', () => resolve());
    socket.once('connect_error', reject);
  });
}

async function announceAgent(socket: Socket, agentId: string) {
  await waitForConnect(socket);
  socket.emit(agentProtocolMessageEventName, {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: randomUUID(),
    type: 'agent.connected',
    payload: {
      agentId,
      capabilities: ['session.prepare', 'agent.prompt', 'agent.cancel', 'preview'],
    },
    sentAt: new Date().toISOString(),
  } satisfies AgentEventEnvelope);
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

test('BT-035: AuthModule normalizes GitHub and Slack callbacks into PairDock users and external identities', async () => {
  const developerSeed = randomUUID();
  const pmSeed = randomUUID();

  const developerFirstLogin = await authenticateDeveloper(developerSeed);
  const developerSecondLogin = await authenticateDeveloper(developerSeed);
  const pmFirstLogin = await authenticatePm(pmSeed, 'pairdock-pm-team');
  const pmSecondLogin = await authenticatePm(pmSeed, 'pairdock-pm-team');

  assert.equal(developerFirstLogin.status, 200);
  assert.equal(developerSecondLogin.status, 200);
  assert.equal(pmFirstLogin.status, 200);
  assert.equal(pmSecondLogin.status, 200);

  assert.equal(developerFirstLogin.body.user.kind, 'developer');
  assert.equal(pmFirstLogin.body.user.kind, 'pm');
  assert.equal(developerFirstLogin.body.created, true);
  assert.equal(developerSecondLogin.body.created, false);
  assert.equal(pmFirstLogin.body.created, true);
  assert.equal(pmSecondLogin.body.created, false);
  assert.deepEqual(Object.keys(developerFirstLogin.body.user).sort(), ['displayName', 'email', 'id', 'kind']);
  assert.deepEqual(Object.keys(pmFirstLogin.body.user).sort(), ['displayName', 'email', 'id', 'kind']);
  assert.equal(developerFirstLogin.body.user.id, developerSecondLogin.body.user.id);
  assert.equal(pmFirstLogin.body.user.id, pmSecondLogin.body.user.id);

  const users = await prisma.user.findMany({ orderBy: { email: 'asc' } });
  const externalIdentities = await prisma.externalIdentity.findMany({
    orderBy: [{ provider: 'asc' }, { providerUserId: 'asc' }],
  });

  assert.equal(users.length, 2);
  assert.equal(externalIdentities.length, 2);
  assert.equal(externalIdentities[0]?.provider, 'github');
  assert.equal(externalIdentities[1]?.provider, 'slack');
});

test('BT-004: SessionAccessGuard allows an invited PM to read a session and send a prompt', async () => {
  const pmLogin = await authenticatePm();
  const fixture = await createSessionFixture(pmLogin.body.user.id);
  const agentSocket = connectAgentSocket();

  try {
    await announceAgent(agentSocket, fixture.agentProjectKey);

    const sessionResponse = await fetch(`${baseUrl}/sessions/${fixture.session.id}`, {
      headers: { authorization: `Bearer ${pmLogin.body.accessToken}` },
    });
    const promptResponse = await fetch(`${baseUrl}/sessions/${fixture.session.id}/prompts`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${pmLogin.body.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ content: 'Please tighten the empty-state copy.' }),
    });

    assert.equal(sessionResponse.status, 200);
    assert.equal(promptResponse.status, 201);
    assert.deepEqual(await sessionResponse.json(), {
      id: fixture.session.id,
      status: 'READY',
      projectId: fixture.session.projectId,
      createdByUserId: fixture.session.createdByUserId,
      modelId: 'codex-cli/gpt-5.4',
      branchName: null,
      worktreeRef: null,
      previewUrl: null,
      lastError: null,
      latestDiff: null,
      createdAt: fixture.session.createdAt.toISOString(),
      closedAt: null,
    });

    const storedMessages = await prisma.message.findMany({ where: { sessionId: fixture.session.id } });
    assert.equal(storedMessages.length, 1);
    assert.equal(storedMessages[0]?.userId, pmLogin.body.user.id);
    assert.equal(storedMessages[0]?.role, 'pm');
    assert.equal(storedMessages[0]?.content, 'Please tighten the empty-state copy.');
  } finally {
    agentSocket.close();
  }
});

test('BT-005: SessionAccessGuard denies non-members for session reads and prompts', async () => {
  const invitedPmLogin = await authenticatePm();
  const outsiderPmLogin = await authenticatePm();
  const fixture = await createSessionFixture(invitedPmLogin.body.user.id);

  const sessionResponse = await fetch(`${baseUrl}/sessions/${fixture.session.id}`, {
    headers: { authorization: `Bearer ${outsiderPmLogin.body.accessToken}` },
  });
  const promptResponse = await fetch(`${baseUrl}/sessions/${fixture.session.id}/prompts`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${outsiderPmLogin.body.accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ content: 'Open the session for me.' }),
  });

  assert.equal(sessionResponse.status, 403);
  assert.equal(promptResponse.status, 403);
  assert.equal(await prisma.message.count({ where: { sessionId: fixture.session.id } }), 0);
});

test('BT-034: authenticated session routes reject requests without a bearer token', async () => {
  const pmLogin = await authenticatePm();
  const fixture = await createSessionFixture(pmLogin.body.user.id);

  const sessionResponse = await fetch(`${baseUrl}/sessions/${fixture.session.id}`);
  const promptResponse = await fetch(`${baseUrl}/sessions/${fixture.session.id}/prompts`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ content: 'Please allow me in.' }),
  });

  assert.equal(sessionResponse.status, 401);
  assert.equal(promptResponse.status, 401);
  assert.equal(await prisma.message.count({ where: { sessionId: fixture.session.id } }), 0);
});
