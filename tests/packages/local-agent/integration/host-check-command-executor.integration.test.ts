import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { HostCheckCommandExecutor } from '../../../../packages/local-agent/src/checks/host-check-command-executor.js';

test('HostCheckCommandExecutor runs validation in the session worktree without forwarding agent secrets', async () => {
  const spawnCalls: Array<{
    command: string;
    args: string[];
    cwd?: string;
    detached?: boolean;
    env?: NodeJS.ProcessEnv;
    shell?: boolean;
    stdio?: ['ignore', 'pipe', 'pipe'];
  }> = [];
  const executor = new HostCheckCommandExecutor({
    environment: {
      HOME: '/Users/developer',
      PAIRDOCK_AGENT_TOKEN: 'must-not-leak',
      PATH: '/opt/homebrew/bin:/usr/bin',
    },
    spawn(command, args, options) {
      spawnCalls.push({ command, args, ...options });
      const childProcess = createCommandProcess();
      queueMicrotask(() => {
        childProcess.stdout.emit('data', 'typecheck passed');
        childProcess.exitCode = 0;
        childProcess.emit('close', 0, null);
      });
      return childProcess as never;
    },
  });

  const result = await executor.run({
    command: 'bun run build',
    sessionId: '99999999-9999-4999-8999-999999999999',
    worktreePath: '/tmp/pairdock-session',
  });

  assert.deepEqual(spawnCalls, [
    {
      command: 'sh',
      args: ['-c', 'bun run build'],
      cwd: '/tmp/pairdock-session',
      detached: true,
      env: {
        HOME: '/Users/developer',
        PAIRDOCK_SESSION_ID: '99999999-9999-4999-8999-999999999999',
        PATH: '/opt/homebrew/bin:/usr/bin',
      },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  ]);
  assert.equal(result.exitCode, 0);
  assert.match(result.logs, /typecheck passed/);
});

test('HostCheckCommandExecutor does not reload secrets from the developer login profile', async () => {
  const workspacePath = await mkdtemp(join(tmpdir(), 'pairdock-host-check-profile-'));
  const fakeHome = join(workspacePath, 'home');
  await mkdir(fakeHome);
  await writeFile(join(fakeHome, '.profile'), 'export PAIRDOCK_PROFILE_SECRET=profile-secret\n');
  const executor = new HostCheckCommandExecutor({
    environment: {
      HOME: fakeHome,
      PATH: process.env.PATH,
    },
  });

  const result = await executor.run({
    command: `printf "%s" "\${PAIRDOCK_PROFILE_SECRET:-}"`,
    sessionId: 'profile-session',
    worktreePath: workspacePath,
  });

  assert.equal(result.exitCode, 0);
  assert.equal(result.logs, '');
});

test('HostCheckCommandExecutor terminates the complete process group after its timeout', async () => {
  const childProcess = createCommandProcess(7654);
  const terminatedProcessGroups: number[] = [];
  const executor = new HostCheckCommandExecutor({
    timeoutMs: 1,
    spawn(_command, _args, options) {
      assert.equal(options.detached, true);
      setTimeout(() => childProcess.emit('close', null, 'SIGTERM'), 10);
      return childProcess as never;
    },
    async terminateProcessGroup(pid) {
      terminatedProcessGroups.push(pid);
      childProcess.emit('close', null, 'SIGTERM');
    },
  });

  const result = await executor.run({
    command: 'bun run build',
    sessionId: '88888888-8888-4888-8888-888888888888',
    worktreePath: '/tmp/pairdock-session',
  });

  assert.deepEqual(terminatedProcessGroups, [7654]);
  assert.equal(result.exitCode, 130);
  assert.match(result.logs, /timed out after 1ms/);
});

function createCommandProcess(pid = 4321) {
  return Object.assign(new EventEmitter(), {
    exitCode: null as number | null,
    pid,
    stderr: new EventEmitter(),
    stdout: new EventEmitter(),
    kill() {
      return true;
    },
  });
}
