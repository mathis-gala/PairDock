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
  uiSessionSubscribedEventName,
  uiSessionSubscribeEventName,
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
    body: (await response.json()) as AuthResponseBody,
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
    body: (await response.json()) as AuthResponseBody,
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
  return (await response.json()) as { id: string };
}

function connectSocket(namespace: '/agent' | '/ui', accessToken?: string): Socket {
  return io(`${baseUrl}${namespace}`, {
    transports: ['websocket'],
    extraHeaders: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
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

function waitForEvent<T>(socket: Socket, eventName: string): Promise<T> {
  return new Promise((resolve) => {
    socket.once(eventName, (payload: T) => resolve(payload));
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

test('BT-011: AgentGateway streams valid agent.output events to an authorized PM UI session', async () => {
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

  const uiSocket = connectSocket('/ui', pmLogin.body.accessToken);
  const agentSocket = connectSocket('/agent');

  try {
    await Promise.all([waitForConnect(uiSocket), waitForConnect(agentSocket)]);

    const streamedEventPromise = waitForEvent<AgentEventEnvelope>(uiSocket, uiSessionEventName);
    const subscribedPromise = waitForEvent<{ sessionId: string }>(uiSocket, uiSessionSubscribedEventName);

    uiSocket.emit(uiSessionSubscribeEventName, { sessionId: session.id });
    await subscribedPromise;

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
        text: 'streamed from the local agent',
      },
      sentAt: new Date().toISOString(),
    } satisfies AgentEventEnvelope);

    const streamedEvent = await streamedEventPromise;

    if (streamedEvent.type !== 'agent.output') {
      assert.fail(`Expected agent.output, received ${streamedEvent.type}`);
    }

    assert.equal(streamedEvent.type, 'agent.output');
    assert.equal(streamedEvent.sessionId, session.id);
    assert.equal(streamedEvent.payload.text, 'streamed from the local agent');

    const persistedEvents = await prisma.agentEvent.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
    });

    assert.equal(persistedEvents.length, 1);
    assert.equal(persistedEvents[0]?.agentId, 'agent-local-1');
    assert.equal(persistedEvents[0]?.type, 'agent.output');
  } finally {
    uiSocket.close();
    agentSocket.close();
  }
});
