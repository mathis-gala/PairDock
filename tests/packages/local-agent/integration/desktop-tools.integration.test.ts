import assert from 'node:assert/strict';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import {
  discoverDesktopCodexModels,
  inspectDesktopTools,
  loginDesktopCodex,
} from '../../../../packages/local-agent/src/desktop/desktop-tools.js';
import { runBoundedCommand } from '../../../../packages/local-agent/src/process/bounded-command.js';

test('Codex discovery, version checks, and login preserve local account settings without inheriting API keys', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pairdock-codex-environment-'));
  const command = join(directory, 'codex.mjs');
  const codexHome = join(directory, 'codex-home');
  await writeFile(
    command,
    `#!${process.execPath}
import { createInterface } from 'node:readline';
if (process.env.OPENAI_API_KEY !== undefined || process.env.UNRELATED_SECRET !== undefined) process.exit(11);
if (process.env.HOME !== ${JSON.stringify(directory)} || process.env.CODEX_HOME !== ${JSON.stringify(codexHome)}) process.exit(12);
if (!process.env.PATH || process.env.LANG !== 'en_US.UTF-8' || process.env.SSL_CERT_FILE !== '/test-only/cert.pem') process.exit(13);
if (process.argv[2] === '--version') { console.log('codex-cli 0.155.1'); process.exit(0); }
if (process.argv[2] === 'login') process.exit(0);
createInterface({ input: process.stdin }).on('line', line => {
  const request = JSON.parse(line);
  if (request.method === 'initialize') console.log(JSON.stringify({ id: request.id, result: {} }));
  if (request.method === 'model/list') console.log(JSON.stringify({ id: request.id, result: {
    data: [{ model: 'test-model', displayName: 'Test model', hidden: false, defaultReasoningEffort: 'medium', supportedReasoningEfforts: [] }],
    nextCursor: null,
  } }));
});
`,
  );
  await chmod(command, 0o700);
  const desktopModule = pathToFileURL(
    resolve(__dirname, '../../../../packages/local-agent/src/desktop/desktop-tools.ts'),
  ).href;
  const catalogModule = pathToFileURL(
    resolve(__dirname, '../../../../packages/local-agent/src/config/codex-model-catalog.ts'),
  ).href;
  try {
    const result = await runBoundedCommand(
      process.execPath,
      [
        '--import',
        'tsx',
        '--input-type=module',
        '-e',
        `
      import { discoverDesktopCodexModels, loginDesktopCodex } from ${JSON.stringify(desktopModule)};
      import { findBestCodexInstallation } from ${JSON.stringify(catalogModule)};
      const codexCommand = ${JSON.stringify(command)};
      const installed = await findBestCodexInstallation({ command: codexCommand });
      if (!installed) throw new Error('The safe environment version probe failed');
      await loginDesktopCodex({ codexCommand });
      await discoverDesktopCodexModels({ codexCommand });
      console.log('safe-environment-verified');
    `,
      ],
      10_000,
      undefined,
      {
        HOME: directory,
        CODEX_HOME: codexHome,
        PATH: process.env.PATH,
        LANG: 'en_US.UTF-8',
        SSL_CERT_FILE: '/test-only/cert.pem',
        OPENAI_API_KEY: 'test-only-api-key-marker',
        UNRELATED_SECRET: 'test-only-unrelated-marker',
      },
    );
    assert.match(result.stdout, /safe-environment-verified/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('cancelling desktop Codex login kills its launcher and native process immediately', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pairdock-codex-cancel-'));
  const command = join(directory, 'codex.mjs');
  const pidPath = join(directory, 'native-pid');
  const nativeScript = `require('node:fs').writeFileSync(${JSON.stringify(pidPath)}, String(process.pid)); setInterval(() => {}, 1000);`;
  await writeFile(
    command,
    `#!${process.execPath}
import { spawn } from 'node:child_process';
spawn(process.execPath, ['-e', ${JSON.stringify(nativeScript)}], { stdio: 'inherit' });
`,
  );
  await chmod(command, 0o700);
  const controller = new AbortController();
  const login = loginDesktopCodex({ codexCommand: command, signal: controller.signal });
  const failedLogin = assert.rejects(login, /Codex login did not complete/);
  try {
    let nativePid: number | undefined;
    for (let attempt = 0; attempt < 100 && !nativePid; attempt += 1) {
      try {
        nativePid = Number(await readFile(pidPath, 'utf8'));
      } catch (error) {
        if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
        await delay(20);
      }
    }
    assert.ok(nativePid, 'the fake native Codex process must start before cancellation');
    controller.abort();
    await failedLogin;
    assert.throws(() => process.kill(nativePid, 0), /ESRCH/);
  } finally {
    controller.abort();
    await failedLogin;
    await rm(directory, { recursive: true, force: true });
  }
});

test('desktop discovery also kills the native process started by a Codex npm launcher', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'pairdock-codex-launcher-'));
  const command = join(directory, 'codex.mjs');
  const pidPath = join(directory, 'native-pid');
  const nativeScript = `require('node:fs').writeFileSync(${JSON.stringify(pidPath)}, String(process.pid)); process.stdin.resume();`;
  await writeFile(
    command,
    `#!${process.execPath}
import { spawn } from 'node:child_process';
spawn(process.execPath, ['-e', ${JSON.stringify(nativeScript)}], { stdio: 'inherit' });
`,
  );
  await chmod(command, 0o700);
  let nativePid: number | undefined;
  context.after(async () => {
    if (nativePid) {
      try {
        process.kill(nativePid, 'SIGKILL');
      } catch (error) {
        if (!(error instanceof Error && 'code' in error && error.code === 'ESRCH')) throw error;
      }
    }
    await rm(directory, { recursive: true, force: true });
  });
  await assert.rejects(
    discoverDesktopCodexModels({ codexCommand: command, modelDiscoveryTimeoutMs: 1_000 }),
    /timed out/,
  );
  nativePid = Number(await readFile(pidPath, 'utf8'));
  assert.throws(() => process.kill(nativePid ?? 0, 0), /ESRCH/);
});

