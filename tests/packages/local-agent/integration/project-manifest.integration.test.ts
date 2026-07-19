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
      'sandbox:',
      '  image: oven/bun:1',
      '  workdir: /workspace',
      '  network: host-services',
      '  env:',
      '    DATABASE_URL: "postgresql://postgres:pairdockdev@host.docker.internal:55432/pairdock"',
      '  ports:',
      '    - "127.0.0.1:4000:4000"',
      'preview:',
      '  start: "pnpm dev --host 0.0.0.0 --port 4000"',
      '  healthcheck: "http://127.0.0.1:4000"',
      '  tunnel: cloudflare',
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
  assert.equal(config.previewConfigs.pairdock?.sandbox?.image, 'oven/bun:1');
  assert.equal(config.previewConfigs.pairdock?.sandbox?.workdir, '/workspace');
  assert.equal(config.previewConfigs.pairdock?.sandbox?.network, 'host-services');
  assert.deepEqual(config.previewConfigs.pairdock?.sandbox?.env, {
    DATABASE_URL: 'postgresql://postgres:pairdockdev@host.docker.internal:55432/pairdock',
  });
  assert.deepEqual(config.previewConfigs.pairdock?.sandbox?.ports, ['127.0.0.1:4000:4000']);
  assert.equal(config.previewConfigs.pairdock?.sandbox?.startCommand, 'pnpm dev --host 0.0.0.0 --port 4000');
  assert.equal(config.previewConfigs.pairdock?.sandbox?.healthcheckUrl, 'http://127.0.0.1:4000');
  assert.deepEqual(config.previewConfigs.pairdock?.tunnel, {
    provider: 'cloudflare',
  });
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

test('V1: local agent accepts per-session host port templates in preview URLs', async () => {
  const projectPath = await mkdtemp(join(tmpdir(), 'pairdock-manifest-port-template-'));
  await writeFile(
    join(projectPath, 'pairdock.yml'),
    [
      'version: 1',
      'repoFullName: mathis-gala/PairDock',
      'sandbox:',
      '  ports:',
      '    - "127.0.0.1:{{hostPort}}:4000"',
      'preview:',
      '  start: "pnpm dev --port 4000"',
      '  healthcheck: "http://127.0.0.1:{{hostPort}}"',
      '  tunnel:',
      '    publicUrl: "http://127.0.0.1:{{hostPort}}"',
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
    models: [],
    projects: [],
    projectPaths: { pairdock: projectPath },
    previewConfigs: {},
  });

  assert.equal(config.projects.length, 1);
  assert.equal(config.previewConfigs.pairdock?.sandbox?.healthcheckUrl, 'http://127.0.0.1:{{hostPort}}');
  assert.equal(config.previewConfigs.pairdock?.tunnel?.publicUrl, 'http://127.0.0.1:{{hostPort}}');
});
