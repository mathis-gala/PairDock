import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  AGENT_PROTOCOL_VERSION,
  type AgentEventEnvelope,
  agentEventEnvelopeSchema,
  agentProtocolMessageEventName,
} from '@pairdock/shared-contracts';
import { io, type Socket } from 'socket.io-client';
import { AppModule } from '../../../../../apps/api/src/app.module.js';
import { DatabaseClient } from '../../../../../apps/api/src/persistence/client.js';
import { authResponseSchema, idResponseSchema, parseJsonResponse, sessionStateResponseSchema } from '../test-json.js';

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

async function authenticateDeveloper(tokenSeed = randomUUID()) {
  const response = await fetch(`${baseUrl}/auth/developer/callback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ accessToken: `github:${tokenSeed}:dev-${tokenSeed}@pairdock.test:Dev ${tokenSeed}` }),
  });

  return {
    status: response.status,
    body: await parseJsonResponse(response, authResponseSchema),
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
      agentProjectKey: 'agent-local-1',
    },
  });
}

async function createSession(projectId: string, accessToken: string) {
  const response = await fetch(`${baseUrl}/sessions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ projectId, modelId: 'codex-cli/gpt-5.4' }),
  });

  assert.equal(response.status, 201);
  return parseJsonResponse(response, idResponseSchema);
}

function connectAgentSocket(): Socket {
  return io(`${baseUrl}/agent`, {
    transports: ['websocket'],
  });
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

async function emitAgentEvent(socket: Socket, event: AgentEventEnvelope) {
  await socket.emitWithAck(agentProtocolMessageEventName, event);
}

function buildAgentConnectedEvent(): AgentEventEnvelope {
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: randomUUID(),
    type: 'agent.connected',
    payload: {
      agentId: 'agent-local-1',
      capabilities: ['session.prepare', 'agent.prompt', 'preview'],
      models: [],
      projects: [],
    },
    sentAt: new Date().toISOString(),
  };
}

