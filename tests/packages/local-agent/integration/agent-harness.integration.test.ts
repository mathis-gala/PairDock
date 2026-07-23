import assert from 'node:assert/strict';
import { mkdtemp, readFile, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import test from 'node:test';
import {
  type AgentHarnessEvent,
  buildCommandArgs,
  buildHarnessEnvironment,
  CodexHarnessAdapter,
  parseCodexJsonLine,
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
      args: [HARNESS_SCRIPT_PATH, '{{prompt}}', '{{modelId}}', '{{reasoningEffort}}'],
    },
  });

  const events = await collectEvents(
    adapter.runPrompt({
      sessionId: '10101010-1010-4010-8010-101010101010',
      projectKey: 'pairdock',
      prompt: `record-cwd:${basename(cwdMarkerPath)}`,
      modelId: 'codex-cli/gpt-5.4',
      reasoningEffort: 'high',
      worktreePath,
    }),
  );

  assert.equal(await readFile(cwdMarkerPath, 'utf8'), await realpath(worktreePath));
  assert.deepEqual(events.at(-1), { type: 'done', exitCode: 0 });
});

test('CodexHarnessAdapter forwards the selected reasoning effort to the configured harness', async () => {
  const worktreePath = await createTempWorkspace();
  const adapter = new CodexHarnessAdapter({
    pairdock: {
      command: 'node',
      args: [HARNESS_SCRIPT_PATH, '{{prompt}}', '{{modelId}}', '{{reasoningEffort}}'],
    },
  });

  const events = await collectEvents(
    adapter.runPrompt({
      sessionId: '11111111-1111-4111-8111-111111111111',
      projectKey: 'pairdock',
      prompt: 'explain-selection',
      modelId: 'gpt-5.6-sol',
      reasoningEffort: 'xhigh',
      worktreePath,
    }),
  );

  assert.ok(
    events.some(
      (event) => event.type === 'output' && event.stream === 'stderr' && event.text.includes('reasoning:xhigh'),
    ),
  );
});

test('default Codex harness starts and resumes one Codex thread per PairDock session', () => {
  const input = {
    sessionId: '11111111-1111-4111-8111-111111111111',
    projectKey: 'pairdock',
    prompt: 'Continue le correctif.',
    modelId: 'gpt-5.6-luna',
    reasoningEffort: 'low',
    worktreePath: '/tmp/worktree',
  };
  const expectedPrompt = [
    'PairDock runtime: the project preview and configured validation commands run inside Docker.',
    'Do not install dependencies or run build, test, or lint commands on the host worktree. Host and container operating systems may differ.',
    'Inspect and edit the worktree normally. PairDock runs the configured build, test, and lint checks inside Docker after this turn and automatically returns failures for repair.',
    'User request:\nContinue le correctif.',
  ].join('\n\n');

  assert.deepEqual(buildCommandArgs({}, input), [
    'exec',
    '--ignore-user-config',
    '--config',
    'approval_policy="never"',
    '--config',
    'default_permissions="pairdock-restricted"',
    '--config',
    'permissions.pairdock-restricted.filesystem={":minimal"="read","/tmp/pairdock/11111111-1111-4111-8111-111111111111"="write","/System/Library/OpenSSL"="read","~/.agents/skills"="read","~/.codex/skills"="read",":workspace_roots"={"."="write","**/.env"="deny","**/.env.local"="deny","**/.env.*.local"="deny","**/.npmrc"="deny","**/.netrc"="deny","**/.pypirc"="deny","**/*.pem"="deny","**/*.key"="deny","**/*.p12"="deny","**/*.pfx"="deny"}}',
    '--config',
    'permissions.pairdock-restricted.network.enabled=false',
    '--config',
    'shell_environment_policy.set={GIT_CONFIG_GLOBAL="/dev/null",GIT_CONFIG_NOSYSTEM="1",TMPDIR="/tmp/pairdock/11111111-1111-4111-8111-111111111111",XDG_CACHE_HOME="/tmp/pairdock/11111111-1111-4111-8111-111111111111/cache",XDG_CONFIG_HOME="/tmp/pairdock/11111111-1111-4111-8111-111111111111/config",XDG_DATA_HOME="/tmp/pairdock/11111111-1111-4111-8111-111111111111/data"}',
    '--json',
    '--model',
    'gpt-5.6-luna',
    '--config',
    'model_reasoning_effort="low"',
    expectedPrompt,
  ]);
  assert.deepEqual(buildCommandArgs({}, input, 'codex-thread-id'), [
    'exec',
    '--ignore-user-config',
    '--config',
    'approval_policy="never"',
    '--config',
    'default_permissions="pairdock-restricted"',
    '--config',
    'permissions.pairdock-restricted.filesystem={":minimal"="read","/tmp/pairdock/11111111-1111-4111-8111-111111111111"="write","/System/Library/OpenSSL"="read","~/.agents/skills"="read","~/.codex/skills"="read",":workspace_roots"={"."="write","**/.env"="deny","**/.env.local"="deny","**/.env.*.local"="deny","**/.npmrc"="deny","**/.netrc"="deny","**/.pypirc"="deny","**/*.pem"="deny","**/*.key"="deny","**/*.p12"="deny","**/*.pfx"="deny"}}',
    '--config',
    'permissions.pairdock-restricted.network.enabled=false',
    '--config',
    'shell_environment_policy.set={GIT_CONFIG_GLOBAL="/dev/null",GIT_CONFIG_NOSYSTEM="1",TMPDIR="/tmp/pairdock/11111111-1111-4111-8111-111111111111",XDG_CACHE_HOME="/tmp/pairdock/11111111-1111-4111-8111-111111111111/cache",XDG_CONFIG_HOME="/tmp/pairdock/11111111-1111-4111-8111-111111111111/config",XDG_DATA_HOME="/tmp/pairdock/11111111-1111-4111-8111-111111111111/data"}',
    'resume',
    '--json',
    '--model',
    'gpt-5.6-luna',
    '--config',
    'model_reasoning_effort="low"',
    'codex-thread-id',
    expectedPrompt,
  ]);
  assert.deepEqual(parseCodexJsonLine('{"type":"thread.started","thread_id":"thread-1"}'), {
    type: 'thread',
    threadId: 'thread-1',
  });
  assert.deepEqual(
    parseCodexJsonLine('{"type":"item.completed","item":{"type":"agent_message","text":"Correction terminée."}}'),
    { type: 'message', text: 'Correction terminée.' },
  );
});

