import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { type TestContext } from 'node:test';
import { promisify } from 'node:util';
import {
  inspectDesktopProject,
  loadDesktopProjectConfig,
} from '../../../../packages/local-agent/src/desktop/project-inspection.js';

const execFileAsync = promisify(execFile);

test('desktop inspection derives a Vite draft from the actual Git root without executing project scripts', async (t) => {
  const path = await createRepository(t);
  await writeFile(
    join(path, 'package.json'),
    JSON.stringify({
      name: 'web-app',
      packageManager: 'pnpm@10.0.0',
      scripts: { dev: 'vite', build: 'touch must-not-run', test: 'vitest run', lint: 'biome check .' },
    }),
  );
  await writeFile(join(path, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n');

  const draft = await inspectDesktopProject(path);

  assert.equal(draft.path, await realpath(path));
  assert.equal(draft.repoFullName, 'example/web-app');
  assert.equal(draft.name, 'web-app');
  assert.equal(draft.defaultBranch, 'main');
  assert.equal(draft.packageManager, 'pnpm');
  assert.equal(draft.setupCommand, 'pnpm install --frozen-lockfile');
  assert.equal(draft.previewCommand, 'pnpm run dev --host 127.0.0.1 --port {{hostPort}}');
  assert.equal(draft.healthcheckUrl, 'http://127.0.0.1:{{hostPort}}');
  assert.equal(draft.buildCommand, 'pnpm run build');
  assert.equal(draft.testCommand, 'pnpm run test');
  assert.equal(draft.lintCommand, 'pnpm run lint');
  assert.equal(draft.manifestStatus, 'missing');
  assert.deepEqual(draft.warnings, []);
  await assert.rejects(access(join(path, 'must-not-run')));
});

test('desktop inspection leaves unknown preview and missing check commands for the developer to configure', async (t) => {
  const path = await createRepository(t);
  await writeFile(
    join(path, 'package.json'),
    JSON.stringify({ scripts: { dev: 'node server.js', 'lint; bad': 'bad' } }),
  );

  const draft = await inspectDesktopProject(path);

  assert.equal(draft.previewCommand, '');
  assert.equal(draft.scripts.find((script) => script.name === 'dev')?.command, 'npm run dev');
  assert.equal(draft.healthcheckUrl, '');
  assert.equal(draft.buildCommand, '');
  assert.equal(draft.testCommand, '');
  assert.equal(draft.lintCommand, '');
  assert.ok(draft.warnings.some((warning) => warning.includes('preview')));
  assert.ok(draft.warnings.some((warning) => warning.includes('build')));
});

test('script choices run through the package manager, quote names, and preserve the preview port', async (t) => {
  const path = await createRepository(t);
  const specialName = "check'; touch unexpected-script; #";
  await writeFile(
    join(path, 'package.json'),
    JSON.stringify({ scripts: { dev: 'vite', [specialName]: 'echo safe', custom: 'node server.js' } }),
  );

  const draft = await inspectDesktopProject(path);
  assert.equal(draft.scripts.find((script) => script.name === 'dev')?.command, draft.previewCommand);
  assert.ok(draft.scripts.find((script) => script.name === 'dev')?.command.includes('{{hostPort}}'));
  assert.equal(draft.scripts.find((script) => script.name === 'custom')?.command, 'npm run custom');
  const selected = draft.scripts.find((script) => script.name === specialName);
  assert.ok(selected);
  const { stdout } = await execFileAsync('sh', ['-c', `set -- ${selected.command}; printf '%s\\n' "$@"`], {
    cwd: path,
  });
  assert.deepEqual(stdout.trim().split('\n'), ['npm', 'run', specialName]);
  await assert.rejects(access(join(path, 'unexpected-script')));
});

test('desktop configuration preserves a valid advanced manifest while deriving repository identity from Git', async (t) => {
  const path = await createRepository(t);
  await writeFile(join(path, 'package.json'), JSON.stringify({ scripts: { dev: 'vite' } }));
  await writeFile(
    join(path, 'pairdock.yml'),
    [
      'version: 1',
      'name: Existing app',
      'repoFullName: spoofed/identity',
      'defaultBranch: release',
      'models: [agent/gpt-5]',
      'setup: bun install',
      'sandbox:',
      '  image: oven/bun:1',
      '  workdir: /workspace/app',
      '  network: host-services',
      '  env: { NODE_ENV: development }',
      '  ports: ["127.0.0.1:{{hostPort}}:4000"]',
      'preview:',
      '  runtime: docker',
      '  prepare: bun install --frozen-lockfile',
      '  start: bun run dev',
      '  healthcheck: "http://127.0.0.1:{{hostPort}}"',
      '  healthcheckTimeoutMs: 60000',
      '  healthcheckIntervalMs: 750',
      '  tunnel: { provider: cloudflare, startupTimeoutMs: 15000 }',
      'checks:',
      '  build: bun run build',
      '  test: bun test',
      '  lint: bun run lint',
    ].join('\n'),
  );

  const draft = await inspectDesktopProject(path);
  assert.equal(draft.manifestStatus, 'valid');
  assert.equal(draft.name, 'Existing app');
  assert.equal(draft.repoFullName, 'example/web-app');
  assert.equal(draft.defaultBranch, 'release');
  assert.equal(draft.previewCommand, 'bun run dev');
  assert.equal(draft.scripts.find((script) => script.name === 'dev')?.command, 'bun run dev');
  assert.equal(draft.runtime, 'docker');
  assert.ok(draft.warnings.some((warning) => warning.includes('origin')));

  const config = await loadDesktopProjectConfig('project-1', {
    ...draft,
    repoFullName: 'another/spoof',
    name: 'Edited name',
    setupCommand: '',
    previewCommand: 'bun run preview',
    testCommand: 'bun run test:ci',
  });

  assert.equal(config.descriptor.key, 'project-1');
  assert.equal(config.descriptor.repoFullName, 'example/web-app');
  assert.equal(config.descriptor.name, 'Edited name');
  assert.deepEqual(config.descriptor.models, ['agent/gpt-5']);
  assert.equal(config.previewConfig.setupCommand, undefined);
  assert.equal(config.previewConfig.prepareCommand, 'bun install --frozen-lockfile');
  assert.deepEqual(config.previewConfig.sandbox, {
    startCommand: 'bun run preview',
    healthcheckUrl: 'http://127.0.0.1:{{hostPort}}',
    image: 'oven/bun:1',
    workdir: '/workspace/app',
    network: 'host-services',
    env: { NODE_ENV: 'development' },
    ports: ['127.0.0.1:{{hostPort}}:4000'],
  });
  assert.equal(config.previewConfig.healthcheckTimeoutMs, 60000);
  assert.equal(config.previewConfig.healthcheckIntervalMs, 750);
  assert.deepEqual(config.previewConfig.tunnel, { provider: 'cloudflare', startupTimeoutMs: 15000 });
  assert.equal(config.checksConfig.test, 'bun run test:ci');
});

test('desktop inspection respects package managers and forwards Next port options correctly', async (t) => {
  const examples = [
    { manager: 'npm', declared: undefined, lock: 'package-lock.json', setup: 'npm ci', forwarding: ' --' },
    { manager: 'bun', declared: undefined, lock: 'bun.lock', setup: 'bun install --frozen-lockfile', forwarding: '' },
    { manager: 'yarn', declared: 'yarn@4.0.0', lock: 'yarn.lock', setup: 'yarn install --immutable', forwarding: '' },
    { manager: 'pnpm', declared: 'pnpm@10.0.0', lock: undefined, setup: 'pnpm install', forwarding: '' },
  ];
  for (const example of examples) {
    const path = await createRepository(t);
    await writeFile(
      join(path, 'package.json'),
      JSON.stringify({
        packageManager: example.declared,
        scripts: { dev: 'next dev', build: 'next build', test: 'vitest', lint: 'biome check .' },
      }),
    );
    if (example.lock) {
      await writeFile(join(path, example.lock), '');
    }

    const draft = await inspectDesktopProject(path);

    assert.equal(draft.packageManager, example.manager);
    assert.equal(draft.setupCommand, example.setup);
    assert.equal(
      draft.previewCommand,
      `${example.manager} run dev${example.forwarding} --hostname 127.0.0.1 --port {{hostPort}}`,
    );
    assert.equal(draft.scripts.find((script) => script.name === 'dev')?.command, draft.previewCommand);
  }
});

test('an invalid manifest remains visible and can be replaced by form configuration without changing the repository', async (t) => {
  const path = await createRepository(t);
  const source = 'version: 1\npreview: { healthcheck: "http://169.254.169.254/metadata" }\n';
  await writeFile(join(path, 'pairdock.yml'), source);
  const draft = await inspectDesktopProject(path);
  assert.equal(draft.manifestStatus, 'invalid');
  assert.equal(draft.setupCommand, '');
  assert.equal(draft.previewCommand, '');
  assert.ok(draft.warnings.some((warning) => warning.includes('pairdock.yml')));

  await assert.rejects(loadDesktopProjectConfig('project-1', draft), /previewCommand/);

  const config = await loadDesktopProjectConfig('project-1', {
    ...draft,
    name: 'Custom app',
    previewCommand: 'python -m http.server {{hostPort}} --bind 127.0.0.1',
    healthcheckUrl: 'http://127.0.0.1:{{hostPort}}',
    buildCommand: 'make build',
    testCommand: 'make test',
    lintCommand: 'make lint',
  });
  assert.equal(config.previewConfig.runtime, 'host');
  assert.equal(config.previewConfig.sandbox?.healthcheckUrl, 'http://127.0.0.1:{{hostPort}}');
  assert.equal(config.checksConfig.test, 'make test');
  assert.equal(await readFile(join(path, 'pairdock.yml'), 'utf8'), source);
});

test('desktop inspection rejects subfolders and non-GitHub origins instead of trusting manifest identity', async (t) => {
  const path = await createRepository(t);
  await mkdir(join(path, 'subfolder'));
  await assert.rejects(inspectDesktopProject('relative/path'), /absolute/);
  await assert.rejects(inspectDesktopProject(join(path, 'subfolder')), /root folder/);
  for (const origin of ['https://gitlab.com/example/repo.git', 'https://github.com/example/repo/tree/main']) {
    await execFileAsync('git', ['remote', 'set-url', 'origin', origin], { cwd: path });
    await assert.rejects(inspectDesktopProject(path), /GitHub repository/);
  }
});

test('desktop inspection bounds metadata reads and does not follow manifest or package symlinks', async (t) => {
  const path = await createRepository(t);
  await writeFile(join(path, '.env'), JSON.stringify({ name: 'should-not-be-read', scripts: { dev: 'vite' } }));
  await symlink(join(path, '.env'), join(path, 'package.json'));
  await symlink(join(path, '.env'), join(path, 'pairdock.yml'));

  const draft = await inspectDesktopProject(path);
  assert.notEqual(draft.name, 'should-not-be-read');
  assert.equal(draft.previewCommand, '');
  assert.equal(draft.manifestStatus, 'invalid');
  assert.ok(draft.warnings.some((warning) => warning.includes('package.json')));

  await rm(join(path, 'package.json'));
  await writeFile(join(path, 'package.json'), JSON.stringify({ name: 'oversized', padding: 'x'.repeat(1024 * 1024) }));
  const oversized = await inspectDesktopProject(path);
  assert.notEqual(oversized.name, 'oversized');
  assert.equal(oversized.setupCommand, '');
});

async function createRepository(t: TestContext): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), 'pairdock-desktop-inspect-'));
  t.after(() => rm(path, { recursive: true, force: true }));
  await execFileAsync('git', ['init', '--quiet', '--initial-branch=main'], { cwd: path });
  await execFileAsync('git', ['remote', 'add', 'origin', 'git@github.com:example/web-app.git'], { cwd: path });
  return path;
}
