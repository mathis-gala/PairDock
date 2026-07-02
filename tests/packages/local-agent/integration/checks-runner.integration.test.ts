import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
  const worktreePath = await mkdtemp(join(tmpdir(), 'pairdock-checks-'));
  const previewServer = await createPreviewServer();
  const runner = new ChecksRunner({
    pairdock: {
      build: 'node -e "console.log(\'build ok\')"',
      test: 'node -e "process.stderr.write(\'tests failed\\n\'); process.exit(1)"',
      lint: 'node -e "console.log(\'lint ok\')"',
    },
  });

  try {
    const result = await runner.run({
      projectKey: 'pairdock',
      previewUrl: previewServer.url,
      worktreePath,
    });

    assert.equal(result.ok, false);
    assert.equal(result.build.status, 'passed');
    assert.equal(result.tests.status, 'failed');
    assert.equal(result.lint.status, 'passed');
    assert.equal(result.preview.status, 'passed');
    assert.equal(result.build.command, 'node -e "console.log(\'build ok\')"');
    assert.match(result.tests.logs ?? '', /tests failed/);
  } finally {
    await previewServer.close();
  }
});
