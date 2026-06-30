import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
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
import { WorktreeService } from '../../../../packages/local-agent/src/git/worktree.service.js';
import type {
  AgentHarnessEvent,
  AgentHarnessPort,
  RunPromptInput,
} from '../../../../packages/local-agent/src/harness/agent-harness.port.js';
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
    messageId: '71717171-7171-4711-8711-717171717171',
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

function buildPromptCommand(
  sessionId: string,
  prompt: string,
): Extract<AgentCommandEnvelope, { type: 'agent.prompt' }> {
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: '81818181-8181-4811-8811-818181818181',
    sessionId,
    sentAt: new Date().toISOString(),
    type: 'agent.prompt',
    payload: {
      sessionId,
      prompt,
      modelId: 'codex-cli/gpt-5.4',
    },
  };
}

function buildCancelCommand(sessionId: string): Extract<AgentCommandEnvelope, { type: 'agent.cancel' }> {
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: '91919191-9191-4911-8911-919191919191',
    sessionId,
    sentAt: new Date().toISOString(),
    type: 'agent.cancel',
    payload: {
      sessionId,
    },
  };
}

function buildCloseCommand(sessionId: string): Extract<AgentCommandEnvelope, { type: 'session.close' }> {
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: '92929292-9292-4922-8922-929292929292',
    sessionId,
    sentAt: new Date().toISOString(),
    type: 'session.close',
    payload: {
      sessionId,
      mode: 'keep-branch',
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

test('Task 9: AgentClient turns agent.prompt into AGENT_RUNNING, streamed output, and agent.done events', {
  concurrency: false,
}, async () => {
  const repositoryPath = await createTempRepository();
  const managedRoot = await createManagedWorktreeRoot();
  const { backendUrl, io, socketPromise } = await createAgentServer();
  const sessionId = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1';
  const branchName = 'pairdock/session-a1a1';
  const harnessPort = new RecordingHarnessPort();
  const client = new AgentClient(
    {
      agentId: 'agent-local-1',
      authToken: 'secret-token',
      backendUrl,
      capabilities: ['session.prepare', 'session.close', 'agent.prompt', 'agent.cancel'],
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
      agentHarnessPort: harnessPort,
    },
  );

  try {
    await client.start();
    const socket = await socketPromise;
    await waitForAgentEvent(socket, 'agent.connected');

    const prepareEventsPromise = waitForAgentEvents(socket, 5);
    socket.emit(agentProtocolMessageEventName, buildPrepareCommand(sessionId, branchName));
    await prepareEventsPromise;

    const promptEventsPromise = waitForAgentEvents(socket, 3);
    socket.emit(agentProtocolMessageEventName, buildPromptCommand(sessionId, 'Ship the fix.'));
    const [runningEvent, outputEvent, doneEvent] = await promptEventsPromise;

    assert.equal(runningEvent.type, 'session.progress');
    assert.equal(runningEvent.payload.status, 'AGENT_RUNNING');
    assert.equal(outputEvent.type, 'agent.output');
    assert.equal(outputEvent.payload.stream, 'stdout');
    assert.equal(outputEvent.payload.text, 'stdout:Ship the fix.\n');
    assert.equal(doneEvent.type, 'agent.done');
    assert.equal(doneEvent.payload.exitCode, 0);
    assert.deepEqual(harnessPort.lastInput, {
      sessionId,
      projectKey: 'pairdock',
      prompt: 'Ship the fix.',
      modelId: 'codex-cli/gpt-5.4',
      worktreePath: join(managedRoot, sessionId),
    });

    socket.emit(agentProtocolMessageEventName, buildCloseCommand(sessionId));
    await waitForAgentEvent(socket, 'session.closed');
  } finally {
    await client.stop();
    await new Promise<void>((resolve) => {
      io.close(() => resolve());
    });
  }
});

test('Task 9: AgentClient forwards agent.cancel to the harness and emits the final done event', {
  concurrency: false,
}, async () => {
  const repositoryPath = await createTempRepository();
  const managedRoot = await createManagedWorktreeRoot();
  const { backendUrl, io, socketPromise } = await createAgentServer();
  const sessionId = 'b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2';
  const branchName = 'pairdock/session-b2b2';
  const harnessPort = new CancellableHarnessPort();
  const client = new AgentClient(
    {
      agentId: 'agent-local-1',
      authToken: 'secret-token',
      backendUrl,
      capabilities: ['session.prepare', 'session.close', 'agent.prompt', 'agent.cancel'],
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
      agentHarnessPort: harnessPort,
    },
  );

  try {
    await client.start();
    const socket = await socketPromise;
    await waitForAgentEvent(socket, 'agent.connected');

    const prepareEventsPromise = waitForAgentEvents(socket, 5);
    socket.emit(agentProtocolMessageEventName, buildPrepareCommand(sessionId, branchName));
    await prepareEventsPromise;

    const runningAndOutputPromise = waitForAgentEvents(socket, 2);
    socket.emit(agentProtocolMessageEventName, buildPromptCommand(sessionId, 'Cancel this run.'));
    const [runningEvent, outputEvent] = await runningAndOutputPromise;

    assert.equal(runningEvent.type, 'session.progress');
    assert.equal(runningEvent.payload.status, 'AGENT_RUNNING');
    assert.equal(outputEvent.type, 'agent.output');
    assert.equal(outputEvent.payload.text, 'stdout:started\n');

    const doneEventPromise = waitForAgentEvent(socket, 'agent.done');
    socket.emit(agentProtocolMessageEventName, buildCancelCommand(sessionId));
    const doneEvent = await doneEventPromise;

    assert.equal(doneEvent.type, 'agent.done');
    assert.equal(doneEvent.payload.exitCode, 130);
    assert.deepEqual(harnessPort.cancelledSessionIds, [sessionId]);

    socket.emit(agentProtocolMessageEventName, buildCloseCommand(sessionId));
    await waitForAgentEvent(socket, 'session.closed');
  } finally {
    await client.stop();
    await new Promise<void>((resolve) => {
      io.close(() => resolve());
    });
  }
});

class RecordingHarnessPort implements AgentHarnessPort {
  lastInput: RunPromptInput | null = null;

  async *runPrompt(input: RunPromptInput): AsyncIterable<AgentHarnessEvent> {
    this.lastInput = input;
    yield {
      type: 'output',
      stream: 'stdout',
      text: `stdout:${input.prompt}\n`,
    };
    yield {
      type: 'done',
      exitCode: 0,
    };
  }

  async cancel(): Promise<void> {}
}

class CancellableHarnessPort implements AgentHarnessPort {
  private readonly cancellations = new Map<string, () => void>();
  cancelledSessionIds: string[] = [];

  async *runPrompt(input: RunPromptInput): AsyncIterable<AgentHarnessEvent> {
    yield {
      type: 'output',
      stream: 'stdout',
      text: 'stdout:started\n',
    };

    await new Promise<void>((resolve) => {
      this.cancellations.set(input.sessionId, resolve);
    });

    yield {
      type: 'done',
      exitCode: 130,
    };
  }

  async cancel(sessionId: string): Promise<void> {
    this.cancelledSessionIds.push(sessionId);
    this.cancellations.get(sessionId)?.();
    this.cancellations.delete(sessionId);
  }
}

class ReadySandboxPort {
  async start(input: { sessionId: string }) {
    return {
      id: `sandbox-${input.sessionId}`,
      sessionId: input.sessionId,
      healthcheckUrl: 'http://127.0.0.1:3100/health',
    };
  }

  async stop(): Promise<void> {}

  async check(ref: { healthcheckUrl: string }) {
    return {
      ready: true,
      url: ref.healthcheckUrl,
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

async function execGit(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd });
  return stdout.trim();
}
