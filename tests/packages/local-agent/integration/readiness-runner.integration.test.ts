import assert from 'node:assert/strict';
import test from 'node:test';
import { ReadinessRunner } from '../../../../packages/local-agent/src/readiness/readiness-runner.js';

test('BT-044: ReadinessRunner reports every developer-side readiness check with remediation', async () => {
  const runner = new ReadinessRunner({
    authToken: 'test-token',
    projectPaths: {},
    previewConfigs: {},
    checksConfigs: {},
    agentHarnessConfigs: {},
  });

  const result = await runner.run({ projectKey: 'missing-project' });
  const checksByKey = new Map(result.checks.map((check) => [check.key, check]));

  assert.equal(result.ok, false);
  assert.deepEqual(
    [...checksByKey.keys()],
    ['agent', 'git', 'repository', 'source-control', 'agent-harness', 'docker', 'preview-tunnel', 'project-commands'],
  );
  assert.equal(checksByKey.get('agent')?.status, 'passed');
  assert.equal(checksByKey.get('repository')?.status, 'failed');
  assert.equal(checksByKey.get('repository')?.required, true);
  assert.match(checksByKey.get('repository')?.remediation ?? '', /Configure a local repository path/);
  assert.equal(checksByKey.get('preview-tunnel')?.status, 'warning');
  assert.equal(checksByKey.get('preview-tunnel')?.required, false);
  assert.equal(checksByKey.get('project-commands')?.status, 'failed');
  assert.match(checksByKey.get('project-commands')?.remediation ?? '', /pairdock\.yml/);
});

test('BT-044: ReadinessRunner fails hanging developer commands with a clear timeout', async () => {
  const runner = new ReadinessRunner(
    {
      authToken: 'test-token',
      projectPaths: {},
      previewConfigs: {},
      checksConfigs: {},
      agentHarnessConfigs: {},
      commandTimeoutMs: 5,
    },
    () => new Promise(() => undefined),
  );

  const result = await runner.run({ projectKey: 'missing-project' });
  const checksByKey = new Map(result.checks.map((check) => [check.key, check]));

  assert.equal(result.ok, false);
  assert.equal(checksByKey.get('git')?.status, 'failed');
  assert.match(checksByKey.get('git')?.message ?? '', /timed out/i);
  assert.equal(checksByKey.get('docker')?.status, 'failed');
  assert.match(checksByKey.get('docker')?.message ?? '', /timed out/i);
});

test('ReadinessRunner rejects Codex versions without restricted permission profiles', async () => {
  const runner = new ReadinessRunner(
    {
      authToken: 'test-token',
      projectPaths: { pairdock: '.' },
      previewConfigs: {
        pairdock: {
          sandbox: { startCommand: 'npm start', healthcheckUrl: 'http://127.0.0.1:4000' },
          tunnel: { provider: 'cloudflare' },
        },
      },
      checksConfigs: { pairdock: { build: 'npm run build', test: 'npm test', lint: 'npm run lint' } },
      agentHarnessConfigs: {},
    },
    async (command, args) => {
      if (command === 'codex' && args[0] === '--version') {
        return { ok: true, output: 'codex-cli 0.137.0' };
      }

      return { ok: true, output: 'ok' };
    },
  );

  const result = await runner.run({ projectKey: 'pairdock' });
  const harnessCheck = result.checks.find((check) => check.key === 'agent-harness');

  assert.equal(result.ok, false);
  assert.equal(harnessCheck?.status, 'failed');
  assert.match(harnessCheck?.message ?? '', /0\.138\.0 or newer/);
  assert.match(harnessCheck?.remediation ?? '', /codex update/);
});
