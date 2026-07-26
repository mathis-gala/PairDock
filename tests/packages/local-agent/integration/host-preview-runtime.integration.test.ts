import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { HostPreviewRuntimeAdapter } from '../../../../packages/local-agent/src/preview/host-preview-runtime.adapter.js';

test('HostPreviewRuntimeAdapter starts a session preview in its worktree on a dedicated port', async () => {
  const worktreePath = await mkdtemp(join(tmpdir(), 'pairdock-host-preview-'));
  const spawnCalls: Array<{
    command: string;
    args: string[];
    cwd?: string;
    detached?: boolean;
    env?: NodeJS.ProcessEnv;
    shell?: boolean;
  }> = [];
  const previewProcess = createRunningProcess(4321);
  const adapter = new HostPreviewRuntimeAdapter({
    allocateHostPort: async () => 45123,
    spawn(command, args, options) {
      spawnCalls.push({ command, args, ...options });
      return previewProcess as never;
    },
  });

  const runtimeRef = await adapter.start({
    sessionId: '99999999-9999-4999-8999-999999999999',
    projectKey: 'pairdock',
    repositoryPath: worktreePath,
    worktreePath,
    branchName: 'pairdock/session-9999',
    modelId: 'agent/gpt-5',
    previewConfig: {
      runtime: 'host',
      sandbox: {
        startCommand: 'bun run dev -- --port {{hostPort}}',
        healthcheckUrl: 'http://127.0.0.1:{{hostPort}}',
        env: {
          APP_ORIGIN: 'http://127.0.0.1:{{hostPort}}',
        },
      },
      tunnel: {
        publicUrl: 'http://127.0.0.1:{{hostPort}}',
      },
    },
  });

  assert.equal(spawnCalls.length, 1);
  assert.equal(spawnCalls[0]?.command, 'sh');
  assert.deepEqual(spawnCalls[0]?.args, ['-c', 'bun run dev -- --port 45123']);
  assert.equal(spawnCalls[0]?.cwd, worktreePath);
  assert.equal(spawnCalls[0]?.detached, true);
  assert.equal(spawnCalls[0]?.shell, false);
  assert.equal(spawnCalls[0]?.env?.PAIRDOCK_SESSION_ID, '99999999-9999-4999-8999-999999999999');
  assert.equal(spawnCalls[0]?.env?.PAIRDOCK_PREVIEW_PORT, '45123');
  assert.equal(spawnCalls[0]?.env?.APP_ORIGIN, 'http://127.0.0.1:45123');
  assert.equal(runtimeRef.healthcheckUrl, 'http://127.0.0.1:45123');
  assert.equal(runtimeRef.previewConfig?.tunnel?.publicUrl, 'http://127.0.0.1:45123');
  assert.equal(runtimeRef.metadata?.type, 'host');
  assert.equal(runtimeRef.metadata?.pid, '4321');
});

test('HostPreviewRuntimeAdapter does not reload secrets from the developer login profile', async () => {
  const worktreePath = await mkdtemp(join(tmpdir(), 'pairdock-host-preview-profile-'));
  const fakeHome = join(worktreePath, 'home');
  await mkdir(fakeHome);
  await writeFile(join(fakeHome, '.profile'), 'export PAIRDOCK_PROFILE_SECRET=profile-secret\n');
  const adapter = new HostPreviewRuntimeAdapter({
    spawn(command, args, options) {
      return spawn(command, args, {
        ...options,
        env: {
          ...options.env,
          HOME: fakeHome,
        },
      });
    },
  });
  const runtimeRef = await adapter.start({
    sessionId: '91919191-9191-4191-8191-919191919191',
    projectKey: 'pairdock',
    repositoryPath: worktreePath,
    worktreePath,
    branchName: 'pairdock/session-9191',
    modelId: 'agent/gpt-5',
    previewConfig: {
      runtime: 'host',
      sandbox: {
        startCommand: `printf "%s" "\${PAIRDOCK_PROFILE_SECRET:-}" >&2`,
        healthcheckUrl: 'http://127.0.0.1:4000',
      },
    },
  });

  await delay(50);
  const result = await adapter.check(runtimeRef);

  assert.doesNotMatch(result.message ?? '', /profile-secret/);
});

