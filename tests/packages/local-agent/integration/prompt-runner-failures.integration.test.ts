import assert from 'node:assert/strict';
import test from 'node:test';
import type { ChecksResult } from '../../../../packages/local-agent/src/checks/checks-runner.js';
import type { AgentHarnessPort } from '../../../../packages/local-agent/src/harness/agent-harness.port.js';
import {
  type PromptExecutionEvent,
  type PromptExecutionInput,
  PromptRunner,
} from '../../../../packages/local-agent/src/session/prompt-runner.js';

const input: PromptExecutionInput = {
  sessionId: '11111111-1111-4111-8111-111111111111',
  projectKey: 'pairdock',
  prompt: 'Fix the preview.',
  modelId: 'codex-cli/test-model',
  worktreePath: '/unused/in-memory-worktree',
};

function createPromptFixture() {
  const events: PromptExecutionEvent[] = [];
  const operations: string[] = [];
  const warnings: string[] = [];
  const initialFingerprint = 'existing-local-changes';
  let fingerprint = initialFingerprint;
  let runs = 0;
  const harness: AgentHarnessPort = {
    async *runPrompt() {
      operations.push('harness');
      runs += 1;
      fingerprint = runs === 1 ? 'prompt-change' : initialFingerprint;
      yield { type: 'output', stream: 'stdout', text: 'Working on the preview.' };
      yield { type: 'done', exitCode: 0 };
    },
    async cancel(sessionId) {
      operations.push(`cancel:${sessionId}`);
    },
  };
  const dependencies = {
    harness,
    diff: {
      async snapshot() {
        operations.push('snapshot');
        return { changedFiles: ['README.md'], fingerprint };
      },
      async collect() {
        operations.push('collect');
        return { changedFiles: ['README.md'], fingerprint, diff: `README: ${fingerprint}` };
      },
    },
    checks: {
      async run(): Promise<ChecksResult> {
        operations.push('checks');
        return {
          ok: false,
          build: { status: 'passed' },
          tests: { status: 'failed', logs: 'The preview does not match.' },
          lint: { status: 'passed' },
          preview: { status: 'passed' },
        };
      },
    },
    attachments: {
      async download() {
        operations.push('download');
        return ['/unused/preview.png'];
      },
      async cleanup(sessionId: string) {
        operations.push(`cleanup:${sessionId}`);
      },
    },
    async publish(event: PromptExecutionEvent) {
      operations.push(`publish:${event.type}`);
      events.push(event);
    },
    logger: {
      info() {},
      warn(message: string) {
        warnings.push(message);
      },
      error() {},
    },
  };

  return { runner: new PromptRunner(dependencies), dependencies, events, operations, warnings };
}

test('PromptRunner refuses to inspect or edit a worktree when running-state publication is rejected', async () => {
  const fixture = createPromptFixture();
  const rejection = new Error('The Session cannot enter AGENT_RUNNING.');
  fixture.dependencies.publish = async (event) => {
    fixture.events.push(event);
    throw rejection;
  };

  await assert.rejects(fixture.runner.run(input), (error) => error === rejection);

  assert.deepEqual(
    fixture.events.map((event) => event.type),
    ['session.progress'],
  );
  assert.deepEqual(fixture.operations, []);
});

test('PromptRunner preserves output-publication rejection while cancelling and cleaning the same Session', async () => {
  const fixture = createPromptFixture();
  const rejection = new Error('The Session stream is unavailable.');
  const publish = fixture.dependencies.publish;
  fixture.dependencies.publish = async (event) => {
    await publish(event);
    if (event.type === 'agent.output') {
      throw rejection;
    }
  };
  fixture.dependencies.harness.cancel = async (sessionId) => {
    fixture.operations.push(`cancel:${sessionId}`);
    throw new Error('Cancellation also failed.');
  };
  fixture.dependencies.attachments.cleanup = async (sessionId) => {
    fixture.operations.push(`cleanup:${sessionId}`);
    throw new Error('Cleanup also failed.');
  };

  await assert.rejects(fixture.runner.run(input), (error) => error === rejection);

  assert.deepEqual(fixture.operations, [
    'publish:session.progress',
    'snapshot',
    'download',
    'harness',
    'publish:agent.output',
    `cancel:${input.sessionId}`,
    `cleanup:${input.sessionId}`,
  ]);
  assert.equal(fixture.warnings.length, 2);
});

test('PromptRunner surfaces the original harness failure for its Adapter after cleanup', async () => {
  const fixture = createPromptFixture();
  const failure = new Error('The harness process terminated unexpectedly.');
  fixture.dependencies.harness.runPrompt = async function* () {
    yield { type: 'output', stream: 'stderr', text: 'The process is exiting.' };
    throw failure;
  };

  await assert.rejects(fixture.runner.run(input), (error) => error === failure);

  assert.deepEqual(fixture.operations, [
    'publish:session.progress',
    'snapshot',
    'download',
    'publish:agent.output',
    `cancel:${input.sessionId}`,
    `cleanup:${input.sessionId}`,
  ]);
  assert.deepEqual(
    fixture.events.map((event) => event.type),
    ['session.progress', 'agent.output'],
  );
});

test('PromptRunner discards stale validation when repair restores the initial dirty worktree', async () => {
  const fixture = createPromptFixture();

  await fixture.runner.run(input);

  assert.deepEqual(
    fixture.events.map((event) => event.type),
    ['session.progress', 'agent.output', 'agent.done', 'session.progress', 'agent.output', 'agent.done'],
  );
  assert.deepEqual(
    fixture.events.filter((event) => event.type === 'agent.done').map((event) => event.payload.changesDetected),
    [true, false],
  );
  assert.equal(fixture.operations.filter((operation) => operation === 'checks').length, 1);
  assert.equal(fixture.operations.filter((operation) => operation.startsWith('cleanup:')).length, 1);
  assert.equal(fixture.operations.at(-1), `cleanup:${input.sessionId}`);
});
