import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rmdir } from 'node:fs/promises';
import { join, posix, relative, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';
import type { ProjectPreviewConfig } from './sandbox.port.js';

export const PAIRDOCK_DOCKER_DEPENDENCY_CACHE_LABEL = 'com.pairdock.dependency-cache';

interface DockerCommandResult {
  stdout: string;
}

interface DockerDependencyPrewarmerDependencies {
  runDocker?: (args: string[], cwd?: string) => Promise<DockerCommandResult>;
}

interface DockerDependencyPrewarmerLogger {
  info(message: string): void;
  warn(message: string): void;
}

interface PrepareAllInput {
  ownerId: string;
  projectPaths: Record<string, string>;
  previewConfigs: Record<string, ProjectPreviewConfig>;
}

const LOCKFILE_NAMES = ['bun.lock', 'bun.lockb', 'pnpm-lock.yaml', 'package-lock.json', 'yarn.lock'] as const;
const MAX_PACKAGE_SCAN_DEPTH = 12;
const DEFAULT_SANDBOX_IMAGE =
  'node:22-bookworm-slim@sha256:6c74791e557ce11fc957704f6d4fe134a7bc8d6f5ca4403205b2966bd488f6b3';

export class DockerDependencyPrewarmer {
  constructor(
    private readonly dependencies: DockerDependencyPrewarmerDependencies = {},
    private readonly logger: DockerDependencyPrewarmerLogger = console,
  ) {}

  async prepareAll(input: PrepareAllInput): Promise<Record<string, ProjectPreviewConfig>> {
    const preparedConfigs = { ...input.previewConfigs };
    const activeVolumeNames = new Set<string>();
    let preparationFailed = false;

    await Promise.all(
      Object.entries(input.previewConfigs).map(async ([projectKey, previewConfig]) => {
        const repositoryPath = input.projectPaths[projectKey];

        if (
          !repositoryPath ||
          previewConfig.runtime !== 'docker' ||
          !previewConfig.prepareCommand ||
          !previewConfig.sandbox
        ) {
          return;
        }

        try {
          const dependencyCache = await this.prepareProject({
            ownerId: input.ownerId,
            projectKey,
            repositoryPath,
            previewConfig,
          });
          for (const mount of dependencyCache.mounts) {
            activeVolumeNames.add(mount.volumeName);
          }
          preparedConfigs[projectKey] = { ...previewConfig, dependencyCache };
        } catch (error) {
          preparationFailed = true;
          this.logger.warn(
            `Could not prewarm Docker dependencies for project ${projectKey}: ${errorMessage(error)}. ` +
              'Sessions will use cold dependency installation.',
          );
        }
      }),
    );

    if (!preparationFailed && activeVolumeNames.size > 0) {
      await this.removeStaleVolumes(input.ownerId, activeVolumeNames);
    }

    return preparedConfigs;
  }

  private async prepareProject(input: {
    ownerId: string;
    projectKey: string;
    repositoryPath: string;
    previewConfig: ProjectPreviewConfig;
  }) {
    const sandboxConfig = input.previewConfig.sandbox;
    const prepareCommand = input.previewConfig.prepareCommand;

    if (!sandboxConfig || !prepareCommand) {
      throw new Error('Docker dependency preparation requires a sandbox and prepare command.');
    }

    const workdir = sandboxConfig.workdir ?? '/workspace';
    const image = sandboxConfig.image ?? DEFAULT_SANDBOX_IMAGE;
    const dependencyLocations = await findDependencyLocations(input.repositoryPath, workdir);
    const cacheKey = await createDependencyCacheKey({
      image,
      ownerId: input.ownerId,
      prepareCommand,
      projectKey: input.projectKey,
      repositoryPath: input.repositoryPath,
    });
    const mounts = dependencyLocations.map((location) => ({
      target: location.target,
      volumeName: `pairdock-deps-${hashValue(`${cacheKey}\0${location.target}`).slice(0, 40)}`,
    }));

    for (const mount of mounts) {
      await this.ensureVolume({
        cacheKey,
        image,
        mount,
        ownerId: input.ownerId,
        projectKey: input.projectKey,
        repositoryPath: input.repositoryPath,
      });
    }

    this.logger.info(`Prewarming Docker dependencies for project ${input.projectKey}.`);
    const temporaryMountpoints = await createMissingMountpoints(dependencyLocations);
    try {
      await this.runDocker(
        buildPrepareRunArgs({
          image,
          mounts,
          prepareCommand,
          repositoryPath: input.repositoryPath,
          sandboxConfig,
          workdir,
        }),
        input.repositoryPath,
      );
    } finally {
      await removeEmptyMountpoints(temporaryMountpoints);
    }
    this.logger.info(`Docker dependencies ready for project ${input.projectKey}.`);

    return { cacheKey, mounts };
  }

  private runDocker(args: string[], cwd: string): Promise<DockerCommandResult> {
    return (this.dependencies.runDocker ?? runDocker)(args, cwd);
  }

  private async ensureVolume(input: {
    cacheKey: string;
    image: string;
    mount: { target: string; volumeName: string };
    ownerId: string;
    projectKey: string;
    repositoryPath: string;
  }): Promise<void> {
    const exists = await this.runDocker(['volume', 'inspect', input.mount.volumeName], input.repositoryPath)
      .then(() => true)
      .catch(() => false);

    if (exists) {
      return;
    }

    await this.runDocker(
      [
        'volume',
        'create',
        '--label',
        `${PAIRDOCK_DOCKER_DEPENDENCY_CACHE_LABEL}=true`,
        '--label',
        `com.pairdock.owner=${input.ownerId}`,
        '--label',
        `com.pairdock.project=${input.projectKey}`,
        '--label',
        `com.pairdock.cache-key=${input.cacheKey}`,
        input.mount.volumeName,
      ],
      input.repositoryPath,
    );
    await this.runDocker(
      [
        'run',
        '--rm',
        '--read-only',
        '--network',
        'none',
        '--cap-drop',
        'ALL',
        '--cap-add',
        'CHOWN',
        '--security-opt',
        'no-new-privileges',
        '--user',
        '0:0',
        '--volume',
        `${input.mount.volumeName}:/cache`,
        input.image,
        'sh',
        '-lc',
        `chown ${runtimeUid()}:${runtimeGid()} /cache`,
      ],
      input.repositoryPath,
    );
  }

  private async removeStaleVolumes(ownerId: string, activeVolumeNames: ReadonlySet<string>): Promise<void> {
    const { stdout } = await this.runDocker(
      [
        'volume',
        'ls',
        '--quiet',
        '--filter',
        `label=${PAIRDOCK_DOCKER_DEPENDENCY_CACHE_LABEL}=true`,
        '--filter',
        `label=com.pairdock.owner=${ownerId}`,
      ],
      process.cwd(),
    );
    const staleVolumeNames = stdout
      .split(/\r?\n/)
      .map((name) => name.trim())
      .filter((name) => /^pairdock-deps-[a-f0-9]{40}$/.test(name) && !activeVolumeNames.has(name));

    await Promise.all(
      staleVolumeNames.map(async (volumeName) => {
        try {
          await this.runDocker(['volume', 'rm', volumeName], process.cwd());
        } catch (error) {
          this.logger.warn(`Could not remove stale Docker dependency volume ${volumeName}: ${errorMessage(error)}.`);
        }
      }),
    );
  }
}

function buildPrepareRunArgs(input: {
  image: string;
  mounts: Array<{ target: string; volumeName: string }>;
  prepareCommand: string;
  repositoryPath: string;
  sandboxConfig: NonNullable<ProjectPreviewConfig['sandbox']>;
  workdir: string;
}): string[] {
  const args = [
    'run',
    '--rm',
    '--init',
    '--read-only',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges',
    '--pids-limit',
    '512',
    '--user',
    `${runtimeUid()}:${runtimeGid()}`,
    '--tmpfs',
    '/tmp:rw,exec,nosuid,nodev,size=2g',
    '--workdir',
    input.workdir,
    '--volume',
    `${input.repositoryPath}:${input.workdir}:ro`,
  ];

  for (const mount of input.mounts) {
    args.push('--volume', `${mount.volumeName}:${mount.target}`);
  }

  if (input.sandboxConfig.network === 'host-services') {
    args.push('--add-host', 'host.docker.internal:host-gateway');
  }

  args.push('--env', 'HOME=/tmp');

  for (const [name, value] of Object.entries(input.sandboxConfig.env ?? {})) {
    args.push('--env', `${name}=${value}`);
  }

  args.push(input.image, 'sh', '-lc', input.prepareCommand);
  return args;
}

async function findDependencyLocations(
  repositoryPath: string,
  workdir: string,
): Promise<Array<{ hostPath: string; target: string }>> {
  const packageDirectories = new Set(['']);

  const visit = async (directoryPath: string, depth: number): Promise<void> => {
    if (depth > MAX_PACKAGE_SCAN_DEPTH) {
      return;
    }

    const entries = await readdir(directoryPath, { withFileTypes: true });
    const relativeDirectory = relative(repositoryPath, directoryPath).split(sep).join('/');

    if (entries.some((entry) => entry.isFile() && entry.name === 'package.json')) {
      packageDirectories.add(relativeDirectory);
    }

    await Promise.all(
      entries.map(async (entry) => {
        if (
          !entry.isDirectory() ||
          entry.name === '.git' ||
          entry.name === 'node_modules' ||
          entry.name.startsWith('.')
        ) {
          return;
        }

        await visit(join(directoryPath, entry.name), depth + 1);
      }),
    );
  };

  await visit(repositoryPath, 0);
  return [...packageDirectories]
    .map((directory) => ({
      hostPath: join(repositoryPath, directory, 'node_modules'),
      target: posix.join(workdir, directory, 'node_modules'),
    }))
    .sort((left, right) => left.target.localeCompare(right.target));
}

async function createMissingMountpoints(locations: Array<{ hostPath: string; target: string }>): Promise<string[]> {
  const createdPaths: string[] = [];

  for (const location of locations) {
    try {
      await mkdir(location.hostPath);
      createdPaths.push(location.hostPath);
    } catch (error) {
      if (!isNodeError(error) || error.code !== 'EEXIST') {
        await removeEmptyMountpoints(createdPaths);
        throw error;
      }
    }
  }

  return createdPaths;
}

async function removeEmptyMountpoints(paths: string[]): Promise<void> {
  if (paths.length > 0) {
    await delay(250);
  }
  await Promise.all(paths.map(removeEmptyMountpoint));
}

async function removeEmptyMountpoint(path: string): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rmdir(path);
      return;
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return;
      }
      if (!isNodeError(error) || (error.code !== 'EBUSY' && error.code !== 'ENOTEMPTY') || attempt === 4) {
        return;
      }
      await delay(50 * (attempt + 1));
    }
  }
}

