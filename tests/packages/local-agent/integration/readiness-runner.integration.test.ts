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
  assert.match(checksByKey.get('project-commands')?.remediation ?? '', /Configure build, test, and lint commands/);
});
