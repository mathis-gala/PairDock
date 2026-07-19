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
import { authResponseSchema, idResponseSchema, parseJsonResponse } from '../test-json.js';

const prisma = new DatabaseClient();
const AGENT_AUTH_TOKEN = 'integration-agent-token-with-at-least-32-bytes';
const SECOND_AGENT_AUTH_TOKEN = 'second-integration-agent-token-at-least-32-bytes';

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

function waitForConnectError(socket: Socket): Promise<Error> {
  return new Promise((resolve) => {
    socket.once('connect_error', (error: Error) => resolve(error));
  });
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

function connectSocket(namespace: '/agent' | '/ui', accessToken?: string): Socket {
  return io(`${baseUrl}${namespace}`, {
    forceNew: true,
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
  process.env.AGENT_AUTH_CREDENTIALS_JSON = JSON.stringify({
    'agent-local-1': { token: AGENT_AUTH_TOKEN, projectKeys: ['agent-local-1'] },
    'agent-local-2': { token: SECOND_AGENT_AUTH_TOKEN, projectKeys: ['another-project'] },
  });
  await prisma.$connect();
  await startApplication();
});

test.after(async () => {
  await app.close();
  await prisma.$disconnect();
  delete process.env.AGENT_AUTH_CREDENTIALS_JSON;
});

test.beforeEach(async () => {
  await resetDatabase();
});

test('AgentGateway rejects a local agent without the configured bearer token', async () => {
  const agentSocket = connectSocket('/agent');

  try {
    const error = await waitForConnectError(agentSocket);

    assert.match(error.message, /Unauthorized agent/);
    assert.equal(agentSocket.connected, false);
  } finally {
    agentSocket.close();
  }
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
  const agentSocket = connectSocket('/agent', AGENT_AUTH_TOKEN);

  try {
    await Promise.all([waitForConnect(uiSocket), waitForConnect(agentSocket)]);

    const streamedEventPromise = waitForEvent<AgentEventEnvelope>(uiSocket, uiSessionEventName);
    const subscribedPromise = waitForEvent<{ sessionId: string }>(uiSocket, uiSessionSubscribedEventName);

    uiSocket.emit(uiSessionSubscribeEventName, { sessionId: session.id });
    await subscribedPromise;

    const connectedAcknowledgement = await agentSocket.timeout(2_000).emitWithAck(agentProtocolMessageEventName, {
      protocolVersion: AGENT_PROTOCOL_VERSION,
      messageId: randomUUID(),
      type: 'agent.connected',
      payload: {
        agentId: 'agent-local-1',
        capabilities: ['session.prepare', 'agent.prompt', 'preview'],
        models: [],
        projects: [
          {
            key: 'agent-local-1',
            name: 'PairDock',
            repoFullName: 'mathis/pairdock',
            pathAlias: 'PairDock',
            defaultBranch: 'main',
          },
        ],
      },
      sentAt: new Date().toISOString(),
    } satisfies AgentEventEnvelope);
    assert.deepEqual(connectedAcknowledgement, { accepted: true });

    const outputAcknowledgement = await agentSocket.timeout(2_000).emitWithAck(agentProtocolMessageEventName, {
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
    assert.deepEqual(outputAcknowledgement, { accepted: true });

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

test('AgentGateway rejects an authenticated agent identity mismatch', async () => {
  const agentSocket = connectSocket('/agent', AGENT_AUTH_TOKEN);

  try {
    await waitForConnect(agentSocket);
    const acknowledgement = await agentSocket.timeout(2_000).emitWithAck(agentProtocolMessageEventName, {
      protocolVersion: AGENT_PROTOCOL_VERSION,
      messageId: randomUUID(),
      type: 'agent.connected',
      payload: {
        agentId: 'agent-local-2',
        capabilities: [],
        models: [],
        projects: [],
      },
      sentAt: new Date().toISOString(),
    } satisfies AgentEventEnvelope);

    assert.deepEqual(acknowledgement, {
      accepted: false,
      error: 'Agent is not authorized for this event.',
    });
  } finally {
    agentSocket.close();
  }
});

test('AgentGateway rejects session events from an agent that does not own the project', async () => {
  const developerLogin = await authenticateDeveloper();
  const project = await createOwnedProject(developerLogin.body.user.id);
  const session = await createSession(project.id, developerLogin.body.accessToken);
  const agentSocket = connectSocket('/agent', SECOND_AGENT_AUTH_TOKEN);

  try {
    await waitForConnect(agentSocket);
    await agentSocket.timeout(2_000).emitWithAck(agentProtocolMessageEventName, {
      protocolVersion: AGENT_PROTOCOL_VERSION,
      messageId: randomUUID(),
      type: 'agent.connected',
      payload: {
        agentId: 'agent-local-2',
        capabilities: [],
        models: [],
        projects: [
          {
            key: 'another-project',
            name: 'Another project',
            repoFullName: 'mathis/another-project',
            pathAlias: 'Another project',
            defaultBranch: 'main',
          },
        ],
      },
      sentAt: new Date().toISOString(),
    } satisfies AgentEventEnvelope);

    const acknowledgement = await agentSocket.timeout(2_000).emitWithAck(agentProtocolMessageEventName, {
      protocolVersion: AGENT_PROTOCOL_VERSION,
      messageId: randomUUID(),
      sessionId: session.id,
      type: 'agent.output',
      payload: {
        sessionId: session.id,
        stream: 'stdout',
        text: 'attempted cross-project output',
      },
      sentAt: new Date().toISOString(),
    } satisfies AgentEventEnvelope);

    assert.deepEqual(acknowledgement, {
      accepted: false,
      error: 'Agent is not authorized for this event.',
    });
    assert.equal(await prisma.agentEvent.count({ where: { sessionId: session.id } }), 0);
  } finally {
    agentSocket.close();
  }
});
