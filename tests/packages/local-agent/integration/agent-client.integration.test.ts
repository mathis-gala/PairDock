import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import {
  AGENT_PROTOCOL_VERSION,
  type AgentConnectedEventEnvelope,
  agentProtocolMessageEventName,
} from '@pairdock/shared-contracts';
import { Server } from 'socket.io';
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
      socket.on(agentProtocolMessageEventName, (payload: AgentConnectedEventEnvelope) => {
        resolve({
          authorizationHeader: socket.handshake.headers.authorization,
          event: payload,
        });
      });
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
