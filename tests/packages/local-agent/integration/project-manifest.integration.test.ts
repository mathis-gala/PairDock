import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { enrichConfigWithProjectManifests } from '../../../../packages/local-agent/src/config/project-manifest.js';

test('V1: local agent loads pairdock.yml and publishes safe project metadata', async () => {
  const projectPath = await mkdtemp(join(tmpdir(), 'pairdock-manifest-'));
  await writeFile(
    join(projectPath, 'pairdock.yml'),
    [
      'version: 1',
      'name: my-web-app',
      'repoFullName: mathis-gala/PairDock',
      'defaultBranch: main',
      'models:',
      '  - agent/gpt-5',
      'preview:',
      '  start: "pnpm dev --host 127.0.0.1 --port 4000"',
      '  healthcheck: "http://127.0.0.1:4000"',
      'checks:',
      '  build: "pnpm build"',
      '  test: "pnpm test"',
      '  lint: "pnpm lint"',
      '',
    ].join('\n'),
  );

  const config = await enrichConfigWithProjectManifests({
    backendUrl: 'https://pairdock.test',
    agentId: 'local-agent-1',
    capabilities: ['session.prepare'],
    models: [{ id: 'agent/gpt-5', label: 'GPT-5', provider: 'local' }],
    projects: [],
    projectPaths: { pairdock: projectPath },
    previewConfigs: {},
  });

  assert.deepEqual(config.projects, [
    {
      key: 'pairdock',
      name: 'my-web-app',
      repoFullName: 'mathis-gala/PairDock',
      pathAlias: projectPath.split('/').at(-1),
      defaultBranch: 'main',
      models: ['agent/gpt-5'],
    },
  ]);
  assert.equal(config.previewConfigs.pairdock?.sandbox?.startCommand, 'pnpm dev --host 127.0.0.1 --port 4000');
  assert.equal(config.previewConfigs.pairdock?.sandbox?.healthcheckUrl, 'http://127.0.0.1:4000');
  assert.deepEqual(config.checksConfigs?.pairdock, {
    build: 'pnpm build',
    test: 'pnpm test',
    lint: 'pnpm lint',
  });
});

test('V1: local agent does not publish projects without pairdock.yml', async () => {
  const projectPath = await mkdtemp(join(tmpdir(), 'pairdock-missing-manifest-'));
  const config = await enrichConfigWithProjectManifests({
    backendUrl: 'https://pairdock.test',
    agentId: 'local-agent-1',
    capabilities: ['session.prepare'],
    models: [],
    projects: [],
    projectPaths: { pairdock: projectPath },
    previewConfigs: {},
  });

  assert.deepEqual(config.projects, []);
  assert.deepEqual(config.previewConfigs, {});
  assert.equal(config.checksConfigs, undefined);
});
