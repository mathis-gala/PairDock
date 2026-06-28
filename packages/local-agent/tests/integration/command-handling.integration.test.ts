import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import {
  AGENT_PROTOCOL_VERSION,
  type AgentEventEnvelope,
  agentProtocolMessageEventName,
} from '@pairdock/shared-contracts';
import { Server, type Socket } from 'socket.io';
import { WorktreeService } from '../../src/git/worktree.service.js';
import { SessionRunner } from '../../src/session/session-runner.js';
import { AgentClient } from '../../src/websocket/agent-client.js';

const execFileAsync = promisify(execFile);

async function createTempRepository() {
  const repositoryPath = await mkdtemp(join(tmpdir(), 'pairdock-repo-'));
  await execGit(repositoryPath, ['init', '--initial-branch=main']);
  await execGit(repositoryPath, ['config', 'user.name', 'PairDock Test']);
  await execGit(repositoryPath, ['config', 'user.email', 'pairdock@example.test']);
  await execGit(repositoryPath, ['commit', '--allow-empty', '-m', 'initial']);
  return repositoryPath;
}

async function createManagedWorktreeRoot() {
  return mkdtemp(join(tmpdir(), 'pairdock-worktrees-'));
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

  const socketPromise = new Promise<Socket>((resolve) => {
    io.of('/agent').once('connection', (socket) => resolve(socket));
  });

  return {
    backendUrl: `http://127.0.0.1:${address.port}`,
    io,
    socketPromise,
  };
}

function buildPrepareCommand(sessionId: string, branchName: string) {
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: '11111111-1111-4111-8111-111111111111',
    sessionId,
    sentAt: new Date().toISOString(),
    type: 'session.prepare' as const,
    payload: {
      sessionId,
      projectKey: 'pairdock',
      branchName,
      modelId: 'codex-cli/gpt-5.4',
    },
  };
}

function buildCloseCommand(sessionId: string, mode: 'keep-branch' | 'delete-local') {
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: '22222222-2222-4222-8222-222222222222',
    sessionId,
    sentAt: new Date().toISOString(),
    type: 'session.close' as const,
    payload: {
      sessionId,
      mode,
    },
  };
}

function waitForAgentEvent(socket: Socket, eventType: AgentEventEnvelope['type']) {
  return new Promise<AgentEventEnvelope>((resolve) => {
    const listener = (event: AgentEventEnvelope) => {
      if (event.type === eventType) {
        socket.off(agentProtocolMessageEventName, listener);
        resolve(event);
      }
    };

    socket.on(agentProtocolMessageEventName, listener);
  });
}

test('Task 7: AgentClient executes session.prepare and session.close commands through SessionRunner', async () => {
  const repositoryPath = await createTempRepository();
  const managedRoot = await createManagedWorktreeRoot();
  const { backendUrl, io, socketPromise } = await createAgentServer();
  const sessionId = '77777777-7777-4777-8777-777777777777';
  const branchName = 'pairdock/session-7777';
  const worktreePath = join(managedRoot, sessionId);
  const client = new AgentClient(
    {
      agentId: 'agent-local-1',
      authToken: 'secret-token',
      backendUrl,
      capabilities: ['session.prepare', 'session.close'],
      projectPaths: {
        pairdock: repositoryPath,
      },
    },
    {
      error() {},
      info() {},
      warn() {},
    },
    {
      sessionRunner: new SessionRunner(
        {
          projectPaths: {
            pairdock: repositoryPath,
          },
        },
        {
          worktreeService: new WorktreeService(managedRoot),
        },
      ),
    },
  );

  try {
    await client.start();
    const socket = await socketPromise;

    const preparedEventPromise = waitForAgentEvent(socket, 'session.progress');
    socket.emit(agentProtocolMessageEventName, buildPrepareCommand(sessionId, branchName));
    const preparedEvent = await preparedEventPromise;

    assert.equal(preparedEvent.sessionId, sessionId);
    assert.equal(preparedEvent.type, 'session.progress');
    assert.equal(preparedEvent.payload.status, 'WORKTREE_CREATING');
    assert.equal(await execGit(worktreePath, ['branch', '--show-current']), branchName);

    const closedEventPromise = waitForAgentEvent(socket, 'session.closed');
    socket.emit(agentProtocolMessageEventName, buildCloseCommand(sessionId, 'keep-branch'));
    const closedEvent = await closedEventPromise;

    assert.equal(closedEvent.sessionId, sessionId);
    assert.equal(closedEvent.type, 'session.closed');
    assert.deepEqual(closedEvent.payload, {
      sessionId,
      cleaned: true,
    });
    assert.equal(await execGit(repositoryPath, ['branch', '--list', branchName]), branchName);
    await assert.rejects(() => access(worktreePath));
  } finally {
    await client.stop();
    await new Promise<void>((resolve) => {
      io.close(() => resolve());
    });
  }
});

async function execGit(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd });
  return stdout.trim();
}
