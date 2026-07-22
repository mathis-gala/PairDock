import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import {
  AGENT_PROTOCOL_VERSION,
  type AgentConnectedEventEnvelope,
  agentProtocolMessageEventName,
} from '@pairdock/shared-contracts';
import { Server } from 'socket.io';
import { SessionRunner } from '../../../../packages/local-agent/src/session/session-runner.js';
import { AgentClient } from '../../../../packages/local-agent/src/websocket/agent-client.js';

interface RecordedHandshake {
  authorizationHeader: string | undefined;
  event: AgentConnectedEventEnvelope;
}

async function createAgentServer() {
  const httpServer = createServer();
  const io = new Server(httpServer, { cors: { origin: '*' } });

  await new Promise<void>((resolve) => {
    httpServer.listen(0, '127.0.0.1', () => resolve());
  });

  const address = httpServer.address();

  if (!address || typeof address === 'string') {
    throw new Error('Expected an ephemeral port for the test websocket server.');
  }

  return {
    io,
    httpServer,
    backendUrl: `http://127.0.0.1:${address.port}`,
  };
}

test('BT-012: AgentClient announces configured capabilities when it connects', async () => {
  const { io, httpServer, backendUrl } = await createAgentServer();
  const received = new Promise<RecordedHandshake>((resolve) => {
    io.of('/agent').on('connection', (socket) => {
      socket.on(
        agentProtocolMessageEventName,
        (payload: AgentConnectedEventEnvelope, acknowledge?: (response: { accepted: boolean }) => void) => {
          acknowledge?.({ accepted: true });
          resolve({
            authorizationHeader: socket.handshake.headers.authorization,
            event: payload,
          });
        },
      );
    });
  });

  const client = new AgentClient(
    {
      agentId: 'agent-local-1',
      authToken: 'secret-token',
      backendUrl,
      capabilities: ['session.prepare', 'agent.prompt'],
      projectPaths: {},
    },
    {
      error() {},
      info() {},
      warn() {},
    },
  );

  try {
    await client.start();
    const handshake = await received;

    assert.equal(handshake.authorizationHeader, 'Bearer secret-token');
    assert.equal(handshake.event.protocolVersion, AGENT_PROTOCOL_VERSION);
    assert.equal(handshake.event.type, 'agent.connected');
    assert.equal(handshake.event.payload.agentId, 'agent-local-1');
    assert.deepEqual(handshake.event.payload.capabilities, ['session.prepare', 'agent.prompt']);
    assert.match(handshake.event.messageId, /^[0-9a-f-]{36}$/i);
    assert.match(handshake.event.sentAt, /^\d{4}-\d{2}-\d{2}T/);
  } finally {
    await client.stop();
    await new Promise<void>((resolve) => {
      io.close(() => resolve());
    });
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  }
});

test('AgentClient waits for backend registration before publishing recovery failures', async () => {
  const { io, httpServer, backendUrl } = await createAgentServer();
  const receivedEventTypes: string[] = [];
  let acceptRegistration!: () => void;
  const registrationReceived = new Promise<void>((resolve) => {
    io.of('/agent').on('connection', (socket) => {
      socket.on(
        agentProtocolMessageEventName,
        (
          payload: AgentConnectedEventEnvelope | { type: string },
          acknowledge?: (response: { accepted: boolean }) => void,
        ) => {
          receivedEventTypes.push(payload.type);
          if (payload.type === 'agent.connected') {
            acceptRegistration = () => acknowledge?.({ accepted: true });
            resolve();
            return;
          }

          acknowledge?.({ accepted: true });
        },
      );
    });
  });
  const sessionRunner = new SessionRunnerWithRecoveryFailure();
  const client = new AgentClient(
    {
      agentId: 'agent-local-1',
      backendUrl,
      capabilities: ['session.prepare'],
      projectPaths: {},
    },
    { error() {}, info() {}, warn() {} },
    { sessionRunner },
  );
  let startResolved = false;

  try {
    const startPromise = client.start().then(() => {
      startResolved = true;
    });
    await registrationReceived;
    await new Promise<void>((resolve) => setTimeout(resolve, 25));

    assert.deepEqual(receivedEventTypes, ['agent.connected']);
    assert.equal(startResolved, false);

    acceptRegistration();
    await startPromise;
    await waitFor(() => receivedEventTypes.includes('error'));
    assert.deepEqual(receivedEventTypes, ['agent.connected', 'error']);
  } finally {
    await client.stop();
    await new Promise<void>((resolve) => io.close(() => resolve()));
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  }
});

test('AgentClient publishes the rebuilt preview URL after backend registration', async () => {
  const { io, httpServer, backendUrl } = await createAgentServer();
  const receivedEventTypes: string[] = [];
  let recoveredPreviewUrl: string | undefined;
  const recoveredEventReceived = new Promise<void>((resolve) => {
    io.of('/agent').on('connection', (socket) => {
      socket.on(
        agentProtocolMessageEventName,
        (
          payload: { type: string; payload?: { previewUrl?: string } },
          acknowledge?: (response: { accepted: boolean }) => void,
        ) => {
          receivedEventTypes.push(payload.type);
          recoveredPreviewUrl = payload.payload?.previewUrl ?? recoveredPreviewUrl;
          acknowledge?.({ accepted: true });
          if (payload.type === 'session.recovered') {
            resolve();
          }
        },
      );
    });
  });
  const client = new AgentClient(
    {
      agentId: 'agent-local-1',
      backendUrl,
      capabilities: ['session.prepare'],
      projectPaths: {},
    },
    { error() {}, info() {}, warn() {} },
    { sessionRunner: new SessionRunnerWithRecoveredWorkspace() },
  );

  try {
    await client.start();
    await Promise.race([
      recoveredEventReceived,
      new Promise<never>((_resolve, reject) =>
        setTimeout(() => reject(new Error('Timed out waiting for session.recovered.')), 500),
      ),
    ]);

    assert.deepEqual(receivedEventTypes.slice(0, 2), ['agent.connected', 'session.recovered']);
    assert.equal(recoveredPreviewUrl, 'https://recovered-preview.pairdock.test');
  } finally {
    await client.stop();
    await new Promise<void>((resolve) => io.close(() => resolve()));
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  }
});

class SessionRunnerWithRecoveryFailure extends SessionRunner {
  override async restore() {
    return {
      recoveredSessionIds: [],
      failures: [{ sessionId: '13131313-1313-4313-8313-131313131313', message: 'preview unavailable' }],
    };
  }
}

class SessionRunnerWithRecoveredWorkspace extends SessionRunner {
  private readonly sessionId = '14141414-1414-4414-8414-141414141414';

  override async restore() {
    return { recoveredSessionIds: [this.sessionId], failures: [] };
  }

  override findWorkspace(sessionId: string) {
    if (sessionId !== this.sessionId) {
      return null;
    }

    return {
      sessionId,
      projectKey: 'pairdock',
      repositoryPath: '/tmp/pairdock',
      worktreePath: '/tmp/pairdock-worktree',
      branchName: 'pairdock/session-recovered',
      previewUrl: 'https://recovered-preview.pairdock.test',
    };
  }
}

async function waitFor(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 1_000;
  while (!predicate()) {
    if (Date.now() >= deadline) {
      throw new Error('Timed out waiting for agent event.');
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 5));
  }
}
