import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { access, chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { PromptAttachmentDownloader } from '../../../../packages/local-agent/src/attachments/prompt-attachment-downloader.js';
import type { ChecksResult } from '../../../../packages/local-agent/src/checks/checks-runner.js';
import type { RunPromptInput } from '../../../../packages/local-agent/src/harness/agent-harness.port.js';
import {
  CodexHarnessAdapter,
  resolveHarnessTempDirectory,
} from '../../../../packages/local-agent/src/harness/codex-harness.adapter.js';
import { type PromptExecutionEvent, PromptRunner } from '../../../../packages/local-agent/src/session/prompt-runner.js';
import { resolveSessionTempDirectory } from '../../../../packages/local-agent/src/session/session-temp-directory.js';

const input = {
  sessionId: '11111111-1111-4111-8111-111111111111',
  projectKey: 'pairdock',
  prompt: 'Fix the preview.',
  modelId: 'codex-cli/test-model',
  worktreePath: '/unused/in-memory-worktree',
  previewUrl: 'https://preview.example.test',
};

function validationResult(failed: boolean): ChecksResult {
  const result: ChecksResult = {
    ok: !failed,
    build: { status: 'passed' },
    tests: { status: 'passed' },
    lint: { status: 'passed' },
    preview: { status: 'passed' },
  };
  if (failed) {
    result.tests = {
      status: 'failed',
      command: 'bun test --token=super-secret',
      logs: 'Assertion failed\nBearer secret-value',
    };
  }
  return result;
}

test('PromptRunner bounds repairs and publishes the final validation without a transport', async () => {
  let revision = 0;
  let checksRun = 0;
  let cleaned = 0;
  const prompts: RunPromptInput[] = [];
  const events: PromptExecutionEvent[] = [];
  const runner = new PromptRunner({
    harness: {
      async *runPrompt(prompt) {
        prompts.push(prompt);
        revision += 1;
        yield { type: 'output', stream: 'stdout', text: 'Bearer harness-secret' };
        yield { type: 'done', exitCode: 0 };
      },
      async cancel() {},
    },
    diff: {
      async snapshot() {
        return { changedFiles: [], fingerprint: String(revision) };
      },
      async collect() {
        return { changedFiles: ['README.md'], fingerprint: String(revision), diff: `revision ${revision}` };
      },
    },
    checks: {
      async run() {
        checksRun += 1;
        return validationResult(true);
      },
    },
    attachments: {
      async download() {
        return [];
      },
      async cleanup() {
        cleaned += 1;
      },
    },
    async publish(event) {
      events.push(event);
    },
    logger: { info() {}, warn() {}, error() {} },
  });

  await runner.run(input);

  assert.equal(prompts.length, 3);
  assert.equal(checksRun, 3);
  assert.equal(cleaned, 1);
  assert.match(prompts[1]?.prompt ?? '', /automatic repair 1\/2/);
  assert.match(prompts[2]?.prompt ?? '', /automatic repair 2\/2/);
  assert.match(prompts[1]?.prompt ?? '', /Bearer \[REDACTED\]/);
  assert.doesNotMatch(JSON.stringify(events), /harness-secret|secret-value|super-secret/);
  assert.deepEqual(
    events.map((event) => event.type),
    [
      'session.progress',
      'agent.output',
      'agent.done',
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
});

test('PromptRunner keeps downloaded screenshots through real harness cleanup and resumed repair', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'pairdock-prompt-screenshots-'));
  t.after(() => rm(directory, { force: true, recursive: true }));
  const sessionId = randomUUID();
  t.after(() => rm(resolveSessionTempDirectory(sessionId), { force: true, recursive: true }));
  const executablePath = join(directory, 'codex');
  const body = Buffer.from('test screenshot');
  const attachmentId = randomUUID();
  const events: PromptExecutionEvent[] = [];
  const fetchImplementation: typeof fetch = async () => new Response(body);
  const attachments = new PromptAttachmentDownloader('http://attachments.example.test', undefined, fetchImplementation);
  await writeFile(
    executablePath,
    [
      `#!${process.execPath}`,
      "const { appendFileSync, readFileSync, writeFileSync } = require('node:fs');",
      "const { join } = require('node:path');",
      'const args = process.argv.slice(2);',
      "const imagePath = args[args.indexOf('--image') + 1];",
      "const image = readFileSync(imagePath, 'utf8');",
      "const resumed = args[1] === 'resume';",
      "appendFileSync('turns.jsonl', JSON.stringify({ imagePath, image, resumed }) + '\\n');",
      "writeFileSync('revision.txt', resumed ? 'repaired' : 'initial change');",
      "writeFileSync(join(process.env.TMPDIR, 'scratch.txt'), 'temporary harness state');",
      "console.log(JSON.stringify({ type: 'thread.started', thread_id: 'screenshot-repair-thread' }));",
    ].join('\n'),
  );
  await chmod(executablePath, 0o700);
  let checksRun = 0;
  const runner = new PromptRunner({
    harness: new CodexHarnessAdapter({ pairdock: { command: executablePath } }),
    diff: {
      async snapshot() {
        return { changedFiles: [], fingerprint: 'original' };
      },
      async collect() {
        const revision = await readFile(join(directory, 'revision.txt'), 'utf8');
        return { changedFiles: ['revision.txt'], fingerprint: revision, diff: revision };
      },
    },
    checks: {
      async run() {
        checksRun += 1;
        await assert.rejects(access(resolveHarnessTempDirectory(sessionId)), { code: 'ENOENT' });
        return validationResult(checksRun === 1);
      },
    },
    attachments,
    async publish(event) {
      events.push(event);
    },
    logger: { info() {}, warn() {}, error() {} },
  });

  await runner.run({
    ...input,
    sessionId,
    worktreePath: directory,
    attachments: [{ id: attachmentId, fileName: 'capture.png', mimeType: 'image/png', byteSize: body.byteLength }],
  });

  assert.equal(checksRun, 2);
  const turns = (await readFile(join(directory, 'turns.jsonl'), 'utf8'))
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  assert.equal(turns.length, 2);
  assert.deepEqual(
    turns.map(({ image, resumed }) => ({ image, resumed })),
    [
      { image: 'test screenshot', resumed: false },
      { image: 'test screenshot', resumed: true },
    ],
  );
  assert.equal(turns[0].imagePath, turns[1].imagePath);
  await assert.rejects(access(turns[0].imagePath), { code: 'ENOENT' });
  assert.equal(events.at(-1)?.type, 'checks.result');
});