async function createDependencyCacheKey(input: {
  image: string;
  ownerId: string;
  prepareCommand: string;
  projectKey: string;
  repositoryPath: string;
}): Promise<string> {
  const hash = createHash('sha256');
  hash.update(`${input.ownerId}\0${input.projectKey}\0${input.image}\0${input.prepareCommand}\0`);
  let lockfileFound = false;

  for (const lockfileName of LOCKFILE_NAMES) {
    const contents = await readOptionalFile(join(input.repositoryPath, lockfileName));
    if (contents === null) {
      continue;
    }

    lockfileFound = true;
    hash.update(lockfileName);
    hash.update(contents);
  }

  if (!lockfileFound) {
    const packageManifest = await readFile(join(input.repositoryPath, 'package.json'));
    hash.update('package.json');
    hash.update(packageManifest);
  }

  return hash.digest('hex');
}

async function readOptionalFile(path: string): Promise<Buffer | null> {
  try {
    return await readFile(path);
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function runtimeUid(): number {
  return process.getuid?.() ?? 1000;
}

function runtimeGid(): number {
  return process.getgid?.() ?? 1000;
}

const execFileAsync = promisify(execFile);

async function runDocker(args: string[], cwd?: string): Promise<DockerCommandResult> {
  const { stdout } = await execFileAsync('docker', args, {
    cwd,
    maxBuffer: 20 * 1024 * 1024,
  });
  return { stdout };
}
