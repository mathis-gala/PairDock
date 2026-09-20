import assert from 'node:assert/strict';
import test from 'node:test';
import type { DesktopProjectDraft } from '../../../../packages/local-agent/src/desktop/desktop-contracts.js';
import { inspectDesktopProjectTools } from '../../../../packages/local-agent/src/desktop/desktop-tools.js';

const project: DesktopProjectDraft = {
  path: '/projects/example',
  name: 'Example',
  repoFullName: 'example/project',
  defaultBranch: 'main',
  packageManager: 'pnpm',
  scripts: [],
  setupCommand: 'pnpm install --frozen-lockfile',
  previewCommand: 'pnpm run dev --port {{hostPort}}',
  healthcheckUrl: 'http://127.0.0.1:{{hostPort}}',
  runtime: 'host',
  buildCommand: 'cd web && pnpm run build',
  testCommand: 'pnpm test || pnpm test --runInBand',
  lintCommand: 'pnpm lint',
  manifestStatus: 'missing',
  warnings: [],
};

test('Docker preview tools are provided by its image while setup and validation tools are checked on the host', async () => {
  const calls: string[] = [];
  const missing = await inspectDesktopProjectTools(
    {
      ...project,
      runtime: 'docker',
      setupCommand: 'npm ci',
      previewCommand: 'bun run dev',
      buildCommand: 'npm run build',
      testCommand: 'npm test',
      lintCommand: 'npm run lint',
    },
    {
      runCommand: async (command) => {
        calls.push(command);
        throw new Error('Executable missing on host');
      },
    },
  );
  assert.deepEqual(calls.sort(), ['node', 'npm']);
  assert.deepEqual(missing.sort(), ['node', 'npm']);
});

test('project tools report missing pnpm and its Node runtime once without running project commands', async () => {
  const calls: Array<{ command: string; args: string[] }> = [];
  const warnings = await inspectDesktopProjectTools(project, {
    runCommand: async (command, args) => {
      calls.push({ command, args });
      throw new Error('Executable not found');
    },
  });

  assert.deepEqual(
    calls.sort((left, right) => left.command.localeCompare(right.command)),
    [
      { command: 'node', args: ['--version'] },
      { command: 'pnpm', args: ['--version'] },
    ],
  );
  assert.equal(warnings.length, 2);
  assert.ok(warnings.some((warning) => /pnpm/i.test(warning)));
  assert.ok(warnings.some((warning) => /node/i.test(warning)));
});

test('Python project commands do not inherit JavaScript requirements from draft defaults or unused scripts', async () => {
  const calls: string[] = [];
  const warnings = await inspectDesktopProjectTools(
    {
      ...project,
      scripts: [{ name: 'unused', command: 'pnpm run unused' }],
      setupCommand: 'python -m pip install -r requirements.txt',
      previewCommand: 'python -m app --label pnpm',
      buildCommand: 'make build',
      testCommand: 'pytest',
      lintCommand: 'ruff check .',
    },
    {
      runCommand: async (command) => {
        calls.push(command);
        throw new Error('No JavaScript tools installed');
      },
    },
  );

  assert.deepEqual(calls, []);
  assert.deepEqual(warnings, []);
});

test('project tools detect known executable names at shell segment boundaries and only probe versions', async () => {
  const calls: Array<{ command: string; args: string[] }> = [];
  const warnings = await inspectDesktopProjectTools(
    {
      ...project,
      setupCommand: 'npm ci',
      previewCommand: 'cd web && bun run dev',
      buildCommand: 'node scripts/preflight.mjs; yarn run build',
      testCommand: 'make test || pnpm test',
      lintCommand: 'printf npm',
    },
    {
      runCommand: async (command, args) => {
        calls.push({ command, args });
        return { stdout: '1.2.3', stderr: '' };
      },
    },
  );

  assert.deepEqual(
    calls.sort((left, right) => left.command.localeCompare(right.command)),
    ['bun', 'node', 'npm', 'pnpm', 'yarn'].map((command) => ({ command, args: ['--version'] })),
  );
  assert.deepEqual(warnings, []);
});
