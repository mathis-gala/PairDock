import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { AGENT_PROTOCOL_VERSION, type AgentCommandEnvelope } from '@pairdock/shared-contracts';
import type { SandboxPort, SandboxRef } from '../../../../packages/local-agent/src/docker/sandbox.port.js';
import { WorktreeService } from '../../../../packages/local-agent/src/git/worktree.service.js';
import {
  type AgentHarnessEvent,
  CodexHarnessAdapter,
} from '../../../../packages/local-agent/src/harness/codex-harness.adapter.js';
import { SessionRunner } from '../../../../packages/local-agent/src/session/session-runner.js';
import type { PreviewTunnelPort } from '../../../../packages/local-agent/src/tunnel/preview-tunnel.port.js';

const execFileAsync = promisify(execFile);
const HARNESS_SCRIPT_PATH = resolve(__dirname, '../../../fixtures/local-agent/mock-harness.mjs');

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

function buildPrepareCommand(
  sessionId: string,
  branchName: string,
): Extract<AgentCommandEnvelope, { type: 'session.prepare' }> {
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: '41414141-4141-4411-8411-414141414141',
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

function buildCloseCommand(sessionId: string): Extract<AgentCommandEnvelope, { type: 'session.close' }> {
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: '51515151-5151-4511-8511-515151515151',
    sessionId,
    sentAt: new Date().toISOString(),
    type: 'session.close',
    payload: {
      sessionId,
      mode: 'keep-branch',
    },
  };
}

async function collectEvents(iterable: AsyncIterable<AgentHarnessEvent>): Promise<AgentHarnessEvent[]> {
  const events: AgentHarnessEvent[] = [];

  for await (const event of iterable) {
    events.push(event);
  }

  return events;
}

test('Task 8 and Task 9: an example project prepares a preview and a dummy prompt streams logs with an exit code', async () => {
  const repositoryPath = await createTempRepository();
  const managedRoot = await createManagedWorktreeRoot();
  const sessionId = '61616161-6161-4611-8611-616161616161';
  const branchName = 'pairdock/session-6161';
  const sandboxPort = new ReadySandboxPort();
  const previewTunnelPort = new ReadyPreviewTunnelPort();
  const sessionRunner = new SessionRunner(
    {
      projectPaths: {
        pairdock: repositoryPath,
      },
      previewConfigs: {
        pairdock: {
          sandbox: {
            startCommand: 'pnpm dev --host 0.0.0.0 --port 4000',
            healthcheckUrl: 'http://127.0.0.1:4000',
          },
          tunnel: {
            publicUrl: 'https://preview.pairdock.test',
          },
          healthcheckIntervalMs: 100,
          healthcheckTimeoutMs: 5_000,
        },
      },
    },
    {
      previewTunnelPort,
      sandboxPort,
      worktreeService: new WorktreeService(managedRoot),
    },
  );
  const harnessAdapter = new CodexHarnessAdapter({
    pairdock: {
      command: 'node',
      args: [HARNESS_SCRIPT_PATH, '{{prompt}}', '{{modelId}}', '{{reasoningEffort}}'],
    },
  });

  const workspace = await sessionRunner.prepare(buildPrepareCommand(sessionId, branchName));

  try {
    assert.equal(workspace.previewUrl, 'https://preview.pairdock.test');
    assert.equal(sandboxPort.startCalls[0]?.worktreePath, workspace.worktreePath);
    assert.equal(previewTunnelPort.openCalls[0]?.localUrl, 'http://127.0.0.1:4000');

    const events = await collectEvents(
      harnessAdapter.runPrompt({
        sessionId,
        projectKey: workspace.projectKey,
        prompt: 'ship-it',
        modelId: 'codex-cli/gpt-5.4',
        reasoningEffort: 'medium',
        worktreePath: workspace.worktreePath,
      }),
    );

    const outputEvents = events.filter((event) => event.type === 'output');

    assert.equal(
      outputEvents
        .filter((event) => event.stream === 'stdout')
        .map((event) => event.text)
        .join(''),
      'prompt:ship-it\n',
    );
    assert.equal(
      outputEvents
        .filter((event) => event.stream === 'stderr')
        .map((event) => event.text)
        .join(''),
      'model:codex-cli/gpt-5.4\nreasoning:medium\n',
    );
    assert.deepEqual(events.at(-1), { type: 'done', exitCode: 0 });
  } finally {
    await sessionRunner.close(buildCloseCommand(sessionId));
  }

  await assert.rejects(() => access(workspace.worktreePath));
});

class ReadySandboxPort implements SandboxPort {
  readonly startCalls: Array<{ worktreePath: string }> = [];

  async start(input: { sessionId: string; worktreePath: string }): Promise<SandboxRef> {
    this.startCalls.push({ worktreePath: input.worktreePath });
    return {
      id: `sandbox-${input.sessionId}`,
      sessionId: input.sessionId,
      healthcheckUrl: 'http://127.0.0.1:4000',
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

class ReadyPreviewTunnelPort implements PreviewTunnelPort {
  readonly openCalls: Array<{ localUrl: string }> = [];

  async open(input: { sessionId: string; localUrl: string }) {
    this.openCalls.push({ localUrl: input.localUrl });
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
