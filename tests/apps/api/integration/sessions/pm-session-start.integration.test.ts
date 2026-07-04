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
import { authResponseSchema, parseJsonResponse, sessionCreateResponseSchema } from '../test-json.js';

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
    body: await parseJsonResponse(response, authResponseSchema),
  };
}

async function createProjectFixture(pmUserId?: string) {
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
      name: 'PM start project',
      description: 'Project shared to a PM',
      repoFullName: 'mathis/pairdock-pm-start',
      defaultBranch: 'main',
      defaultModelId: 'codex-cli/gpt-5.4',
      agentProjectKey: `project-${randomUUID()}`,
    },
  });

  if (pmUserId) {
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: pmUserId,
        role: 'pm',
      },
    });
  }

  return { developer, project };
}

function connectAgentSocket(): Socket {
  return io(`${baseUrl}/agent`, { transports: ['websocket'] });
}

function waitForConnect(socket: Socket): Promise<void> {
  if (socket.connected) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    socket.once('connect', () => resolve());
    socket.once('connect_error', reject);
  });
}

async function sendAgentEvent(socket: Socket, event: AgentEventEnvelope) {
  await waitForConnect(socket);
  socket.emit(agentProtocolMessageEventName, event);
}

async function announceAgent(socket: Socket, agentId: string) {
  await sendAgentEvent(socket, {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: randomUUID(),
    type: 'agent.connected',
    payload: {
      agentId,
      capabilities: ['session.prepare', 'agent.prompt', 'agent.cancel', 'preview', 'readiness.check'],
    },
    sentAt: new Date().toISOString(),
  });
}

async function publishReadiness(socket: Socket, projectKey: string) {
  await sendAgentEvent(socket, {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: randomUUID(),
    type: 'readiness.result',
    payload: {
      projectKey,
      ok: true,
      checks: [{ key: 'agent', status: 'passed', required: true, message: null, remediation: null }],
    },
    sentAt: new Date().toISOString(),
  });
}

async function waitForReadiness(projectId: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const snapshot = await prisma.projectReadinessSnapshot.findUnique({ where: { projectId } });
    if (snapshot?.ok) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  throw new Error('Expected readiness snapshot to be persisted.');
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

test('BT-046: PM can start a shared project only when the project is ready and the owner agent is online', async () => {
  const pmLogin = await authenticatePm();
  const fixture = await createProjectFixture(pmLogin.body.user.id);
  const agentSocket = connectAgentSocket();

  try {
    await announceAgent(agentSocket, fixture.project.agentProjectKey);
    await publishReadiness(agentSocket, fixture.project.agentProjectKey);
    await waitForReadiness(fixture.project.id);

    const response = await fetch(`${baseUrl}/sessions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${pmLogin.body.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        projectId: fixture.project.id,
        modelId: fixture.project.defaultModelId,
        startSource: 'pm',
      }),
    });

    assert.equal(response.status, 201);
    const sessionPayload = await parseJsonResponse(response, sessionCreateResponseSchema);
    assert.equal(sessionPayload.createdByUserId, pmLogin.body.user.id);
    assert.equal(sessionPayload.projectId, fixture.project.id);

    const sessionMembers = await prisma.sessionMember.findMany({
      where: { sessionId: sessionPayload.id },
      orderBy: { role: 'asc' },
    });

    assert.deepEqual(
      sessionMembers.map((member) => ({ role: member.role, userId: member.userId })),
      [
        { role: 'developer', userId: fixture.developer.id },
        { role: 'pm', userId: pmLogin.body.user.id },
      ],
    );
  } finally {
    agentSocket.close();
  }
});

test('BT-047: PM session start is rejected when the project is not shared with the PM', async () => {
  const pmLogin = await authenticatePm();
  const fixture = await createProjectFixture();

  const response = await fetch(`${baseUrl}/sessions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${pmLogin.body.accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      projectId: fixture.project.id,
      modelId: fixture.project.defaultModelId,
      startSource: 'pm',
    }),
  });

  assert.equal(response.status, 403);
});

test('BT-047: PM session start is rejected when the owning agent is offline', async () => {
  const pmLogin = await authenticatePm();
  const fixture = await createProjectFixture(pmLogin.body.user.id);

  await prisma.projectReadinessSnapshot.create({
    data: {
      projectId: fixture.project.id,
      ok: true,
      checks: [],
    },
  });

  const response = await fetch(`${baseUrl}/sessions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${pmLogin.body.accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      projectId: fixture.project.id,
      modelId: fixture.project.defaultModelId,
      startSource: 'pm',
    }),
  });

  assert.equal(response.status, 503);
});