test('desktop inspection uses the bundled Codex executable and distinguishes missing login from unavailable Docker', async () => {
  const calls: Array<{ command: string; args: string[] }> = [];
  const tools = await inspectDesktopTools({
    codexCommand: '/Applications/PairDock.app/Contents/Resources/codex',
    runCommand: async (command, args) => {
      calls.push({ command, args });
      if (command === 'docker') throw new Error('Cannot connect to the Docker daemon');
      if (args[0] === 'login') throw new Error('Not logged in');
      return { stdout: command === 'git' ? 'git version 2.50.0' : 'codex-cli 0.155.1', stderr: '' };
    },
  });

  assert.equal(tools.git.available, true);
  assert.equal(tools.git.version, '2.50.0');
  assert.equal(tools.docker.available, false);
  assert.match(tools.docker.message, /Docker Desktop/);
  assert.equal(tools.codex.available, true);
  assert.equal(tools.codex.version, '0.155.1');
  assert.equal(tools.codex.authenticated, false);
  assert.deepEqual(
    calls.filter((call) => call.command.includes('codex')),
    [
      { command: '/Applications/PairDock.app/Contents/Resources/codex', args: ['--version'] },
      { command: '/Applications/PairDock.app/Contents/Resources/codex', args: ['login', 'status'] },
    ],
  );
});

test('desktop login uses the selected executable and reports unsuccessful login without exposing CLI output', async () => {
  const calls: Array<{ command: string; args: string[]; timeoutMs: number }> = [];
  await assert.rejects(
    loginDesktopCodex({
      codexCommand: '/bundled/codex',
      runCommand: async (command, args, timeoutMs) => {
        calls.push({ command, args, timeoutMs });
        throw new Error('login failed with private authentication details');
      },
    }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /Codex login did not complete/);
      assert.doesNotMatch(error.message, /private authentication details/);
      return true;
    },
  );
  assert.deepEqual(calls, [{ command: '/bundled/codex', args: ['login'], timeoutMs: 300_000 }]);
});

