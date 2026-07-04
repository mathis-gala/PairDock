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
  type AgentCommandEnvelope,
  type AgentEventEnvelope,
  agentProtocolMessageEventName,
} from '@pairdock/shared-contracts';
import { Server, type Socket } from 'socket.io';
import {
  HealthcheckService,
  HealthcheckTimeoutError,
} from '../../../../packages/local-agent/src/docker/healthcheck.service.js';
import type { SandboxPort, SandboxRef } from '../../../../packages/local-agent/src/docker/sandbox.port.js';
import { WorktreeService } from '../../../../packages/local-agent/src/git/worktree.service.js';
import { SessionRunner } from '../../../../packages/local-agent/src/session/session-runner.js';
import type { PreviewTunnelPort } from '../../../../packages/local-agent/src/tunnel/preview-tunnel.port.js';
import { AgentClient } from '../../../../packages/local-agent/src/websocket/agent-client.js';

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
    io.of('/agent').once('connection', (socket) => {
      socket.on(agentProtocolMessageEventName, (_payload, acknowledge) => {
        if (typeof acknowledge === 'function') {
          acknowledge({ accepted: true });
        }
      });
      resolve(socket);
    });
  });

  return {
    backendUrl: `http://127.0.0.1:${address.port}`,
    io,
    socketPromise,
  };
}

function buildPrepareCommand(
  sessionId: string,
  branchName: string,
): Extract<AgentCommandEnvelope, { type: 'session.prepare' }> {
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: '11111111-1111-4111-8111-111111111111',
    sessionId,
    sentAt: new Date().toISOString(),
    type: 'session.prepare',
    payload: {
      sessionId,
      projectKey: 'pairdock',
      branchName,
      modelId: 'codex-cli/gpt-5.4',
    },
  };
}

function buildCloseCommand(
  sessionId: string,
  mode: 'keep-branch' | 'delete-local',
): Extract<AgentCommandEnvelope, { type: 'session.close' }> {
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: '22222222-2222-4222-8222-222222222222',
    sessionId,
    sentAt: new Date().toISOString(),
    type: 'session.close',
    payload: {
      sessionId,
      mode,
    },
  };
}

function buildPushCommand(sessionId: string): Extract<AgentCommandEnvelope, { type: 'git.pushBranch' }> {
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: '33333333-3333-4333-8333-333333333333',
    sessionId,
    sentAt: new Date().toISOString(),
    type: 'git.pushBranch',
    payload: {
      sessionId,
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

function waitForAgentEvents(socket: Socket, count: number) {
  return new Promise<AgentEventEnvelope[]>((resolve) => {
    const events: AgentEventEnvelope[] = [];
    const listener = (event: AgentEventEnvelope) => {
      events.push(event);
      if (events.length === count) {
        socket.off(agentProtocolMessageEventName, listener);
        resolve(events);
      }
    };

    socket.on(agentProtocolMessageEventName, listener);
  });
}

test('BT-016: AgentClient emits preview progress and session.ready after session.prepare succeeds', async () => {
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
          sandboxPort: new ReadySandboxPort(),
          previewTunnelPort: new ReadyPreviewTunnelPort(),
        },
      ),
    },
  );

  try {
    await client.start();
    const socket = await socketPromise;
    await waitForAgentEvent(socket, 'agent.connected');

    const eventsPromise = waitForAgentEvents(socket, 5);
    socket.emit(agentProtocolMessageEventName, buildPrepareCommand(sessionId, branchName));
    const [connectingEvent, worktreeEvent, dockerEvent, previewEvent, readyEvent] = await eventsPromise;

    assert.equal(connectingEvent.type, 'session.progress');
    assert.equal(connectingEvent.payload.status, 'AGENT_CONNECTING');
    assert.equal(worktreeEvent.type, 'session.progress');
    assert.equal(worktreeEvent.payload.status, 'WORKTREE_CREATING');
    assert.equal(dockerEvent.type, 'session.progress');
    assert.equal(dockerEvent.payload.status, 'DOCKER_STARTING');
    assert.equal(previewEvent.type, 'session.progress');
    assert.equal(previewEvent.payload.status, 'PREVIEW_STARTING');
    assert.equal(readyEvent.type, 'session.ready');
    assert.deepEqual(readyEvent.payload, {
      sessionId,
      previewUrl: 'https://preview.pairdock.test',
    });
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

test('BT-017: AgentClient emits a retryable error when preview healthcheck times out', async () => {
  const repositoryPath = await createTempRepository();
  const managedRoot = await createManagedWorktreeRoot();
  const { backendUrl, io, socketPromise } = await createAgentServer();
  const sessionId = '88888888-8888-4888-8888-888888888888';
  const client = new AgentClient(
    {
      agentId: 'agent-local-1',
      authToken: 'secret-token',
      backendUrl,
      capabilities: ['session.prepare'],
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
          sandboxPort: new TimeoutSandboxPort(),
          healthcheckService: new ImmediateTimeoutHealthcheckService(),
          previewTunnelPort: new ReadyPreviewTunnelPort(),
        },
      ),
    },
  );

  try {
    await client.start();
    const socket = await socketPromise;
    await waitForAgentEvent(socket, 'agent.connected');

    const errorEventPromise = waitForAgentEvent(socket, 'error');
    socket.emit(agentProtocolMessageEventName, buildPrepareCommand(sessionId, 'pairdock/session-8888'));
    const errorEvent = await errorEventPromise;

    assert.equal(errorEvent.type, 'error');
    assert.deepEqual(errorEvent.payload, {
      sessionId,
      code: 'session.preview.failed',
      message: `Preview healthcheck did not become ready for session ${sessionId} within 30000ms.`,
      retryable: true,
    });
  } finally {
    await client.stop();
    await new Promise<void>((resolve) => {
      io.close(() => resolve());
    });
  }
});

