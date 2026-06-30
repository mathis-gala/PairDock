import assert from 'node:assert/strict';
import { mkdtemp, readFile, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import test from 'node:test';
import {
  type AgentHarnessEvent,
  CodexHarnessAdapter,
} from '../../../../packages/local-agent/src/harness/codex-harness.adapter.js';

const HARNESS_SCRIPT_PATH = resolve(__dirname, '../../../fixtures/local-agent/mock-harness.mjs');

async function createTempWorkspace() {
  return mkdtemp(join(tmpdir(), 'pairdock-harness-'));
}

async function collectEvents(iterable: AsyncIterable<AgentHarnessEvent>): Promise<AgentHarnessEvent[]> {
  const events: AgentHarnessEvent[] = [];

  for await (const event of iterable) {
    events.push(event);
  }

  return events;
}

test('BT-018: CodexHarnessAdapter runs the agent harness inside the session worktree', async () => {
  const worktreePath = await createTempWorkspace();
  const cwdMarkerPath = join(worktreePath, 'harness-cwd.txt');
  const adapter = new CodexHarnessAdapter({
    pairdock: {
      command: 'node',
      args: [HARNESS_SCRIPT_PATH, '{{prompt}}', '{{modelId}}'],
    },
  });

  const events = await collectEvents(
    adapter.runPrompt({
      sessionId: '10101010-1010-4010-8010-101010101010',
      projectKey: 'pairdock',
      prompt: `record-cwd:${basename(cwdMarkerPath)}`,
      modelId: 'codex-cli/gpt-5.4',
      worktreePath,
    }),
  );

  assert.equal(await readFile(cwdMarkerPath, 'utf8'), await realpath(worktreePath));
  assert.deepEqual(events.at(-1), { type: 'done', exitCode: 0 });
});

test('BT-019: CodexHarnessAdapter streams stdout and stderr before the process completes', async () => {
  const worktreePath = await createTempWorkspace();
  const adapter = new CodexHarnessAdapter({
    pairdock: {
      command: 'node',
      args: [HARNESS_SCRIPT_PATH, '{{prompt}}', '{{modelId}}'],
    },
  });

  const iterator = adapter
    .runPrompt({
      sessionId: '20202020-2020-4020-8020-202020202020',
      projectKey: 'pairdock',
      prompt: 'stream-output',
      modelId: 'codex-cli/gpt-5.4',
      worktreePath,
    })
    [Symbol.asyncIterator]();

  const startedAt = Date.now();
  const first = await iterator.next();
  const firstLatencyMs = Date.now() - startedAt;

  assert.equal(first.done, false);
  assert.deepEqual(first.value, {
    type: 'output',
    stream: 'stdout',
    text: 'stdout:first chunk\n',
  });
  assert.ok(
    firstLatencyMs < 200,
    `Expected first chunk before process completion, received after ${firstLatencyMs}ms.`,
  );

  const second = await iterator.next();
  assert.equal(second.done, false);
  assert.deepEqual(second.value, {
    type: 'output',
    stream: 'stderr',
    text: 'stderr:second chunk\n',
  });

  const third = await iterator.next();
  assert.equal(third.done, false);
  assert.deepEqual(third.value, { type: 'done', exitCode: 0 });
});

test('BT-020: CodexHarnessAdapter.cancel stops the active process and emits a final done event', async () => {
  const worktreePath = await createTempWorkspace();
  const sessionId = '30303030-3030-4030-8030-303030303030';
  const adapter = new CodexHarnessAdapter({
    pairdock: {
      command: 'node',
      args: [HARNESS_SCRIPT_PATH, '{{prompt}}', '{{modelId}}'],
    },
  });

  const iterator = adapter
    .runPrompt({
      sessionId,
      projectKey: 'pairdock',
      prompt: 'wait-for-cancel',
      modelId: 'codex-cli/gpt-5.4',
      worktreePath,
    })
    [Symbol.asyncIterator]();

  const first = await iterator.next();
  assert.equal(first.done, false);
  assert.deepEqual(first.value, {
    type: 'output',
    stream: 'stdout',
    text: 'stdout:started\n',
  });

  await adapter.cancel(sessionId);

  const events: AgentHarnessEvent[] = [];
  for await (const event of { [Symbol.asyncIterator]: () => iterator }) {
    events.push(event);
    if (event.type === 'done') {
      break;
    }
  }

  assert.deepEqual(events.at(-1), { type: 'done', exitCode: 130 });
});
