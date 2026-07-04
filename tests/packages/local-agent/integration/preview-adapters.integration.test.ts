import assert from 'node:assert/strict';
import { access, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { DockerSandboxAdapter } from '../../../../packages/local-agent/src/docker/docker-sandbox.adapter.js';
import { CloudflarePreviewTunnelAdapter } from '../../../../packages/local-agent/src/tunnel/cloudflare-preview-tunnel.adapter.js';

async function createTempWorkspace() {
  return mkdtemp(join(tmpdir(), 'pairdock-preview-'));
}

test('Task 8: DockerSandboxAdapter runs the stop command in the session worktree', async () => {
  const worktreePath = await createTempWorkspace();
  const stopMarkerPath = join(worktreePath, 'sandbox-stopped.txt');
  const adapter = new DockerSandboxAdapter();

  const sandboxRef = await adapter.start({
    sessionId: '99999999-9999-4999-8999-999999999999',
    projectKey: 'pairdock',
    repositoryPath: worktreePath,
    worktreePath,
    branchName: 'pairdock/session-9999',
    modelId: 'codex-cli/gpt-5.4',
    previewConfig: {
      sandbox: {
        startCommand: `exec node -e "setInterval(() => {}, 1000)"`,
        stopCommand: `node -e "require('node:fs').writeFileSync('sandbox-stopped.txt', 'done')"`,
        healthcheckUrl: 'http://127.0.0.1:3100/health',
      },
    },
  });

  await adapter.stop(sandboxRef, {
    sandbox: {
      startCommand: `exec node -e "setInterval(() => {}, 1000)"`,
      stopCommand: `node -e "require('node:fs').writeFileSync('sandbox-stopped.txt', 'done')"`,
      healthcheckUrl: 'http://127.0.0.1:3100/health',
    },
  });

  await access(stopMarkerPath);
  assert.equal(await readFile(stopMarkerPath, 'utf8'), 'done');
});

test('Task 8: CloudflarePreviewTunnelAdapter runs the close command in the session worktree', async () => {
  const worktreePath = await createTempWorkspace();
  const closeMarkerPath = join(worktreePath, 'tunnel-closed.txt');
  const adapter = new CloudflarePreviewTunnelAdapter();

  const tunnelRef = await adapter.open({
    sessionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    projectKey: 'pairdock',
    localUrl: 'http://127.0.0.1:3100/health',
    worktreePath,
    previewConfig: {
      tunnel: {
        startCommand: `exec node -e "console.log('https://pairdock.trycloudflare.com'); setInterval(() => {}, 1000)"`,
        closeCommand: `node -e "require('node:fs').writeFileSync('tunnel-closed.txt', 'done')"`,
      },
    },
  });

  assert.equal(tunnelRef.publicUrl, 'https://pairdock.trycloudflare.com');

  await adapter.close(tunnelRef, {
    tunnel: {
      startCommand: `exec node -e "console.log('https://pairdock.trycloudflare.com'); setInterval(() => {}, 1000)"`,
      closeCommand: `node -e "require('node:fs').writeFileSync('tunnel-closed.txt', 'done')"`,
    },
  });

  await access(closeMarkerPath);
  assert.equal(await readFile(closeMarkerPath, 'utf8'), 'done');
});