test('BT-031: AgentClient pushes the prepared session branch before review request creation', async () => {
  const repositoryPath = await createTempRepository();
  const remotePath = await mkdtemp(join(tmpdir(), 'pairdock-remote-'));
  await execGit(remotePath, ['init', '--bare', '--initial-branch=main']);
  await execGit(repositoryPath, ['remote', 'add', 'origin', remotePath]);
  const managedRoot = await createManagedWorktreeRoot();
  const { backendUrl, io, socketPromise } = await createAgentServer();
  const sessionId = '99999999-9999-4999-8999-999999999999';
  const branchName = 'pairdock/session-9999';
  const client = new AgentClient(
    {
      agentId: 'agent-local-1',
      authToken: 'secret-token',
      backendUrl,
      capabilities: ['session.prepare', 'git.pushBranch'],
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
          sandboxPort: new ReadySandboxPort(),
          previewTunnelPort: new ReadyPreviewTunnelPort(),
        },
      ),
    },
  );

  try {
    await client.start();
    const socket = await socketPromise;
    await waitForAgentEvent(socket, 'agent.connected');

    const readyEventPromise = waitForAgentEvent(socket, 'session.ready');
    socket.emit(agentProtocolMessageEventName, buildPrepareCommand(sessionId, branchName));
    await readyEventPromise;

    const pushedEventPromise = waitForAgentEvent(socket, 'git.branchPushed');
    socket.emit(agentProtocolMessageEventName, buildPushCommand(sessionId));
    const pushedEvent = await pushedEventPromise;

    assert.deepEqual(pushedEvent.payload, {
      sessionId,
      branchName,
    });
    const remoteBranchCommit = await execGit(remotePath, ['rev-parse', '--verify', `refs/heads/${branchName}`]);
    assert.match(remoteBranchCommit, /^[a-f0-9]{40}$/);
  } finally {
    await client.stop();
    await new Promise<void>((resolve) => {
      io.close(() => resolve());
    });
  }
});

class ReadySandboxPort implements SandboxPort {
  async start(input: { sessionId: string }): Promise<SandboxRef> {
    return {
      id: `sandbox-${input.sessionId}`,
      sessionId: input.sessionId,
      healthcheckUrl: 'http://127.0.0.1:3100/health',
    };
  }

  async stop(): Promise<void> {}

  async check(ref: SandboxRef) {
    return {
      ready: true,
      url: ref.healthcheckUrl,
    };
  }
}

class TimeoutSandboxPort implements SandboxPort {
  async start(input: { sessionId: string }): Promise<SandboxRef> {
    return {
      id: `sandbox-${input.sessionId}`,
      sessionId: input.sessionId,
      healthcheckUrl: 'http://127.0.0.1:3200/health',
    };
  }

  async stop(): Promise<void> {}

  async check(ref: SandboxRef) {
    return {
      ready: false,
      url: ref.healthcheckUrl,
      message: 'still starting',
    };
  }
}

class ReadyPreviewTunnelPort implements PreviewTunnelPort {
  async open(input: { sessionId: string }) {
    return {
      id: `tunnel-${input.sessionId}`,
      sessionId: input.sessionId,
      publicUrl: 'https://preview.pairdock.test',
    };
  }

  async close(): Promise<void> {}
}

class ImmediateTimeoutHealthcheckService extends HealthcheckService {
  override waitUntilReady(input: { sandboxRef: SandboxRef }): Promise<{ ready: boolean; url: string }> {
    return Promise.reject(
      new HealthcheckTimeoutError(
        `Preview healthcheck did not become ready for session ${input.sandboxRef.sessionId} within 30000ms.`,
      ),
    );
  }
}

async function execGit(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd });
  return stdout.trim();
}
