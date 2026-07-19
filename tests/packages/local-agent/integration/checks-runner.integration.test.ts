import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { ChecksRunner } from '../../../../packages/local-agent/src/checks/checks-runner.js';

async function createPreviewServer() {
  const server = createServer((_request, response) => {
    response.statusCode = 200;
    response.end('preview-ok');
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Expected an ephemeral preview port.');
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

test('Task 11: ChecksRunner executes configured build, test, lint, and preview validations', async () => {
  const previewServer = await createPreviewServer();
  const executedCommands: Array<{ command: string; sessionId: string }> = [];
  const runner = new ChecksRunner(
    {
      pairdock: {
        build: 'bun run build',
        test: 'bun test',
        lint: 'bun run lint',
      },
    },
    async (input) => {
      executedCommands.push({ command: input.command, sessionId: input.sessionId });
      return input.command === 'bun test'
        ? { exitCode: 1, logs: 'tests failed' }
        : { exitCode: 0, logs: `${input.command} ok` };
    },
  );

  try {
    const result = await runner.run({
      projectKey: 'pairdock',
      previewUrl: previewServer.url,
      sessionId: '11111111-1111-4111-8111-111111111111',
    });

    assert.equal(result.ok, false);
    assert.equal(result.build.status, 'passed');
    assert.equal(result.tests.status, 'failed');
    assert.equal(result.lint.status, 'passed');
    assert.equal(result.preview.status, 'passed');
    assert.equal(result.build.command, 'bun run build');
    assert.match(result.tests.logs ?? '', /tests failed/);
    assert.deepEqual(executedCommands, [
      { command: 'bun run build', sessionId: '11111111-1111-4111-8111-111111111111' },
      { command: 'bun test', sessionId: '11111111-1111-4111-8111-111111111111' },
      { command: 'bun run lint', sessionId: '11111111-1111-4111-8111-111111111111' },
    ]);
  } finally {
    await previewServer.close();
  }
});

test('ChecksRunner retries once when Bun fails to extract a dependency tarball', async () => {
  let attempt = 0;
  const runner = new ChecksRunner(
    {
      pairdock: {
        build: 'bun run build',
      },
    },
    async () => {
      attempt += 1;
      return attempt === 1
        ? { exitCode: 1, logs: 'error: Fail extracting tarball for "@prisma/client"' }
        : { exitCode: 0, logs: 'build ok' };
    },
  );

  const result = await runner.run({
    projectKey: 'pairdock',
    previewUrl: null,
    sessionId: '22222222-2222-4222-8222-222222222222',
  });

  assert.equal(result.build.status, 'passed');
  assert.match(result.build.logs ?? '', /Retry 1\/1 after a transient package extraction failure/);
  assert.equal(attempt, 2);
});
