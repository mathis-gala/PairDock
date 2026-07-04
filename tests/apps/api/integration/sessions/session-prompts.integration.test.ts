import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  AGENT_PROTOCOL_VERSION,
  type AgentCommandEnvelope,
  type AgentEventEnvelope,
  agentCommandEnvelopeSchema,
  agentProtocolMessageEventName,
} from '@pairdock/shared-contracts';
import { io, type Socket } from 'socket.io-client';
import { AppModule } from '../../../../../apps/api/src/app.module.js';
import { DatabaseClient } from '../../../../../apps/api/src/persistence/client.js';
import { authResponseSchema, idResponseSchema, parseJsonResponse, sessionPromptResponseSchema } from '../test-json.js';

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

async function authenticatePm(tokenSeed = randomUUID()) {
  const response = await fetch(`${baseUrl}/auth/pm/callback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      accessToken: `slack:${tokenSeed}:pm-${tokenSeed}@pairdock.test:PM ${tokenSeed}:team-${tokenSeed}`,
    }),
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

function waitForCommand(
  socket: Socket,
  expectedType: 'agent.prompt',
): Promise<Extract<AgentCommandEnvelope, { type: 'agent.prompt' }>>;
function waitForCommand(
  socket: Socket,
  expectedType: 'agent.cancel',
): Promise<Extract<AgentCommandEnvelope, { type: 'agent.cancel' }>>;
function waitForCommand(socket: Socket, expectedType: AgentCommandEnvelope['type']): Promise<AgentCommandEnvelope> {
  return new Promise((resolve) => {
    const listener = (payload: unknown) => {
      const command = agentCommandEnvelopeSchema.parse(payload);
      if (command.type === expectedType) {
        socket.off(agentProtocolMessageEventName, listener);
        resolve(command);
      }
    };

    socket.on(agentProtocolMessageEventName, listener);
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

test('Task 9: POST /sessions/:sessionId/prompts routes agent.prompt to the owning agent and stores the PM message', async () => {
  const developerLogin = await authenticateDeveloper();
  const pmLogin = await authenticatePm();
  const project = await createOwnedProject(developerLogin.body.user.id);
  const session = await createSession(project.id, developerLogin.body.accessToken);

  await prisma.sessionMember.create({
    data: {
      sessionId: session.id,
      userId: pmLogin.body.user.id,
      role: 'pm',
    },
  });
  await prisma.session.update({
    where: { id: session.id },
    data: { status: 'READY' },
  });

  const agentSocket = connectAgentSocket();

  try {
    await waitForConnect(agentSocket);
    const commandPromise = waitForCommand(agentSocket, 'agent.prompt');

    agentSocket.emit(agentProtocolMessageEventName, {
      protocolVersion: AGENT_PROTOCOL_VERSION,
      messageId: randomUUID(),
      type: 'agent.connected',
      payload: {
        agentId: 'agent-local-1',
        capabilities: ['session.prepare', 'agent.prompt', 'agent.cancel', 'preview'],
      },
      sentAt: new Date().toISOString(),
    } satisfies AgentEventEnvelope);

    await delay(20);

    const response = await fetch(`${baseUrl}/sessions/${session.id}/prompts`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${pmLogin.body.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ content: 'Please fix the failing tests.' }),
    });

    assert.equal(response.status, 201);
    const body = await parseJsonResponse(response, sessionPromptResponseSchema);
    assert.equal(body.sessionId, session.id);
    assert.equal(body.role, 'pm');
    assert.equal(body.content, 'Please fix the failing tests.');

    const command = await commandPromise;
    assert.equal(command.sessionId, session.id);
    assert.equal(command.payload.sessionId, session.id);
    assert.equal(command.payload.prompt, 'Please fix the failing tests.');
    assert.equal(command.payload.modelId, 'codex-cli/gpt-5.4');

    const persistedMessages = await prisma.message.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
    });

    assert.equal(persistedMessages.length, 1);
    assert.equal(persistedMessages[0]?.content, 'Please fix the failing tests.');
    assert.equal(persistedMessages[0]?.role, 'pm');
  } finally {
    agentSocket.close();
  }
});

test('Task 9: POST /sessions/:sessionId/prompts/cancel routes agent.cancel to the owning agent', async () => {
  const developerLogin = await authenticateDeveloper();
  const pmLogin = await authenticatePm();
  const project = await createOwnedProject(developerLogin.body.user.id);
  const session = await createSession(project.id, developerLogin.body.accessToken);

  await prisma.sessionMember.create({
    data: {
      sessionId: session.id,
      userId: pmLogin.body.user.id,
      role: 'pm',
    },
  });
  await prisma.session.update({
    where: { id: session.id },
    data: { status: 'AGENT_RUNNING' },
  });

  const agentSocket = connectAgentSocket();

  try {
    await waitForConnect(agentSocket);
    const commandPromise = waitForCommand(agentSocket, 'agent.cancel');

    agentSocket.emit(agentProtocolMessageEventName, {
      protocolVersion: AGENT_PROTOCOL_VERSION,
      messageId: randomUUID(),
      type: 'agent.connected',
      payload: {
        agentId: 'agent-local-1',
        capabilities: ['session.prepare', 'agent.prompt', 'agent.cancel', 'preview'],
      },
      sentAt: new Date().toISOString(),
    } satisfies AgentEventEnvelope);

    await delay(20);

    const response = await fetch(`${baseUrl}/sessions/${session.id}/prompts/cancel`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${pmLogin.body.accessToken}`,
      },
    });

    assert.equal(response.status, 202);
    assert.deepEqual(await response.json(), {
      accepted: true,
      sessionId: session.id,
    });

    const command = await commandPromise;
    assert.equal(command.sessionId, session.id);
    assert.equal(command.payload.sessionId, session.id);
  } finally {
    agentSocket.close();
  }
});
