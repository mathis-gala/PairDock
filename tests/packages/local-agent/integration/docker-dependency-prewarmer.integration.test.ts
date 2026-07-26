import assert from 'node:assert/strict';
import { mkdir, mkdtemp, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { DockerDependencyPrewarmer } from '../../../../packages/local-agent/src/docker/docker-dependency-prewarmer.js';
import type { ProjectPreviewConfig } from '../../../../packages/local-agent/src/docker/sandbox.port.js';

async function createBunWorkspace(lockfile = 'lockfile-v1') {
  const repositoryPath = await mkdtemp(join(tmpdir(), 'pairdock-prewarm-'));
  await mkdir(join(repositoryPath, 'apps', 'api'), { recursive: true });
  await writeFile(
    join(repositoryPath, 'package.json'),
    JSON.stringify({ name: 'workspace', private: true, workspaces: ['apps/*'] }),
  );
  await writeFile(join(repositoryPath, 'apps', 'api', 'package.json'), JSON.stringify({ name: 'api' }));
  await writeFile(join(repositoryPath, 'bun.lock'), lockfile);
  return repositoryPath;
}

function dockerPreviewConfig(): ProjectPreviewConfig {
  return {
    runtime: 'docker',
    prepareCommand: 'bun install --frozen-lockfile && bun --cwd apps/api prisma:generate',
    sandbox: {
      image: 'oven/bun:1.3.14',
      workdir: '/workspace',
      startCommand: 'bun install --frozen-lockfile && bun dev',
      healthcheckUrl: 'http://127.0.0.1:4000',
    },
  };
}

test('DockerDependencyPrewarmer fills Linux dependency volumes before sessions start', async () => {
  const repositoryPath = await createBunWorkspace();
  const dockerCalls: string[][] = [];
  const prewarmer = new DockerDependencyPrewarmer({
    async runDocker(args) {
      dockerCalls.push(args);
      if (args[0] === 'volume' && args[1] === 'inspect') {
        throw new Error('volume missing');
      }
      return { stdout: '' };
    },
  });

  const previewConfigs = await prewarmer.prepareAll({
    ownerId: 'developer-mac',
    projectPaths: { tcg: repositoryPath },
    previewConfigs: { tcg: dockerPreviewConfig() },
  });

  const mounts = previewConfigs.tcg?.dependencyCache?.mounts ?? [];
  assert.equal(mounts.length, 2);
  assert.deepEqual(
    mounts.map((mount) => mount.target),
    ['/workspace/apps/api/node_modules', '/workspace/node_modules'],
  );
  assert.ok(mounts.every((mount) => /^pairdock-deps-[a-f0-9]{40}$/.test(mount.volumeName)));

  const volumeCreateCalls = dockerCalls.filter((args) => args[0] === 'volume' && args[1] === 'create');
  assert.equal(volumeCreateCalls.length, 2);
  assert.ok(
    volumeCreateCalls.every((args) => args.includes('--label') && args.includes('com.pairdock.dependency-cache=true')),
  );
  assert.ok(volumeCreateCalls.every((args) => args.includes('com.pairdock.owner=developer-mac')));

  const prepareCall = dockerCalls.find((args) => args[0] === 'run' && args.at(-1)?.includes('bun install'));
  assert.ok(prepareCall);
  assert.ok(prepareCall.includes('--user'));
  assert.ok(prepareCall.includes(`${process.getuid?.() ?? 1000}:${process.getgid?.() ?? 1000}`));
  assert.ok(prepareCall.includes(`${repositoryPath}:/workspace:ro`));
  assert.ok(prepareCall.includes('HOME=/tmp'));
  assert.ok(prepareCall.includes('oven/bun:1.3.14'));
  assert.deepEqual(prepareCall.slice(-4), [
    'oven/bun:1.3.14',
    'sh',
    '-lc',
    'bun install --frozen-lockfile && bun --cwd apps/api prisma:generate',
  ]);
  assert.ok(mounts.every((mount) => prepareCall.includes(`${mount.volumeName}:${mount.target}`)));
  await assert.rejects(stat(join(repositoryPath, 'node_modules')), { code: 'ENOENT' });
  await assert.rejects(stat(join(repositoryPath, 'apps', 'api', 'node_modules')), { code: 'ENOENT' });
});

test('DockerDependencyPrewarmer invalidates dependency volumes when the lockfile changes', async () => {
  const repositoryPath = await createBunWorkspace('lockfile-v1');
  const prewarmer = new DockerDependencyPrewarmer({
    async runDocker(args) {
      if (args[0] === 'volume' && args[1] === 'inspect') {
        throw new Error('volume missing');
      }
      return { stdout: '' };
    },
  });
  const first = await prewarmer.prepareAll({
    ownerId: 'developer-mac',
    projectPaths: { tcg: repositoryPath },
    previewConfigs: { tcg: dockerPreviewConfig() },
  });

  await writeFile(join(repositoryPath, 'bun.lock'), 'lockfile-v2');
  const second = await prewarmer.prepareAll({
    ownerId: 'developer-mac',
    projectPaths: { tcg: repositoryPath },
    previewConfigs: { tcg: dockerPreviewConfig() },
  });

  assert.notDeepEqual(
    first.tcg?.dependencyCache?.mounts.map((mount) => mount.volumeName),
    second.tcg?.dependencyCache?.mounts.map((mount) => mount.volumeName),
  );
});

test('DockerDependencyPrewarmer keeps cold session startup available when warmup fails', async () => {
  const repositoryPath = await createBunWorkspace();
  const warnings: string[] = [];
  const previewConfig = dockerPreviewConfig();
  const prewarmer = new DockerDependencyPrewarmer(
    {
      async runDocker(args) {
        if (args[0] === 'volume' && args[1] === 'inspect') {
          throw new Error('volume missing');
        }
        if (args[0] === 'run' && args.at(-1)?.includes('bun install')) {
          throw new Error('Docker daemon unavailable');
        }
        return { stdout: '' };
      },
    },
    {
      info() {},
      warn(message) {
        warnings.push(message);
      },
    },
  );

  const previewConfigs = await prewarmer.prepareAll({
    ownerId: 'developer-mac',
    projectPaths: { tcg: repositoryPath },
    previewConfigs: { tcg: previewConfig },
  });

  assert.equal(previewConfigs.tcg, previewConfig);
  assert.equal(previewConfigs.tcg?.dependencyCache, undefined);
  assert.match(warnings[0] ?? '', /tcg.*Docker daemon unavailable/i);
});

test('DockerDependencyPrewarmer removes stale cache volumes only after successful preparation', async () => {
  const repositoryPath = await createBunWorkspace();
  const dockerCalls: string[][] = [];
  const inspectedVolumes: string[] = [];
  const prewarmer = new DockerDependencyPrewarmer({
    async runDocker(args) {
      dockerCalls.push(args);
      if (args[0] === 'volume' && args[1] === 'inspect') {
        inspectedVolumes.push(args[2] ?? '');
      }
      if (args[0] === 'volume' && args[1] === 'ls') {
        return {
          stdout: [...inspectedVolumes, 'pairdock-deps-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'].join('\n'),
        };
      }
      return { stdout: '' };
    },
  });

  await prewarmer.prepareAll({
    ownerId: 'developer-mac',
    projectPaths: { tcg: repositoryPath },
    previewConfigs: { tcg: dockerPreviewConfig() },
  });

  const removeCalls = dockerCalls.filter((args) => args[0] === 'volume' && args[1] === 'rm');
  assert.deepEqual(removeCalls, [['volume', 'rm', 'pairdock-deps-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']]);
});