test('HostPreviewRuntimeAdapter stops the complete preview process group', async () => {
  const worktreePath = await mkdtemp(join(tmpdir(), 'pairdock-host-preview-'));
  const terminatedProcessGroups: number[] = [];
  const adapter = new HostPreviewRuntimeAdapter({
    spawn() {
      return createRunningProcess(5432) as never;
    },
    async terminateProcessGroup(pid) {
      terminatedProcessGroups.push(pid);
    },
  });
  const runtimeRef = await adapter.start({
    sessionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    projectKey: 'pairdock',
    repositoryPath: worktreePath,
    worktreePath,
    branchName: 'pairdock/session-aaaa',
    modelId: 'agent/gpt-5',
    previewConfig: {
      runtime: 'host',
      sandbox: {
        startCommand: 'bun run dev',
        healthcheckUrl: 'http://127.0.0.1:4000',
      },
    },
  });

  await adapter.stop(runtimeRef);

  assert.deepEqual(terminatedProcessGroups, [5432]);
});

test('HostPreviewRuntimeAdapter reports an exited preview instead of accepting a stale healthcheck', async () => {
  const worktreePath = await mkdtemp(join(tmpdir(), 'pairdock-host-preview-'));
  const previewProcess = createRunningProcess(6543);
  const adapter = new HostPreviewRuntimeAdapter({
    fetch: async () => new Response('ok'),
    spawn() {
      return previewProcess as never;
    },
  });
  const runtimeRef = await adapter.start({
    sessionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    projectKey: 'pairdock',
    repositoryPath: worktreePath,
    worktreePath,
    branchName: 'pairdock/session-bbbb',
    modelId: 'agent/gpt-5',
    previewConfig: {
      runtime: 'host',
      sandbox: {
        startCommand: 'bun run dev',
        healthcheckUrl: 'http://127.0.0.1:4000',
      },
    },
  });
  previewProcess.exitCode = 1;
  previewProcess.emit('exit', 1);

  const result = await adapter.check(runtimeRef);

  assert.equal(result.ready, false);
  assert.match(result.message ?? '', /exited with code 1/i);
});

test('HostPreviewRuntimeAdapter reports preview spawn errors without crashing the agent', async () => {
  const worktreePath = await mkdtemp(join(tmpdir(), 'pairdock-host-preview-'));
  const previewProcess = createRunningProcess(7654);
  const adapter = new HostPreviewRuntimeAdapter({
    spawn() {
      return previewProcess as never;
    },
  });
  const runtimeRef = await adapter.start({
    sessionId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    projectKey: 'pairdock',
    repositoryPath: worktreePath,
    worktreePath,
    branchName: 'pairdock/session-cccc',
    modelId: 'agent/gpt-5',
    previewConfig: {
      runtime: 'host',
      sandbox: {
        startCommand: 'bun run dev',
        healthcheckUrl: 'http://127.0.0.1:4000',
      },
    },
  });

  previewProcess.emit('error', new Error('spawn failed'));
  const result = await adapter.check(runtimeRef);

  assert.equal(result.ready, false);
  assert.match(result.message ?? '', /spawn failed/);
});

interface FakeRunningProcess extends EventEmitter {
  exitCode: number | null;
  killed: boolean;
  pid: number;
  stderr: EventEmitter;
  stdout: EventEmitter;
}

function createRunningProcess(pid: number): FakeRunningProcess {
  return Object.assign(new EventEmitter(), {
    exitCode: null as number | null,
    killed: false,
    pid,
    stderr: new EventEmitter(),
    stdout: new EventEmitter(),
  });
}
