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
import { authResponseSchema, parseJsonResponse, sharedProjectListResponseSchema } from '../test-json.js';

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

async function createSharedProjectsFixture(pmUserId: string) {
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
  const onlineProject = await prisma.project.create({
    data: {
      ownerUserId: developer.id,
      sourceControlConnectionId: connection.id,
      name: 'Online ready project',
      description: 'Ready for PM start',
      repoFullName: 'mathis/pairdock-online',
      defaultBranch: 'main',
      defaultModelId: 'codex-cli/gpt-5.4',
      agentProjectKey: `project-${randomUUID()}`,
    },
  });
  const offlineProject = await prisma.project.create({
    data: {
      ownerUserId: developer.id,
      sourceControlConnectionId: connection.id,
      name: 'Offline project',
      description: 'Shared but offline',
      repoFullName: 'mathis/pairdock-offline',
      defaultBranch: 'main',
      defaultModelId: 'codex-cli/gpt-5.4',
      agentProjectKey: `project-${randomUUID()}`,
    },
  });

  await prisma.projectMember.createMany({
    data: [
      { projectId: onlineProject.id, userId: pmUserId, role: 'pm' },
      { projectId: offlineProject.id, userId: pmUserId, role: 'pm' },
    ],
  });
  await prisma.projectReadinessSnapshot.create({
    data: {
      projectId: offlineProject.id,
      ok: true,
      checks: [],
    },
  });

  return { offlineProject, onlineProject };
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
      models: [
        {
          id: 'gpt-5.6-sol',
          label: 'GPT-5.6 Sol',
          provider: 'codex',
          reasoningEfforts: [
            { id: 'low', label: 'Low' },
            { id: 'high', label: 'High' },
          ],
          defaultReasoningEffort: 'low',
        },
      ],
      projects: [],
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

test('BT-048: PM shared-project dashboard lists only shared projects and exposes start availability', async () => {
  const pmLogin = await authenticatePm();
  const fixture = await createSharedProjectsFixture(pmLogin.body.user.id);
  const agentSocket = connectAgentSocket();

  try {
    await announceAgent(agentSocket, fixture.onlineProject.agentProjectKey);
    await publishReadiness(agentSocket, fixture.onlineProject.agentProjectKey);
    await waitForReadiness(fixture.onlineProject.id);

    const response = await fetch(`${baseUrl}/projects/shared`, {
      headers: { authorization: `Bearer ${pmLogin.body.accessToken}` },
    });

    assert.equal(response.status, 200);
    const payload = await parseJsonResponse(response, sharedProjectListResponseSchema);

    assert.equal(payload.length, 2);
    assert.deepEqual(
      payload.map((project) => project.name),
      ['Online ready project', 'Offline project'],
    );
    assert.equal(payload[0]?.id, fixture.onlineProject.id);
    assert.equal(payload[0]?.repoFullName, 'mathis/pairdock-online');
    assert.equal(payload[0]?.defaultBranch, 'main');
    assert.equal(payload[0]?.agentAvailability, 'online');
    assert.equal(payload[0]?.canStartSession, true);
    assert.equal(payload[1]?.id, fixture.offlineProject.id);
    assert.equal(payload[1]?.agentAvailability, 'offline');
    assert.equal(payload[1]?.canStartSession, false);
    assert.equal(payload[1]?.unavailableReason, 'Owning agent is offline.');
  } finally {
    agentSocket.close();
  }
});