function buildSessionEvent(sessionId: string, event: AgentEventEnvelope['type'], payload: Record<string, unknown>) {
  return agentEventEnvelopeSchema.parse({
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: randomUUID(),
    sessionId,
    type: event,
    payload: {
      sessionId,
      ...payload,
    },
    sentAt: new Date().toISOString(),
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

test('BT-025: ValidationModule persists checks.result and exposes the latest failed validation in the session API', async () => {
  const developerLogin = await authenticateDeveloper();
  const project = await createOwnedProject(developerLogin.body.user.id);
  const session = await createSession(project.id, developerLogin.body.accessToken);
  const agentSocket = connectAgentSocket();

  try {
    await waitForConnect(agentSocket);
    await emitAgentEvent(agentSocket, buildAgentConnectedEvent());

    for (const event of [
      buildSessionEvent(session.id, 'session.progress', { status: 'AGENT_CONNECTING' }),
      buildSessionEvent(session.id, 'session.progress', { status: 'WORKTREE_CREATING' }),
      buildSessionEvent(session.id, 'session.progress', { status: 'DOCKER_STARTING' }),
      buildSessionEvent(session.id, 'session.progress', { status: 'PREVIEW_STARTING' }),
      buildSessionEvent(session.id, 'session.ready', { previewUrl: 'https://preview.pairdock.test' }),
      buildSessionEvent(session.id, 'session.progress', { status: 'AGENT_RUNNING' }),
      buildSessionEvent(session.id, 'agent.done', { exitCode: 0 }),
      buildSessionEvent(session.id, 'checks.result', {
        ok: false,
        build: { status: 'passed', command: 'bun run build' },
        tests: { status: 'passed', command: 'bun test' },
        lint: { status: 'failed', command: 'bun run lint', logs: 'Lint failed on src/app.ts' },
        preview: { status: 'passed' },
      }),
    ]) {
      await emitAgentEvent(agentSocket, event);
    }

    const persistedValidationRun = await prisma.validationRun.findFirst({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
    });
    const persistedSession = await prisma.session.findUnique({ where: { id: session.id } });
    const sessionResponse = await fetch(`${baseUrl}/sessions/${session.id}`, {
      headers: { authorization: `Bearer ${developerLogin.body.accessToken}` },
    });

    assert.equal(sessionResponse.status, 200);
    assert.equal(persistedValidationRun?.status, 'failed');
    assert.equal(persistedValidationRun?.lintStatus, 'failed');
    assert.equal(persistedSession?.status, 'FAILED');

    const sessionPayload = await parseJsonResponse(sessionResponse, sessionStateResponseSchema);

    assert.equal(sessionPayload.status, 'FAILED');
    assert.deepEqual(sessionPayload.latestValidation, {
      status: 'failed',
      buildStatus: 'passed',
      testStatus: 'passed',
      lintStatus: 'failed',
      previewStatus: 'passed',
    });
    assert.match(sessionPayload.lastError ?? '', /lint/i);
    assert.match(sessionPayload.lastError ?? '', /Lint failed on src\/app\.ts/i);

    await emitAgentEvent(agentSocket, buildSessionEvent(session.id, 'session.progress', { status: 'AGENT_RUNNING' }));
    await emitAgentEvent(
      agentSocket,
      buildSessionEvent(session.id, 'agent.done', { exitCode: 0, changesDetected: false }),
    );

    const resumedSession = await prisma.session.findUnique({ where: { id: session.id } });
    const validationCount = await prisma.validationRun.count({ where: { sessionId: session.id } });
    assert.equal(resumedSession?.status, 'FAILED');
    assert.equal(validationCount, 1);
  } finally {
    agentSocket.close();
  }
});

test('Task 11: successful checks move the session into AWAITING_PM_VALIDATION', async () => {
  const developerLogin = await authenticateDeveloper();
  const project = await createOwnedProject(developerLogin.body.user.id);
  const session = await createSession(project.id, developerLogin.body.accessToken);
  const agentSocket = connectAgentSocket();

  try {
    await waitForConnect(agentSocket);
    await emitAgentEvent(agentSocket, buildAgentConnectedEvent());

    for (const event of [
      buildSessionEvent(session.id, 'session.progress', { status: 'AGENT_CONNECTING' }),
      buildSessionEvent(session.id, 'session.progress', { status: 'WORKTREE_CREATING' }),
      buildSessionEvent(session.id, 'session.progress', { status: 'DOCKER_STARTING' }),
      buildSessionEvent(session.id, 'session.progress', { status: 'PREVIEW_STARTING' }),
      buildSessionEvent(session.id, 'session.ready', { previewUrl: 'https://preview.pairdock.test' }),
      buildSessionEvent(session.id, 'session.progress', { status: 'AGENT_RUNNING' }),
      buildSessionEvent(session.id, 'agent.done', { exitCode: 0 }),
      buildSessionEvent(session.id, 'checks.result', {
        ok: true,
        build: { status: 'passed', command: 'bun run build' },
        tests: { status: 'passed', command: 'bun test' },
        lint: { status: 'passed', command: 'bun run lint' },
        preview: { status: 'passed' },
      }),
    ]) {
      await emitAgentEvent(agentSocket, event);
    }

    const persistedSession = await prisma.session.findUnique({ where: { id: session.id } });
    const sessionResponse = await fetch(`${baseUrl}/sessions/${session.id}`, {
      headers: { authorization: `Bearer ${developerLogin.body.accessToken}` },
    });

    assert.equal(sessionResponse.status, 200);
    assert.equal(persistedSession?.status, 'AWAITING_PM_VALIDATION');

    const sessionPayload = await parseJsonResponse(sessionResponse, sessionStateResponseSchema);

    assert.equal(sessionPayload.status, 'AWAITING_PM_VALIDATION');
    assert.deepEqual(sessionPayload.latestValidation, {
      status: 'passed',
      buildStatus: 'passed',
      testStatus: 'passed',
      lintStatus: 'passed',
      previewStatus: 'passed',
    });

    await emitAgentEvent(agentSocket, buildSessionEvent(session.id, 'session.progress', { status: 'AGENT_RUNNING' }));
    await emitAgentEvent(
      agentSocket,
      buildSessionEvent(session.id, 'agent.done', { exitCode: 0, changesDetected: false }),
    );

    const resumedSession = await prisma.session.findUnique({ where: { id: session.id } });
    const validationCount = await prisma.validationRun.count({ where: { sessionId: session.id } });
    assert.equal(resumedSession?.status, 'AWAITING_PM_VALIDATION');
    assert.equal(validationCount, 1);
  } finally {
    agentSocket.close();
  }
});
