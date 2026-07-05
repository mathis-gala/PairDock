import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { DockerSandboxAdapter } from '../../../../packages/local-agent/src/docker/docker-sandbox.adapter.js';
import { CloudflarePreviewTunnelAdapter } from '../../../../packages/local-agent/src/tunnel/cloudflare-preview-tunnel.adapter.js';

async function createTempWorkspace() {
  return mkdtemp(join(tmpdir(), 'pairdock-preview-'));
}

test('V1: DockerSandboxAdapter runs preview inside docker with explicit host DB access', async () => {
  const worktreePath = await createTempWorkspace();
  const spawnCalls: Array<{ command: string; args: string[]; cwd?: string; shell?: boolean }> = [];
  const adapter = new DockerSandboxAdapter({
    spawn(command, args, options) {
      spawnCalls.push({
        command,
        args,
        cwd: options?.cwd,
        shell: options?.shell,
      });

      const process = new EventEmitter() as EventEmitter & {
        killed: boolean;
        exitCode: number | null;
        kill(signal?: NodeJS.Signals): boolean;
      };
      Object.assign(process, {
        killed: false,
        exitCode: null as number | null,
        kill(signal?: NodeJS.Signals) {
          void signal;
          process.killed = true;
          process.exitCode = 0;
          process.emit('exit', 0);
          return true;
        },
      });

      queueMicrotask(() => process.emit('exit', 0));
      return process as never;
    },
  });

  const sandboxRef = await adapter.start({
    sessionId: '88888888-8888-4888-8888-888888888888',
    projectKey: 'pairdock',
    repositoryPath: worktreePath,
    worktreePath,
    branchName: 'pairdock/session-8888',
    modelId: 'agent/gpt-5',
    previewConfig: {
      sandbox: {
        image: 'oven/bun:1',
        workdir: '/workspace',
        network: 'host-services',
        env: {
          DATABASE_URL: 'postgresql://postgres:pairdockdev@host.docker.internal:55432/pairdock',
        },
        ports: ['127.0.0.1:4000:4000'],
        startCommand: 'bun --cwd apps/web dev --host 0.0.0.0 --port 4000',
        healthcheckUrl: 'http://127.0.0.1:4000',
      },
    },
  });

  assert.equal(spawnCalls[0]?.command, 'docker');
  assert.deepEqual(spawnCalls[0]?.args, [
    'run',
    '--rm',
    '--name',
    'pairdock-888888888888488888888888',
    '--workdir',
    '/workspace',
    '--volume',
    `${worktreePath}:/workspace`,
    '--publish',
    '127.0.0.1:4000:4000',
    '--add-host',
    'host.docker.internal:host-gateway',
    '--env',
    'DATABASE_URL=postgresql://postgres:pairdockdev@host.docker.internal:55432/pairdock',
    'oven/bun:1',
    'sh',
    '-lc',
    'bun --cwd apps/web dev --host 0.0.0.0 --port 4000',
  ]);
  assert.equal(sandboxRef.metadata?.type, 'docker');

  await adapter.stop(sandboxRef, {
    sandbox: {
      startCommand: 'bun --cwd apps/web dev --host 0.0.0.0 --port 4000',
      healthcheckUrl: 'http://127.0.0.1:4000',
    },
  });

  assert.deepEqual(spawnCalls[1]?.args, ['stop', 'pairdock-888888888888488888888888']);
});

test('Task 8: CloudflarePreviewTunnelAdapter uses Docker cloudflared for the local URL', async () => {
  const worktreePath = await createTempWorkspace();
  let capturedCommand = '';
  const adapter = new CloudflarePreviewTunnelAdapter({
    spawn(command, _options) {
      capturedCommand = command;
      const process = Object.assign(new EventEmitter(), {
        killed: false,
        exitCode: null as number | null,
        stderr: null,
        stdout: null,
        kill(signal?: NodeJS.Signals) {
          void signal;
          process.killed = true;
          process.exitCode = 0;
          process.emit('exit', 0);
          return true;
        },
      });

      return process;
    },
    waitForPublicUrl: async () => 'https://pairdock-default.trycloudflare.com',
  });

  const tunnelRef = await adapter.open({
    sessionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    projectKey: 'pairdock',
    localUrl: 'http://127.0.0.1:3100',
    worktreePath,
    previewConfig: {},
  });

  assert.equal(
    capturedCommand,
    'docker run --rm --add-host host.docker.internal:host-gateway cloudflare/cloudflared:latest tunnel --url http://host.docker.internal:3100',
  );
  assert.equal(tunnelRef.publicUrl, 'https://pairdock-default.trycloudflare.com');
});
