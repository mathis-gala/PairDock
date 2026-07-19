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
  const startArgs = spawnCalls[0]?.args ?? [];
  assert.ok(startArgs.includes('--read-only'));
  assert.ok(startArgs.includes('--cap-drop'));
  assert.ok(startArgs.includes('ALL'));
  assert.ok(startArgs.includes('--security-opt'));
  assert.ok(startArgs.includes('no-new-privileges'));
  assert.ok(startArgs.includes('--user'));
  assert.ok(startArgs.includes(`${process.getuid?.() ?? 1000}:${process.getgid?.() ?? 1000}`));
  assert.ok(startArgs.includes('--tmpfs'));
  assert.ok(startArgs.includes('/tmp:rw,nosuid,nodev'));
  assert.ok(startArgs.includes('HOME=/tmp'));
  assert.ok(startArgs.includes('127.0.0.1:4000:4000'));
  assert.ok(startArgs.includes('host.docker.internal:host-gateway'));
  assert.ok(startArgs.includes('DATABASE_URL=postgresql://postgres:pairdockdev@host.docker.internal:55432/pairdock'));
  assert.deepEqual(startArgs.slice(-4), [
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
  assert.deepEqual(
    spawnCalls[0]?.args.slice(
      (spawnCalls[0]?.args.indexOf('--network') ?? -2) + 1,
      (spawnCalls[0]?.args.indexOf('--network') ?? -2) + 2,
    ),
    ['none'],
  );
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

test('DockerSandboxAdapter executes validation commands in an ephemeral networkless container', async () => {
  const spawnCalls: Array<{ command: string; args: string[]; shell?: boolean }> = [];
  const adapter = new DockerSandboxAdapter({
    spawn(command, args, options) {
      spawnCalls.push({ command, args, shell: options.shell });
      const process = createRunningProcess();
      queueMicrotask(() => {
        process.stdout.emit('data', 'checks stayed in the sandbox');
        process.exitCode = 0;
        process.emit('close', 0, null);
      });
      return process as never;
    },
  });

  const result = await adapter.runCommand(
    {
      id: 'sandbox-for-checks',
      sessionId: 'acacacac-acac-4cac-8cac-acacacacacac',
      healthcheckUrl: 'http://127.0.0.1:4100',
      previewConfig: {
        sandbox: {
          image: 'oven/bun:1',
          workdir: '/workspace',
          startCommand: 'bun run dev',
          healthcheckUrl: 'http://127.0.0.1:4100',
        },
      },
      metadata: {
        type: 'docker',
        containerName: 'pairdock-acacacacacac4cac8cacacac',
      },
    },
    'bun test',
    '/tmp/pairdock-check-worktree',
  );

  assert.deepEqual(spawnCalls, [
    {
      command: 'docker',
      args: [
        'run',
        '--rm',
        '--init',
        '--read-only',
        '--cap-drop',
        'ALL',
        '--security-opt',
        'no-new-privileges',
        '--pids-limit',
        '512',
        '--user',
        `${process.getuid?.() ?? 1000}:${process.getgid?.() ?? 1000}`,
        '--tmpfs',
        '/tmp:rw,nosuid,nodev',
        '--network',
        'none',
        '--workdir',
        '/workspace',
        '--volume',
        '/tmp/pairdock-check-worktree:/workspace',
        '--env',
        'HOME=/tmp',
        'oven/bun:1',
        'sh',
        '-lc',
        'bun test',
      ],
      shell: false,
    },
  ]);
  assert.equal(result.exitCode, 0);
  assert.match(result.logs, /stayed in the sandbox/);
});

test('Task 8: CloudflarePreviewTunnelAdapter uses Docker cloudflared for the local URL', async () => {
  const worktreePath = await createTempWorkspace();
  const spawnCalls: Array<{ command: string; args: string[]; shell?: boolean }> = [];
  const adapter = new CloudflarePreviewTunnelAdapter({
    spawn(command, args, options) {
      spawnCalls.push({ command, args, shell: options.shell });
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

  assert.deepEqual(spawnCalls, [
    {
      command: 'docker',
      args: [
        'run',
        '--rm',
        '--name',
        'pairdock-tunnel-bbbbbbbbbbbb4bbb8bbbbbbb',
        '--add-host',
        'host.docker.internal:host-gateway',
        'cloudflare/cloudflared@sha256:4f6655284ab3d252b7f28fedb19fe6c8fc82ee5b1295c20ac74d475e5398a52d',
        'tunnel',
        '--url',
        'http://host.docker.internal:3100',
      ],
      shell: false,
    },
  ]);
  assert.equal(tunnelRef.publicUrl, 'https://pairdock-default.trycloudflare.com');
  assert.equal(tunnelRef.metadata?.containerName, 'pairdock-tunnel-bbbbbbbbbbbb4bbb8bbbbbbb');
});

test('CloudflarePreviewTunnelAdapter stops a restored tunnel container', async () => {
  const commands: Array<{ command: string; args: string[]; shell?: boolean }> = [];
  const adapter = new CloudflarePreviewTunnelAdapter({
    spawn(command, args, options) {
      commands.push({ command, args, shell: options.shell });
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

  assert.deepEqual(commands, [
    {
      command: 'docker',
      args: ['stop', 'pairdock-tunnel-bcbcbcbcbcbc4cbc8cbcbcbc'],
      shell: false,
    },
  ]);
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
