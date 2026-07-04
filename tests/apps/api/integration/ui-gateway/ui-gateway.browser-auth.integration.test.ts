import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  AGENT_PROTOCOL_VERSION,
  type AgentEventEnvelope,
  agentProtocolMessageEventName,
  uiSessionEventName,
  uiSessionSubscribeEventName,
} from '@pairdock/shared-contracts';
import { io, type Socket } from 'socket.io-client';
import { AppModule } from '../../../../../apps/api/src/app.module.js';
import { DatabaseClient } from '../../../../../apps/api/src/persistence/client.js';
import { authResponseSchema, idResponseSchema, parseJsonResponse, sessionIdResponseSchema } from '../test-json.js';

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
      accessToken: `slack:${tokenSeed}:team-${tokenSeed}:pm-${tokenSeed}@pairdock.test:PM ${tokenSeed}`,
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

function connectBrowserUiSocket(accessToken: string): Socket {
  return io(`${baseUrl}/ui`, {
    transports: ['websocket'],
    auth: {
      token: accessToken,
    },
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

function waitForEvent<T>(socket: Socket, eventName: string, timeoutMs = 2_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for ${eventName}.`));
    }, timeoutMs);

    socket.once(eventName, (payload: T) => {
      clearTimeout(timeout);
      resolve(payload);
    });
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

test('Task 12: UiGateway accepts browser auth payloads for PM session subscriptions', async () => {
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

  const uiSocket = connectBrowserUiSocket(pmLogin.body.accessToken);
  const agentSocket = connectAgentSocket();

  try {
    await Promise.all([waitForConnect(uiSocket), waitForConnect(agentSocket)]);

    const streamedEventPromise = waitForEvent<AgentEventEnvelope>(uiSocket, uiSessionEventName);

    const subscribed = sessionIdResponseSchema.parse(
      await uiSocket.timeout(2_000).emitWithAck(uiSessionSubscribeEventName, {
        sessionId: session.id,
      }),
    );

    assert.equal(subscribed.sessionId, session.id);

    agentSocket.emit(agentProtocolMessageEventName, {
      protocolVersion: AGENT_PROTOCOL_VERSION,
      messageId: randomUUID(),
      type: 'agent.connected',
      payload: {
        agentId: 'agent-local-1',
        capabilities: ['session.prepare', 'agent.prompt', 'preview'],
      },
      sentAt: new Date().toISOString(),
    } satisfies AgentEventEnvelope);

    agentSocket.emit(agentProtocolMessageEventName, {
      protocolVersion: AGENT_PROTOCOL_VERSION,
      messageId: randomUUID(),
      sessionId: session.id,
      type: 'agent.output',
      payload: {
        sessionId: session.id,
        stream: 'stdout',
        text: 'browser-auth UI subscription works',
      },
      sentAt: new Date().toISOString(),
    } satisfies AgentEventEnvelope);

    const streamedEvent = await streamedEventPromise;

    assert.equal(streamedEvent.type, 'agent.output');
    assert.equal(streamedEvent.sessionId, session.id);
    assert.equal(streamedEvent.payload.text, 'browser-auth UI subscription works');
  } finally {
    uiSocket.close();
    agentSocket.close();
  }
});
