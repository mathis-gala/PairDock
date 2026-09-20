import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { DesktopAgentManager } from '../../../../packages/local-agent/src/desktop/desktop-agent-manager.js';
import type { StartAgentRuntimeInput } from '../../../../packages/local-agent/src/runtime/agent-runtime.js';

test('desktop pairing keeps credentials out of snapshots and persists only an encrypted private profile', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pairdock-desktop-'));
  const token = 'private-agent-token-'.repeat(3);
  const deviceCode = 'D'.repeat(43);
  const requests: Array<{ url: string; body: unknown }> = [];
  const options = {
    profileDirectory: directory,
    encrypt: (text: string) => Buffer.from(text).toString('base64'),
    decrypt: (text: string) => Buffer.from(text, 'base64').toString(),
    now: () => Date.parse('2026-09-20T12:00:00Z'),
    fetch: async (url: string, init?: RequestInit) => {
      requests.push({ url, body: JSON.parse(String(init?.body)) });
      return Response.json(
        url.endsWith('/claim')
          ? {
              status: 'paired',
              agentId: 'agent-desktop',
              authToken: token,
              projectKeyPrefix: 'agent-desktop-',
              ownerName: 'Developer',
            }
          : {
              deviceCode,
              userCode: 'ABCD-EFGH',
              verificationUrl: 'https://pairdock.test/#/developer/agents?code=ABCD-EFGH',
              expiresAt: '2026-09-20T12:10:00Z',
              intervalSeconds: 5,
            },
      );
    },
  };
  try {
    const manager = new DesktopAgentManager(options);
    assert.equal(manager.getSnapshot().initialized, false);
    assert.equal((await manager.initialize()).initialized, true);
    const pending = await manager.beginPairing({ backendUrl: 'https://api.pairdock.test', deviceName: 'My Mac' });
    assert.equal(pending.pairing?.userCode, 'ABCD-EFGH');
    assert.doesNotMatch(JSON.stringify(pending), new RegExp(deviceCode));
    const paired = await manager.pollPairing();
    assert.equal(paired.connection?.agentId, 'agent-desktop');
    assert.equal(paired.pairing, null);
    assert.ok(!JSON.stringify(paired).includes(token));
    assert.deepEqual(requests[1], { url: 'https://api.pairdock.test/agent-pairings/claim', body: { deviceCode } });
    const profilePath = join(directory, 'profile.json');
    assert.ok(!(await readFile(profilePath, 'utf8')).includes(token));
    assert.equal((await stat(profilePath)).mode & 0o777, 0o600);
    const restored = await new DesktopAgentManager(options).initialize();
    assert.equal(restored.connection?.agentId, 'agent-desktop');
    assert.ok(!JSON.stringify(restored).includes(token));
    let keychainLocked = true;
    const recovering = new DesktopAgentManager({
      ...options,
      decrypt: (ciphertext) => {
        if (keychainLocked) throw new Error('System keychain is locked.');
        return options.decrypt(ciphertext);
      },
    });
    const savedProfile = await readFile(profilePath, 'utf8');
    await assert.rejects(recovering.initialize(), /profile could not be unlocked/);
    assert.equal(recovering.getSnapshot().initialized, false);
    await assert.rejects(
      recovering.beginPairing({ backendUrl: 'https://api.pairdock.test', deviceName: 'Mac' }),
      /Initialize/,
    );
    assert.equal(await readFile(profilePath, 'utf8'), savedProfile);
    keychainLocked = false;
    const unlocked = await recovering.initialize();
    assert.equal(unlocked.initialized, true);
    assert.equal(unlocked.connection?.agentId, 'agent-desktop');
    assert.equal(unlocked.error, null);
    assert.ok(!JSON.stringify(unlocked).includes(token));
    await assert.rejects(manager.beginPairing({ backendUrl: 'http://remote.test', deviceName: 'Mac' }), /HTTPS/);
    assert.equal(requests.length, 2);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('desktop setup starts one runtime with server-scoped project keys and preserves sessions when stopping', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pairdock-desktop-runtime-'));
  const repository = join(directory, 'repository');
  const run = promisify(execFile);
  await run('git', ['init', '--initial-branch=main', repository]);
  await run('git', ['remote', 'add', 'origin', 'https://github.com/example/site.git'], { cwd: repository });
  await writeFile(
    join(repository, 'package.json'),
    JSON.stringify({
      scripts: {
        dev: 'vite',
        build: 'vite build',
        test: 'vitest run',
        lint: 'eslint .',
      },
    }),
  );
  const started: StartAgentRuntimeInput[] = [];
  const stopped: boolean[] = [];
  let refuseStop = false;
  let claims = 0;
  const options = {
    profileDirectory: join(directory, 'profile'),
    encrypt: (text: string) => Buffer.from(text).toString('base64'),
    decrypt: (text: string) => Buffer.from(text, 'base64').toString(),
    codexCommand: '/Applications/PairDock Agent.app/Contents/Resources/codex',
    runCommand: async (command: string, args: string[]) => ({
      stdout: command === 'git' ? 'git version 2.50.0' : args[0] === '--version' ? 'codex-cli 0.155.1' : 'available',
      stderr: '',
    }),
    discoverModels: async () => [{ id: 'available-model', label: 'Available model', provider: 'codex' }],
    fetch: async (url: string) => {
      if (url.endsWith('/claim')) {
        claims += 1;
        return Response.json({
          status: 'paired',
          agentId: claims === 1 ? 'desktop-agent' : 'replacement-agent',
          authToken: 'private-token-'.repeat(4),
          projectKeyPrefix: claims === 1 ? 'agent-assigned-' : 'replacement-',
          ownerName: 'Developer',
        });
      }
      return Response.json({
        deviceCode: 'D'.repeat(43),
        userCode: 'ABCD-EFGH',
        verificationUrl: 'https://pairdock.test/#/developer/agents',
        expiresAt: new Date(Date.now() + 600_000).toISOString(),
        intervalSeconds: 5,
      });
    },
    startRuntime: async (input: StartAgentRuntimeInput) => {
      started.push(input);
      input.onStatus?.({ status: 'online', busy: false });
      return {
        stop: async ({ cleanupSessions }: { cleanupSessions: boolean }) => {
          if (refuseStop) throw new Error('Agent work is still running.');
          stopped.push(cleanupSessions);
        },
      };
    },
  };
  try {
    const manager = new DesktopAgentManager(options);
    await manager.initialize();
    await manager.beginPairing({ backendUrl: 'https://api.pairdock.test', deviceName: 'Mac' });
    await manager.pollPairing();
    const draft = await manager.inspectProject(repository);
    const configured = await manager.saveProject(draft);
    assert.match(configured.projects[0].key, /^agent-assigned-/);
    assert.equal(configured.dockerRequired, true);
    const starts = await Promise.allSettled([manager.start(), manager.start()]);
    assert.equal(starts[0].status, 'fulfilled');
    assert.equal(starts[1].status, 'rejected');
    assert.equal(started.length, 1);
    const projectKey = configured.projects[0].key;
    assert.equal(started[0].config.agentHarnessConfigs?.[projectKey]?.command, options.codexCommand);
    assert.equal(started[0].config.projects[0].repoFullName, 'example/site');
    assert.equal(started[0].statePath, join(options.profileDirectory, 'sessions', 'desktop-agent.json'));
    assert.equal(started[0].preventStopWhileBusy, true);
    await assert.rejects(manager.saveProject(draft), /Stop the agent/);
    await assert.rejects(manager.removeProject(projectKey), /Stop the agent/);
    started[0].onStatus?.({
      status: 'error',
      busy: true,
      message: `Connection refused private-token-${'private-token-'.repeat(3)}`,
    });
    assert.equal(manager.getSnapshot().running, true);
    assert.ok(!manager.getSnapshot().error?.includes('private-token-'));
    refuseStop = true;
    await assert.rejects(manager.stop(), /work is still running/);
    assert.equal(manager.getSnapshot().running, true);
    await assert.rejects(manager.saveProject(draft), /Stop the agent/);
    refuseStop = false;
    await manager.stop();
    assert.deepEqual(stopped, [false]);
    assert.equal(manager.getSnapshot().status, 'stopped');
    started[0].onStatus?.({ status: 'online', busy: true });
    assert.equal(manager.getSnapshot().status, 'stopped');
    assert.equal(manager.getSnapshot().busy, false);
    const restored = await new DesktopAgentManager(options).initialize();
    assert.equal(restored.projects[0].key, projectKey);
    assert.equal(restored.status, 'stopped');
    await writeFile(
      join(repository, 'pairdock.yml'),
      [
        'version: 1',
        'preview:',
        '  start: npm run dev',
        '  healthcheck: http://127.0.0.1:{{hostPort}}',
        '  tunnel:',
        '    publicUrl: https://preview.example.test',
        'checks:',
        '  build: npm run build',
        '  test: npm test',
        '  lint: npm run lint',
      ].join('\n'),
    );
    const directPreview = await manager.saveProject(draft);
    assert.equal(directPreview.dockerRequired, false);
    await manager.beginPairing({ backendUrl: 'https://another-api.pairdock.test', deviceName: 'Mac' });
    await assert.rejects(manager.start(), /Finish or cancel pairing/);
    const replacement = await manager.pollPairing();
    assert.match(replacement.projects[0].key, /^replacement-/);
    assert.notEqual(replacement.projects[0].key, projectKey);
    await manager.start();
    assert.equal(started[1].statePath, join(options.profileDirectory, 'sessions', 'replacement-agent.json'));
    await manager.stop();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('stopping desktop setup cancels an unfinished Codex login before waiting for the operation queue', {
  timeout: 2_000,
}, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pairdock-desktop-login-'));
  let notifyStarted!: () => void;
  const started = new Promise<void>((resolve) => {
    notifyStarted = resolve;
  });
  let aborted = false;
  const manager = new DesktopAgentManager({
    profileDirectory: directory,
    encrypt: (text) => text,
    decrypt: (text) => text,
    codexCommand: '/bundled/codex',
    runCommand: async (_command, _args, _timeout, signal?: AbortSignal) =>
      new Promise((_resolve, reject) => {
        notifyStarted();
        signal?.addEventListener(
          'abort',
          () => {
            aborted = true;
            reject(new Error('cancelled'));
          },
          { once: true },
        );
      }),
  });
  try {
    await manager.initialize();
    const signingIn = manager.loginCodex();
    const rejectedLogin = assert.rejects(signingIn, /login did not complete/);
    await started;
    const stopped = await manager.stop();
    await rejectedLogin;
    assert.equal(aborted, true);
    assert.equal(stopped.status, 'stopped');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('desktop pairing can retry transient failures, respects polling intervals, and clears expired codes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pairdock-desktop-pairing-'));
  let now = Date.parse('2026-09-20T12:00:00Z');
  let attempts = 0;
  let pairingExpiredRemotely = false;
  const manager = new DesktopAgentManager({
    profileDirectory: directory,
    encrypt: (text) => text,
    decrypt: (text) => text,
    now: () => now,
    fetch: async (url) => {
      if (!url.endsWith('/claim'))
        return Response.json({
          deviceCode: 'S'.repeat(43),
          userCode: 'ABCD-EFGH',
          verificationUrl: 'https://pairdock.test/#/developer/agents',
          expiresAt: '2026-09-20T12:01:00Z',
          intervalSeconds: 5,
        });
      attempts += 1;
      if (attempts === 1) throw new Error('network interrupted');
      if (pairingExpiredRemotely) return Response.json({}, { status: 410 });
      return Response.json({ status: 'pending' });
    },
  });
  try {
    await manager.initialize();
    await manager.beginPairing({ backendUrl: 'https://api.pairdock.test', deviceName: 'Mac' });
    await assert.rejects(manager.pollPairing(), /could not be reached/);
    assert.equal(manager.getSnapshot().pairing?.userCode, 'ABCD-EFGH');
    await Promise.all([manager.pollPairing(), manager.pollPairing()]);
    assert.equal(attempts, 1);
    now += 5_000;
    await manager.pollPairing();
    assert.equal(attempts, 2);
    now += 60_000;
    await assert.rejects(manager.pollPairing(), /expired/);
    assert.equal(manager.getSnapshot().pairing, null);
    assert.equal(manager.getSnapshot().connection, null);
    now = Date.parse('2026-09-20T12:00:00Z');
    const restarted = await manager.beginPairing({ backendUrl: 'https://api.pairdock.test', deviceName: 'Mac' });
    assert.equal(restarted.error, null);
    assert.equal(restarted.pairing?.userCode, 'ABCD-EFGH');
    pairingExpiredRemotely = true;
    await assert.rejects(manager.pollPairing(), /no longer available/);
    assert.equal(manager.getSnapshot().pairing, null);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
