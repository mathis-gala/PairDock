import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
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
import { type ChecksResult, ChecksRunner } from '../../../../packages/local-agent/src/checks/checks-runner.js';
import { WorktreeService } from '../../../../packages/local-agent/src/git/worktree.service.js';
import type {
  AgentHarnessEvent,
  AgentHarnessPort,
  RunPromptInput,
} from '../../../../packages/local-agent/src/harness/agent-harness.port.js';
import { FileSessionWorkspaceStore } from '../../../../packages/local-agent/src/session/file-session-workspace.store.js';
import { SessionRegistry } from '../../../../packages/local-agent/src/session/session-registry.js';
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

async function createAgentServer(
  acknowledgeAgentEvent: (event: AgentEventEnvelope) => { accepted: boolean; error?: string } = () => ({
    accepted: true,
  }),
) {
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
      socket.on(agentProtocolMessageEventName, (payload: AgentEventEnvelope, acknowledge) => {
        if (typeof acknowledge === 'function') {
          acknowledge(acknowledgeAgentEvent(payload));
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

async function createPreparedValidationFeedbackClient(
  sessionId: string,
  harnessPort: AgentHarnessPort,
  checksRunner: ChecksRunner,
  acknowledgeAgentEvent?: (event: AgentEventEnvelope) => { accepted: boolean; error?: string },
) {
  const repositoryPath = await createTempRepository();
  const managedRoot = await createManagedWorktreeRoot();
  const { backendUrl, io, socketPromise } = await createAgentServer(acknowledgeAgentEvent);

  await writeFile(join(repositoryPath, 'README.md'), 'Original README\n', 'utf8');
  await execGit(repositoryPath, ['add', 'README.md']);
  await execGit(repositoryPath, ['commit', '-m', 'seed readme']);

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
      checksRunner,
    },
  );

  await client.start();
  const socket = await socketPromise;
  await waitForAgentEvent(socket, 'agent.connected');
  const prepareEventsPromise = waitForAgentEvents(socket, 5);
  socket.emit(
    agentProtocolMessageEventName,
    buildPrepareCommand(sessionId, `pairdock/session-${sessionId.slice(0, 4)}`),
  );
  await prepareEventsPromise;

  return {
    client,
    io,
    socket,
    worktreePath: join(managedRoot, sessionId),
    async cleanup() {
      await client.stop();
      await new Promise<void>((resolve) => {
        io.close(() => resolve());
      });
    },
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
      baseBranch: 'main',
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

function waitForAgentEvent<EventType extends AgentEventEnvelope['type']>(socket: Socket, eventType: EventType) {
  return new Promise<Extract<AgentEventEnvelope, { type: EventType }>>((resolve) => {
    const listener = (event: AgentEventEnvelope) => {
      if (event.type === eventType) {
        socket.off(agentProtocolMessageEventName, listener);
        resolve(event as Extract<AgentEventEnvelope, { type: EventType }>);
      }
    };

    socket.on(agentProtocolMessageEventName, listener);
  });
}

function waitForAgentEvents(socket: Socket, count: number) {
  return new Promise<AgentEventEnvelope[]>((resolve) => {
    const events: AgentEventEnvelope[] = [];
    const listener = (event: AgentEventEnvelope) => {
      if (!event.sessionId) {
        return;
      }

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
  const checksRunner = new RecordingChecksRunner();
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
      checksRunner,
    },
  );

  try {
    await client.start();
    const socket = await socketPromise;
    const prepareEventsPromise = waitForAgentEvents(socket, 5);
    socket.emit(agentProtocolMessageEventName, buildPrepareCommand(sessionId, branchName));
    await prepareEventsPromise;
    await writeFile(
      join(managedRoot, sessionId, 'existing-change.txt'),
      'Already changed before this prompt.\n',
      'utf8',
    );

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
    assert.equal(doneEvent.payload.changesDetected, false);
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.equal(checksRunner.runCount, 0);
    assert.deepEqual(harnessPort.lastInput, {
      sessionId,
      projectKey: 'pairdock',
      prompt: 'Ship the fix.',
      modelId: 'codex-cli/gpt-5.4',
      reasoningEffort: 'medium',
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

test('AgentClient accepts prompts for a session restored during agent startup', { concurrency: false }, async () => {
  const repositoryPath = await createTempRepository();
  const managedRoot = await createManagedWorktreeRoot();
  const stateRoot = await mkdtemp(join(tmpdir(), 'pairdock-session-state-'));
  const statePath = join(stateRoot, 'sessions.json');
  const { backendUrl, io, socketPromise } = await createAgentServer();
  const sessionId = 'b3b3b3b3-b3b3-43b3-83b3-b3b3b3b3b3b3';
  const branchName = 'pairdock/session-b3b3';
  const firstRunner = new SessionRunner(
    { projectPaths: { pairdock: repositoryPath } },
    {
      sessionRegistry: new SessionRegistry(new FileSessionWorkspaceStore(statePath)),
      worktreeService: new WorktreeService(managedRoot),
      sandboxPort: new ReadySandboxPort(),
      previewTunnelPort: new ReadyPreviewTunnelPort(),
    },
  );
  await firstRunner.prepare(buildPrepareCommand(sessionId, branchName));
  const restartedRunner = new SessionRunner(
    { projectPaths: { pairdock: repositoryPath } },
    {
      sessionRegistry: new SessionRegistry(new FileSessionWorkspaceStore(statePath)),
      worktreeService: new WorktreeService(managedRoot),
      sandboxPort: new ReadySandboxPort(),
      previewTunnelPort: new ReadyPreviewTunnelPort(),
    },
  );
  const client = new AgentClient(
    {
      agentId: 'agent-local-1',
      authToken: 'secret-token',
      backendUrl,
      capabilities: ['session.close', 'agent.prompt'],
      projectPaths: { pairdock: repositoryPath },
    },
    { error() {}, info() {}, warn() {} },
    {
      sessionRunner: restartedRunner,
      agentHarnessPort: new RecordingHarnessPort(),
    },
  );

  try {
    await client.start();
    const socket = await socketPromise;
    const eventsPromise = waitForAgentEvents(socket, 3);
    socket.emit(agentProtocolMessageEventName, buildPromptCommand(sessionId, 'Continue after restart.'));
    const [runningEvent, outputEvent, doneEvent] = await eventsPromise;

    assert.equal(runningEvent.type, 'session.progress');
    assert.equal(runningEvent.payload.status, 'AGENT_RUNNING');
    assert.equal(outputEvent.type, 'agent.output');
    assert.equal(outputEvent.payload.text, 'stdout:Continue after restart.\n');
    assert.equal(doneEvent.type, 'agent.done');

    socket.emit(agentProtocolMessageEventName, buildCloseCommand(sessionId));
    await waitForAgentEvent(socket, 'session.closed');
  } finally {
    await client.stop();
    await new Promise<void>((resolve) => {
      io.close(() => resolve());
    });
  }
});

test('BT-021: AgentClient emits a masked git.diff after prompt execution when sensitive files changed', {
  concurrency: false,
}, async () => {
  const repositoryPath = await createTempRepository();
  const managedRoot = await createManagedWorktreeRoot();
  const { backendUrl, io, socketPromise } = await createAgentServer();
  const sessionId = 'c3c3c3c3-c3c3-43c3-83c3-c3c3c3c3c3c3';
  const branchName = 'pairdock/session-c3c3';
  const harnessPort = new MutatingHarnessPort();

  await writeFile(join(repositoryPath, 'README.md'), 'Original README\n', 'utf8');
  await execGit(repositoryPath, ['add', 'README.md']);
  await execGit(repositoryPath, ['commit', '-m', 'seed readme']);

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
    const prepareEventsPromise = waitForAgentEvents(socket, 5);
    socket.emit(agentProtocolMessageEventName, buildPrepareCommand(sessionId, branchName));
    await prepareEventsPromise;

    const promptEventsPromise = waitForAgentEvents(socket, 4);
    socket.emit(agentProtocolMessageEventName, buildPromptCommand(sessionId, 'Protect secrets.'));
    const [runningEvent, outputEvent, doneEvent, diffEvent] = await promptEventsPromise;

    assert.equal(runningEvent.type, 'session.progress');
    assert.equal(runningEvent.payload.status, 'AGENT_RUNNING');
    assert.equal(outputEvent.type, 'agent.output');
    assert.match(outputEvent.payload.text, /Bearer \[REDACTED\]/);
    assert.doesNotMatch(outputEvent.payload.text, /super-secret-token/);
    assert.equal(doneEvent.type, 'agent.done');
    assert.equal(doneEvent.payload.exitCode, 0);
    assert.equal(doneEvent.payload.changesDetected, true);
    assert.equal(diffEvent.type, 'git.diff');
    assert.deepEqual(diffEvent.payload.changedFiles, ['README.md', '.env']);
    assert.match(diffEvent.payload.diff, /Updated README/);
    assert.match(diffEvent.payload.diff, /\[PAIRDOCK_REDACTED\] Sensitive file omitted: \.env/);
    assert.doesNotMatch(diffEvent.payload.diff, /TOP_SECRET_VALUE/);

    socket.emit(agentProtocolMessageEventName, buildCloseCommand(sessionId));
    await waitForAgentEvent(socket, 'session.closed');
  } finally {
    await client.stop();
    await new Promise<void>((resolve) => {
      io.close(() => resolve());
    });
  }
});

test('AgentClient resumes the same harness session with Docker validation failures and publishes only the final result', {
  concurrency: false,
}, async () => {
  const sessionId = 'd4d4d4d4-d4d4-44d4-84d4-d4d4d4d4d4d4';
  const harnessPort = new ValidationRepairHarnessPort();
  const checksRunner = new SequencedChecksRunner([
    failedChecks('TypeError: expected true\nBearer super-secret-token', 'bun test --token=super-secret-token'),
    passedChecks(),
  ]);
  const fixture = await createPreparedValidationFeedbackClient(sessionId, harnessPort, checksRunner);

  try {
    const events: AgentEventEnvelope[] = [];
    const eventListener = (event: AgentEventEnvelope) => {
      if (event.sessionId === sessionId) {
        events.push(event);
      }
    };
    fixture.socket.on(agentProtocolMessageEventName, eventListener);
    const checksEventPromise = waitForAgentEvent(fixture.socket, 'checks.result');
    fixture.socket.emit(
      agentProtocolMessageEventName,
      buildPromptCommand(sessionId, 'Implement and validate the fix.'),
    );
    await checksEventPromise;
    fixture.socket.off(agentProtocolMessageEventName, eventListener);
    const checksEvents = events.filter((event) => event.type === 'checks.result');

    assert.equal(harnessPort.inputs.length, 2);
    assert.equal(harnessPort.inputs[0]?.prompt, 'Implement and validate the fix.');
    assert.match(harnessPort.inputs[1]?.prompt ?? '', /Docker validation failed/i);
    assert.match(harnessPort.inputs[1]?.prompt ?? '', /TypeError: expected true/);
    assert.match(harnessPort.inputs[1]?.prompt ?? '', /Bearer \[REDACTED\]/);
    assert.match(harnessPort.inputs[1]?.prompt ?? '', /--token=\[REDACTED\]/);
    assert.doesNotMatch(harnessPort.inputs[1]?.prompt ?? '', /super-secret-token/);
    assert.equal(checksRunner.runCount, 2);
    assert.equal(checksEvents.length, 1);
    assert.equal(checksEvents[0]?.payload.ok, true);
    assert.deepEqual(
      events.map((event) => event.type),
      [
        'session.progress',
        'agent.output',
        'agent.done',
        'session.progress',
        'agent.output',
        'agent.done',
        'git.diff',
        'checks.result',
      ],
    );

    fixture.socket.emit(agentProtocolMessageEventName, buildCloseCommand(sessionId));
    await waitForAgentEvent(fixture.socket, 'session.closed');
  } finally {
    await fixture.cleanup();
  }
});

test('AgentClient bounds automatic Docker validation repairs to two attempts', { concurrency: false }, async () => {
  const sessionId = 'e5e5e5e5-e5e5-45e5-85e5-e5e5e5e5e5e5';
  const harnessPort = new AlwaysChangingHarnessPort();
  const checksRunner = new SequencedChecksRunner([failedChecks('Tests still fail')]);
  const fixture = await createPreparedValidationFeedbackClient(sessionId, harnessPort, checksRunner);

  try {
    const checksEventPromise = waitForAgentEvent(fixture.socket, 'checks.result');
    fixture.socket.emit(agentProtocolMessageEventName, buildPromptCommand(sessionId, 'Try the bounded repair loop.'));
    const checksEvent = await checksEventPromise;

    assert.equal(harnessPort.inputs.length, 3);
    assert.equal(checksRunner.runCount, 3);
    assert.match(harnessPort.inputs[1]?.prompt ?? '', /automatic repair 1\/2/);
    assert.match(harnessPort.inputs[2]?.prompt ?? '', /automatic repair 2\/2/);
    assert.equal(checksEvent.payload.ok, false);

    fixture.socket.emit(agentProtocolMessageEventName, buildCloseCommand(sessionId));
    await waitForAgentEvent(fixture.socket, 'session.closed');
  } finally {
    await fixture.cleanup();
  }
});

test('AgentClient keeps untrusted validation output delimited when the repair prompt is truncated', {
  concurrency: false,
}, async () => {
  const sessionId = 'f6f6f6f6-f6f6-46f6-86f6-f6f6f6f6f6f6';
  const harnessPort = new ValidationRepairHarnessPort();
  const checksRunner = new SequencedChecksRunner([
    failedChecks('Latest diagnostic line', `bun test ${'x'.repeat(20_000)}`),
    passedChecks(),
  ]);
  const fixture = await createPreparedValidationFeedbackClient(sessionId, harnessPort, checksRunner);

  try {
    const checksEventPromise = waitForAgentEvent(fixture.socket, 'checks.result');
    fixture.socket.emit(agentProtocolMessageEventName, buildPromptCommand(sessionId, 'Repair bounded diagnostics.'));
    await checksEventPromise;

    const repairPrompt = harnessPort.inputs[1]?.prompt ?? '';
    assert.ok(repairPrompt.length <= 12_000);
    assert.match(repairPrompt, /Latest diagnostic line/);
    assert.match(repairPrompt, /<\/validation_output>$/);

    fixture.socket.emit(agentProtocolMessageEventName, buildCloseCommand(sessionId));
    await waitForAgentEvent(fixture.socket, 'session.closed');
  } finally {
    await fixture.cleanup();
  }
});

test('AgentClient does not attribute files generated by Docker checks to the repair turn', {
  concurrency: false,
}, async () => {
  const sessionId = '09090909-0909-4909-8909-090909090909';
  const harnessPort = new InitialChangeOnlyHarnessPort();
  const checksRunner = new WorktreeMutatingChecksRunner([failedChecks('Generated file mismatch')]);
  const fixture = await createPreparedValidationFeedbackClient(sessionId, harnessPort, checksRunner);
  checksRunner.worktreePath = fixture.worktreePath;

  try {
    const checksEventPromise = waitForAgentEvent(fixture.socket, 'checks.result');
    fixture.socket.emit(agentProtocolMessageEventName, buildPromptCommand(sessionId, 'Generate and validate once.'));
    const checksEvent = await checksEventPromise;

    assert.equal(harnessPort.inputs.length, 2);
    assert.equal(checksRunner.runCount, 1);
    assert.equal(checksEvent.payload.ok, false);

    fixture.socket.emit(agentProtocolMessageEventName, buildCloseCommand(sessionId));
    await waitForAgentEvent(fixture.socket, 'session.closed');
  } finally {
    await fixture.cleanup();
  }
});

test('AgentClient publishes the final worktree diff after Docker checks finish', { concurrency: false }, async () => {
  const sessionId = '10101010-1010-4010-8010-101010101010';
  const harnessPort = new InitialChangeOnlyHarnessPort();
  const checksRunner = new WorktreeMutatingChecksRunner([passedChecks()]);
  const fixture = await createPreparedValidationFeedbackClient(sessionId, harnessPort, checksRunner);
  checksRunner.worktreePath = fixture.worktreePath;

  try {
    const diffEventPromise = waitForAgentEvent(fixture.socket, 'git.diff');
    const checksEventPromise = waitForAgentEvent(fixture.socket, 'checks.result');
    fixture.socket.emit(
      agentProtocolMessageEventName,
      buildPromptCommand(sessionId, 'Publish the validated worktree.'),
    );
    const [diffEvent, checksEvent] = await Promise.all([diffEventPromise, checksEventPromise]);

    assert.equal(checksEvent.payload.ok, true);
    assert.ok(diffEvent.payload.changedFiles.includes('generated-by-check.txt'));
    assert.match(diffEvent.payload.diff, /Generated by Docker validation/);

    fixture.socket.emit(agentProtocolMessageEventName, buildCloseCommand(sessionId));
    await waitForAgentEvent(fixture.socket, 'session.closed');
  } finally {
    await fixture.cleanup();
  }
});

test('AgentClient aborts before editing when the backend rejects the running state transition', {
  concurrency: false,
}, async () => {
  const sessionId = '07070707-0707-4707-8707-070707070707';
  const harnessPort = new ValidationRepairHarnessPort();
  const fixture = await createPreparedValidationFeedbackClient(
    sessionId,
    harnessPort,
    new SequencedChecksRunner([passedChecks()]),
    (event) =>
      event.type === 'session.progress' && event.payload.status === 'AGENT_RUNNING'
        ? { accepted: false, error: 'Invalid session transition.' }
        : { accepted: true },
  );

  try {
    const acknowledgement = await fixture.socket
      .timeout(2_000)
      .emitWithAck(agentProtocolMessageEventName, buildPromptCommand(sessionId, 'Do not edit after rejection.'));

    assert.deepEqual(acknowledgement, {
      accepted: false,
      error: 'PairDock backend rejected session.progress: Invalid session transition.',
    });
    assert.equal(harnessPort.inputs.length, 0);

    fixture.socket.emit(agentProtocolMessageEventName, buildCloseCommand(sessionId));
    await waitForAgentEvent(fixture.socket, 'session.closed');
  } finally {
    await fixture.cleanup();
  }
});

test('AgentClient cancels the active harness when the backend rejects streamed output', {
  concurrency: false,
}, async () => {
  const sessionId = '18181818-1818-4818-8818-181818181818';
  const harnessPort = new CancellableHarnessPort();
  const fixture = await createPreparedValidationFeedbackClient(
    sessionId,
    harnessPort,
    new SequencedChecksRunner([passedChecks()]),
    (event) =>
      event.type === 'agent.output' ? { accepted: false, error: 'Session stream is unavailable.' } : { accepted: true },
  );

  try {
    const acknowledgement = await fixture.socket
      .timeout(2_000)
      .emitWithAck(agentProtocolMessageEventName, buildPromptCommand(sessionId, 'Stop if output is rejected.'));

    assert.deepEqual(acknowledgement, {
      accepted: false,
      error: 'PairDock backend rejected agent.output: Session stream is unavailable.',
    });
    assert.deepEqual(harnessPort.cancelledSessionIds, [sessionId]);

    fixture.socket.emit(agentProtocolMessageEventName, buildCloseCommand(sessionId));
    await waitForAgentEvent(fixture.socket, 'session.closed');
  } finally {
    await fixture.cleanup();
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

class RecordingChecksRunner extends ChecksRunner {
  runCount = 0;

  override async run(input: Parameters<ChecksRunner['run']>[0]) {
    this.runCount += 1;
    return super.run(input);
  }
}

class CancellableHarnessPort implements AgentHarnessPort {
  private readonly cancellations = new Map<string, () => void>();
  private readonly pendingCancellations = new Set<string>();
  cancelledSessionIds: string[] = [];

  async *runPrompt(input: RunPromptInput): AsyncIterable<AgentHarnessEvent> {
    yield {
      type: 'output',
      stream: 'stdout',
      text: 'stdout:started\n',
    };

    if (this.pendingCancellations.has(input.sessionId)) {
      this.pendingCancellations.delete(input.sessionId);
    } else {
      await new Promise<void>((resolve) => {
        this.cancellations.set(input.sessionId, resolve);
      });
    }

    yield {
      type: 'done',
      exitCode: 130,
    };
  }

  async cancel(sessionId: string): Promise<void> {
    this.cancelledSessionIds.push(sessionId);
    const cancellation = this.cancellations.get(sessionId);
    if (cancellation) {
      cancellation();
    } else {
      this.pendingCancellations.add(sessionId);
    }
    this.cancellations.delete(sessionId);
  }
}

class MutatingHarnessPort implements AgentHarnessPort {
  async *runPrompt(input: RunPromptInput): AsyncIterable<AgentHarnessEvent> {
    await writeFile(join(input.worktreePath, 'README.md'), 'Updated README\n', 'utf8');
    await writeFile(join(input.worktreePath, '.env'), 'API_TOKEN=TOP_SECRET_VALUE\n', 'utf8');

    yield {
      type: 'output',
      stream: 'stdout',
      text: 'Bearer super-secret-token\n',
    };
    yield {
      type: 'done',
      exitCode: 0,
    };
  }

  async cancel(): Promise<void> {}
}

class ValidationRepairHarnessPort implements AgentHarnessPort {
  readonly inputs: RunPromptInput[] = [];

  async *runPrompt(input: RunPromptInput): AsyncIterable<AgentHarnessEvent> {
    this.inputs.push(input);
    await writeFile(
      join(input.worktreePath, 'README.md'),
      this.inputs.length === 1 ? 'Broken README\n' : 'Repaired README\n',
      'utf8',
    );
    yield {
      type: 'output',
      stream: 'stdout',
      text: this.inputs.length === 1 ? 'Initial change\n' : 'Validation repair\n',
    };
    yield {
      type: 'done',
      exitCode: 0,
    };
  }

  async cancel(): Promise<void> {}
}

class AlwaysChangingHarnessPort implements AgentHarnessPort {
  readonly inputs: RunPromptInput[] = [];

  async *runPrompt(input: RunPromptInput): AsyncIterable<AgentHarnessEvent> {
    this.inputs.push(input);
    await writeFile(
      join(input.worktreePath, `attempt-${this.inputs.length}.txt`),
      `Attempt ${this.inputs.length}\n`,
      'utf8',
    );
    yield {
      type: 'done',
      exitCode: 0,
    };
  }

  async cancel(): Promise<void> {}
}

class InitialChangeOnlyHarnessPort implements AgentHarnessPort {
  readonly inputs: RunPromptInput[] = [];

  async *runPrompt(input: RunPromptInput): AsyncIterable<AgentHarnessEvent> {
    this.inputs.push(input);
    if (this.inputs.length === 1) {
      await writeFile(join(input.worktreePath, 'README.md'), 'Initial agent change\n', 'utf8');
    }
    yield {
      type: 'done',
      exitCode: 0,
    };
  }

  async cancel(): Promise<void> {}
}

class SequencedChecksRunner extends ChecksRunner {
  runCount = 0;

  constructor(private readonly results: ChecksResult[]) {
    super();
  }

  override async run(): Promise<ChecksResult> {
    const result = this.results[Math.min(this.runCount, this.results.length - 1)];
    this.runCount += 1;

    if (!result) {
      throw new Error('Sequenced checks result is missing.');
    }

    return result;
  }
}

class WorktreeMutatingChecksRunner extends SequencedChecksRunner {
  worktreePath: string | null = null;

  override async run(): Promise<ChecksResult> {
    if (!this.worktreePath) {
      throw new Error('Worktree path is not configured.');
    }

    await writeFile(join(this.worktreePath, 'generated-by-check.txt'), 'Generated by Docker validation\n', 'utf8');
    return super.run();
  }
}

function failedChecks(logs: string, command = 'bun test'): ChecksResult {
  return {
    ok: false,
    build: { status: 'passed' },
    tests: { status: 'failed', command, logs },
    lint: { status: 'passed' },
    preview: { status: 'passed' },
  };
}

function passedChecks(): ChecksResult {
  return {
    ok: true,
    build: { status: 'passed' },
    tests: { status: 'passed' },
    lint: { status: 'passed' },
    preview: { status: 'passed' },
  };
}

class ReadySandboxPort {
  async runCommand() {
    return { exitCode: 0, logs: '' };
  }

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
