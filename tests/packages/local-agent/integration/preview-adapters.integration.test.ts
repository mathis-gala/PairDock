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

test('V1: DockerSandboxAdapter resolves a dedicated host preview port for each session', async () => {
  const worktreePath = await createTempWorkspace();
  const spawnCalls: Array<{ command: string; args: string[] }> = [];
  const adapter = new DockerSandboxAdapter({
    allocateHostPort: async () => 45123,
    spawn(command, args) {
      spawnCalls.push({ command, args });
      return createRunningProcess() as never;
    },
  });

  const sandboxRef = await adapter.start({
    sessionId: '99999999-9999-4999-8999-999999999999',
    projectKey: 'pairdock',
    repositoryPath: worktreePath,
    worktreePath,
    branchName: 'pairdock/session-9999',
    modelId: 'agent/gpt-5',
    previewConfig: {
      sandbox: {
        image: 'oven/bun:1',
        ports: ['127.0.0.1:{{hostPort}}:4000'],
        startCommand: 'bun dev --port 4000',
        healthcheckUrl: 'http://127.0.0.1:{{hostPort}}',
      },
      tunnel: {
        publicUrl: 'http://127.0.0.1:{{hostPort}}',
      },
    },
  });

  assert.ok(spawnCalls[0]?.args.includes('127.0.0.1:45123:4000'));
  assert.equal(sandboxRef.healthcheckUrl, 'http://127.0.0.1:45123');
  assert.equal(sandboxRef.previewConfig?.tunnel?.publicUrl, 'http://127.0.0.1:45123');
});

test('V1: DockerSandboxAdapter never accepts a stale healthcheck after its container exited', async () => {
  const worktreePath = await createTempWorkspace();
  const process = createRunningProcess();
  const adapter = new DockerSandboxAdapter({
    spawn() {
      return process as never;
    },
  });
  const sandboxRef = await adapter.start({
    sessionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    projectKey: 'pairdock',
    repositoryPath: worktreePath,
    worktreePath,
    branchName: 'pairdock/session-aaaa',
    modelId: 'agent/gpt-5',
    previewConfig: {
      sandbox: {
        ports: ['127.0.0.1:4000:4000'],
        startCommand: 'bun dev --port 4000',
        healthcheckUrl: 'http://127.0.0.1:4000',
      },
    },
  });

  process.exitCode = 125;
  process.emit('exit', 125);
  const result = await adapter.check(sandboxRef);

  assert.equal(result.ready, false);
  assert.match(result.message ?? '', /exited with code 125/i);
});

test('DockerSandboxAdapter stops a restored container without its original child process', async () => {
  const spawnCalls: Array<{ command: string; args: string[] }> = [];
  const adapter = new DockerSandboxAdapter({
    spawn(command, args) {
      spawnCalls.push({ command, args });
      const process = createRunningProcess();
      queueMicrotask(() => {
        process.exitCode = 0;
        process.emit('exit', 0);
      });
      return process as never;
    },
  });

  await adapter.stop({
    id: 'restored-sandbox',
    sessionId: 'abababab-abab-4bab-8bab-abababababab',
    healthcheckUrl: 'http://127.0.0.1:4100',
    metadata: {
      type: 'docker',
      containerName: 'pairdock-abababababab4bab8bababab',
    },
  });

  assert.deepEqual(spawnCalls, [
    {
      command: 'docker',
      args: ['stop', 'pairdock-abababababab4bab8bababab'],
    },
  ]);
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
    'docker run --rm --name pairdock-tunnel-bbbbbbbbbbbb4bbb8bbbbbbb --add-host host.docker.internal:host-gateway cloudflare/cloudflared:latest tunnel --url http://host.docker.internal:3100',
  );
  assert.equal(tunnelRef.publicUrl, 'https://pairdock-default.trycloudflare.com');
  assert.equal(tunnelRef.metadata?.containerName, 'pairdock-tunnel-bbbbbbbbbbbb4bbb8bbbbbbb');
});

test('CloudflarePreviewTunnelAdapter stops a restored tunnel container', async () => {
  const commands: string[] = [];
  const adapter = new CloudflarePreviewTunnelAdapter({
    spawn(command) {
      commands.push(command);
      const process = createRunningProcess();
      queueMicrotask(() => {
        process.exitCode = 0;
        process.emit('exit', 0);
      });
      return process as never;
    },
  });

  await adapter.close({
    id: 'restored-tunnel',
    sessionId: 'bcbcbcbc-bcbc-4cbc-8cbc-bcbcbcbcbcbc',
    publicUrl: 'https://pairdock-restored.trycloudflare.com',
    metadata: {
      type: 'docker',
      containerName: 'pairdock-tunnel-bcbcbcbcbcbc4cbc8cbcbcbc',
    },
  });

  assert.deepEqual(commands, ['docker stop pairdock-tunnel-bcbcbcbcbcbc4cbc8cbcbcbc']);
});

interface FakeRunningProcess extends EventEmitter {
  killed: boolean;
  exitCode: number | null;
  stderr: EventEmitter;
  stdout: EventEmitter;
  kill(signal?: NodeJS.Signals): boolean;
}

function createRunningProcess(): FakeRunningProcess {
  const process = Object.assign(new EventEmitter(), {
    killed: false,
    exitCode: null as number | null,
    stderr: new EventEmitter(),
    stdout: new EventEmitter(),
    kill(signal?: NodeJS.Signals) {
      void signal;
      process.killed = true;
      process.exitCode = 0;
      process.emit('exit', 0);
      return true;
    },
  });

  return process;
}