test('default Codex harness delegates dependency installation and validation to the Docker sandbox', () => {
  const args = buildCommandArgs(
    {},
    {
      sessionId: '12121212-1212-4212-8212-121212121212',
      projectKey: 'pairdock',
      prompt: 'Implement the requested change.',
      modelId: 'gpt-5.6-sol',
      reasoningEffort: 'high',
      worktreePath: '/tmp/worktree',
    },
  );
  const prompt = args.at(-1) ?? '';

  assert.match(prompt, /Do not install dependencies/i);
  assert.match(prompt, /PairDock runs the configured build, test, and lint checks inside Docker/i);
  assert.match(prompt, /Implement the requested change\./);
});

test('Codex harness does not expose unrelated developer secrets to the agent process', () => {
  const environment = buildHarnessEnvironment(
    {
      HOME: '/Users/developer',
      PATH: '/usr/bin',
      AWS_SECRET_ACCESS_KEY: 'must-not-leak',
      DATABASE_URL: 'postgresql://user:password@localhost/database',
      GITHUB_TOKEN: 'must-not-leak',
      OPENAI_API_KEY: 'must-not-leak',
    },
    {
      sessionId: '11111111-1111-4111-8111-111111111111',
      projectKey: 'pairdock',
      prompt: 'Implement the feature.',
      modelId: 'gpt-5.6-sol',
      reasoningEffort: 'low',
      worktreePath: '/tmp/worktree',
    },
  );

  assert.equal(environment.HOME, '/Users/developer');
  assert.equal(environment.PATH, '/usr/bin');
  assert.equal(environment.TMPDIR, '/tmp/pairdock/11111111-1111-4111-8111-111111111111');
  assert.equal(environment.XDG_CACHE_HOME, `${environment.TMPDIR}/cache`);
  assert.equal(environment.XDG_CONFIG_HOME, `${environment.TMPDIR}/config`);
  assert.equal(environment.XDG_DATA_HOME, `${environment.TMPDIR}/data`);
  assert.equal(environment.GIT_CONFIG_GLOBAL, '/dev/null');
  assert.equal(environment.GIT_CONFIG_NOSYSTEM, '1');
  assert.equal(environment.PAIRDOCK_SESSION_ID, '11111111-1111-4111-8111-111111111111');
  assert.equal(environment.AWS_SECRET_ACCESS_KEY, undefined);
  assert.equal(environment.DATABASE_URL, undefined);
  assert.equal(environment.GITHUB_TOKEN, undefined);
  assert.equal(environment.OPENAI_API_KEY, undefined);
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