test('desktop model discovery initializes Codex and reads every catalog page without requiring a cache', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pairdock-codex-catalog-'));
  const command = join(directory, 'fake codex.mjs');
  const pidPath = join(directory, 'pid');
  await writeFile(
    command,
    `#!${process.execPath}
import { writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
writeFileSync(${JSON.stringify(pidPath)}, String(process.pid));
let initialized = false;
const model = (model, hidden = false) => ({
  id: model + '-picker', model, displayName: model.toUpperCase(), hidden,
  defaultReasoningEffort: 'high', supportedReasoningEfforts: [{ reasoningEffort: 'high', description: 'More reasoning' }],
});

createInterface({ input: process.stdin }).on('line', line => {
  const request = JSON.parse(line);
  if (request.method === 'initialize') {
    process.stdout.write(JSON.stringify({ id: request.id, result: { userAgent: 'fake Codex' } }) + '\\n');
  } else if (request.method === 'initialized') {
    initialized = true;
  } else if (request.method === 'model/list' && initialized) {
    const result = request.params.cursor
      ? { data: [model('model-two')], nextCursor: null }
      : { data: [model('model-one'), model('hidden-model', true)], nextCursor: 'page-two' };
    process.stdout.write(JSON.stringify({ method: 'harmless/notification', params: {} }) + '\\n');
    process.stdout.write(JSON.stringify({ id: request.id, result }) + '\\n');
  } else {
    process.exit(2);
  }
});
`,
  );
  await chmod(command, 0o700);
  try {
    const models = await discoverDesktopCodexModels({ codexCommand: command });
    assert.deepEqual(
      models,
      ['model-one', 'model-two'].map((id) => ({
        id,
        label: id.toUpperCase(),
        provider: 'codex',
        defaultReasoningEffort: 'high',
        reasoningEfforts: [{ id: 'high', label: 'High', description: 'More reasoning' }],
      })),
    );
    const pid = Number(await readFile(pidPath, 'utf8'));
    assert.throws(() => process.kill(pid, 0), /ESRCH/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

for (const scenario of [
  { name: 'empty catalog', response: { result: { data: [], nextCursor: null } }, expected: /no available models/ },
  {
    name: 'malformed catalog',
    response: { result: { data: [{ model: 'private-output' }] } },
    expected: /invalid model catalog/,
  },
  {
    name: 'CLI rejection',
    response: { error: { code: -32000, message: 'private-output' } },
    expected: /could not load its model catalog/,
  },
]) {
  test(`desktop discovery reports ${scenario.name} without exposing raw Codex output`, async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pairdock-codex-failure-'));
    const command = join(directory, 'codex.mjs');
    await writeFile(
      command,
      `#!${process.execPath}
import { createInterface } from 'node:readline';
createInterface({ input: process.stdin }).on('line', line => {
  const request = JSON.parse(line);
  if (request.method === 'initialize') {
    process.stdout.write(JSON.stringify({ id: request.id, result: {} }) + '\\n');
  } else if (request.method === 'model/list') {
    process.stdout.write(JSON.stringify({ id: request.id, ...${JSON.stringify(scenario.response)} }) + '\\n');
  }
});
`,
    );
    await chmod(command, 0o700);
    try {
      await assert.rejects(discoverDesktopCodexModels({ codexCommand: command }), (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, scenario.expected);
        assert.doesNotMatch(error.message, /private-output/);
        return true;
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
}

test('desktop discovery kills an unresponsive Codex process when its deadline expires', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pairdock-codex-timeout-'));
  const command = join(directory, 'codex.mjs');
  const pidPath = join(directory, 'pid');
  await writeFile(
    command,
    `#!${process.execPath}
import { writeFileSync } from 'node:fs';
writeFileSync(${JSON.stringify(pidPath)}, String(process.pid));
process.stdin.resume();
`,
  );
  await chmod(command, 0o700);
  try {
    await assert.rejects(
      discoverDesktopCodexModels({ codexCommand: command, modelDiscoveryTimeoutMs: 1_000 }),
      /timed out/,
    );
    const pid = Number(await readFile(pidPath, 'utf8'));
    assert.throws(() => process.kill(pid, 0), /ESRCH/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
