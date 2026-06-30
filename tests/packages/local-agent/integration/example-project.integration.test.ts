import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, mkdtemp, realpath } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { AGENT_PROTOCOL_VERSION, type AgentCommandEnvelope } from '@pairdock/shared-contracts';
import { WorktreeService } from '../../../../packages/local-agent/src/git/worktree.service.js';
import {
  type AgentHarnessEvent,
  CodexHarnessAdapter,
} from '../../../../packages/local-agent/src/harness/codex-harness.adapter.js';
import { SessionRunner } from '../../../../packages/local-agent/src/session/session-runner.js';

const execFileAsync = promisify(execFile);
const HARNESS_SCRIPT_PATH = resolve(__dirname, '../../../fixtures/local-agent/mock-harness.mjs');
const PREVIEW_SCRIPT_PATH = resolve(__dirname, '../../../fixtures/local-agent/preview-server.mjs');

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

async function reservePort() {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Expected an ephemeral test port.');
  }

  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  return address.port;
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

test('Task 8 and Task 9: an example project exposes a reachable preview and a dummy prompt produces streamed logs with an exit code', async () => {
  const repositoryPath = await createTempRepository();
  const managedRoot = await createManagedWorktreeRoot();
  const previewPort = await reservePort();
  const previewUrl = `http://127.0.0.1:${previewPort}`;
  const sessionId = '61616161-6161-4611-8611-616161616161';
  const branchName = 'pairdock/session-6161';
  const sessionRunner = new SessionRunner(
    {
      projectPaths: {
        pairdock: repositoryPath,
      },
      previewConfigs: {
        pairdock: {
          sandbox: {
            startCommand: `node ${PREVIEW_SCRIPT_PATH} ${previewPort}`,
            healthcheckUrl: previewUrl,
          },
          tunnel: {
            publicUrl: previewUrl,
          },
          healthcheckIntervalMs: 100,
          healthcheckTimeoutMs: 5_000,
        },
      },
    },
    {
      worktreeService: new WorktreeService(managedRoot),
    },
  );
  const harnessAdapter = new CodexHarnessAdapter({
    pairdock: {
      command: 'node',
      args: [HARNESS_SCRIPT_PATH, '{{prompt}}', '{{modelId}}'],
    },
  });

  const workspace = await sessionRunner.prepare(buildPrepareCommand(sessionId, branchName));

  try {
    const previewResponse = await fetch(workspace.previewUrl ?? '');
    const previewBody = await previewResponse.text();

    assert.equal(previewResponse.status, 200);
    assert.equal(previewBody, `preview:${await realpath(workspace.worktreePath)}`);

    const events = await collectEvents(
      harnessAdapter.runPrompt({
        sessionId,
        projectKey: workspace.projectKey,
        prompt: 'ship-it',
        modelId: 'codex-cli/gpt-5.4',
        worktreePath: workspace.worktreePath,
      }),
    );

    assert.deepEqual(events, [
      {
        type: 'output',
        stream: 'stdout',
        text: 'prompt:ship-it\n',
      },
      {
        type: 'output',
        stream: 'stderr',
        text: 'model:codex-cli/gpt-5.4\n',
      },
      {
        type: 'done',
        exitCode: 0,
      },
    ]);
  } finally {
    await sessionRunner.close(buildCloseCommand(sessionId));
  }

  await assert.rejects(() => access(workspace.worktreePath));
});

async function execGit(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd });
  return stdout.trim();
}
