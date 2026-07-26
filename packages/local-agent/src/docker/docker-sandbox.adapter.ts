import { type ChildProcess, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { join, posix, relative, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { PAIRDOCK_DOCKER_OWNER_LABEL, PAIRDOCK_DOCKER_SESSION_LABEL } from './docker-orphan-reconciler.js';
import type {
  HealthcheckResult,
  ProjectPreviewConfig,
  SandboxPort,
  SandboxRef,
  SandboxStartInput,
} from './sandbox.port.js';

interface ManagedSandboxProcess {
  process: ChildProcess;
  cwd: string;
  containerName: string;
  logs: string;
  spawnError?: Error;
}

interface SandboxSpawnOptions {
  cwd?: string;
  shell: boolean;
  stdio: ['ignore', 'pipe', 'pipe'];
}

type SandboxSpawn = (command: string, args: string[], options: SandboxSpawnOptions) => ChildProcess;

interface DockerSandboxAdapterDependencies {
  spawn?: SandboxSpawn;
  allocateHostPort?: () => Promise<number>;
  fetch?: typeof fetch;
}

const MAX_STARTUP_LOG_CHARS = 4_000;
const MAX_NODE_MODULES_SCAN_DEPTH = 12;
const DEFAULT_SANDBOX_IMAGE =
  'node:22-bookworm-slim@sha256:6c74791e557ce11fc957704f6d4fe134a7bc8d6f5ca4403205b2966bd488f6b3';

export class DockerSandboxAdapter implements SandboxPort {
  private readonly processes = new Map<string, ManagedSandboxProcess>();

  constructor(private readonly dependencies: DockerSandboxAdapterDependencies = {}) {}

  async start(input: SandboxStartInput): Promise<SandboxRef> {
    const previewConfig = await resolveSessionPreviewConfig(
      input.previewConfig,
      input.sessionId,
      this.dependencies.allocateHostPort ?? allocateHostPort,
    );
    const sandboxConfig = previewConfig?.sandbox;

    if (!sandboxConfig?.startCommand || !sandboxConfig.healthcheckUrl) {
      throw new Error(`Missing sandbox preview config for project ${input.projectKey}.`);
    }

    const containerName = `pairdock-${input.sessionId.replaceAll('-', '').slice(0, 24)}`;
    const nodeModulesPaths = await findNodeModulesPaths(input.worktreePath);
    const process = this.spawn(
      'docker',
      buildDockerRunArgs({ ...input, previewConfig }, containerName, nodeModulesPaths),
      {
        cwd: input.worktreePath,
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    const sandboxRef: SandboxRef = {
      id: randomUUID(),
      sessionId: input.sessionId,
      healthcheckUrl: sandboxConfig.healthcheckUrl,
      previewConfig,
      metadata: {
        projectKey: input.projectKey,
        type: 'docker',
        containerName,
      },
    };

    const managedProcess: ManagedSandboxProcess = {
      containerName,
      cwd: input.worktreePath,
      process,
      logs: '',
    };
    const appendStartupLogs = (chunk: Buffer | string) => {
      managedProcess.logs = appendLogs(managedProcess.logs, chunk.toString());
    };
    process.stdout?.on('data', appendStartupLogs);
    process.stderr?.on('data', appendStartupLogs);
    process.once('error', (error) => {
      managedProcess.spawnError = error;
    });
    this.processes.set(sandboxRef.id, managedProcess);
    return sandboxRef;
  }

  async stop(ref: SandboxRef, previewConfig?: ProjectPreviewConfig): Promise<void> {
    const sandboxConfig = previewConfig?.sandbox;
    const managedProcess = this.processes.get(ref.id);
    const containerName = managedProcess?.containerName ?? resolveRestoredContainerName(ref);

    if (sandboxConfig?.stopCommand && containerName) {
      const stopProcess = this.spawn('docker', ['exec', containerName, 'sh', '-lc', sandboxConfig.stopCommand], {
        cwd: managedProcess?.cwd,
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      await onceExit(stopProcess);
    }

    if (containerName) {
      const stopProcess = this.spawn('docker', ['stop', containerName], {
        cwd: managedProcess?.cwd,
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      await Promise.race([onceExit(stopProcess), delay(5_000)]);
    }

    if (
      managedProcess?.process &&
      managedProcess.process.exitCode === null &&
      managedProcess.process.signalCode === null
    ) {
      const gracefulExit = onceExit(managedProcess.process);
      managedProcess.process.kill('SIGTERM');
      await Promise.race([gracefulExit, delay(2_000)]);
      if (managedProcess.process.exitCode === null && managedProcess.process.signalCode === null) {
        managedProcess.process.kill('SIGKILL');
      }
    }

    this.processes.delete(ref.id);
  }

  async check(ref: SandboxRef): Promise<HealthcheckResult> {
    const exitedMessage = this.getExitedProcessMessage(ref);
    if (exitedMessage) {
      return {
        ready: false,
        url: ref.healthcheckUrl,
        message: exitedMessage,
      };
    }

    try {
      const response = await this.fetch(ref.healthcheckUrl, { signal: AbortSignal.timeout(2_000) });
      const exitedAfterRequest = this.getExitedProcessMessage(ref);

      if (exitedAfterRequest) {
        return {
          ready: false,
          url: ref.healthcheckUrl,
          message: exitedAfterRequest,
        };
      }

      return {
        ready: response.ok,
        url: ref.healthcheckUrl,
        message: `HTTP ${response.status}${response.ok ? '' : this.getStartupLogSuffix(ref)}`,
      };
    } catch (error) {
      return {
        ready: false,
        url: ref.healthcheckUrl,
        message: `${error instanceof Error ? error.message : String(error)}${this.getStartupLogSuffix(ref)}`,
      };
    }
  }

  private spawn(command: string, args: string[], options: SandboxSpawnOptions): ChildProcess {
    return this.dependencies.spawn?.(command, args, options) ?? spawn(command, args, options);
  }

  private fetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
    return this.dependencies.fetch?.(input, init) ?? fetch(input, init);
  }

  private getStartupLogSuffix(ref: SandboxRef): string {
    const logs = this.processes.get(ref.id)?.logs.trim();
    return logs ? ` Startup logs: ${logs}` : '';
  }

  private getExitedProcessMessage(ref: SandboxRef): string | null {
    const managedProcess = this.processes.get(ref.id);

    if (!managedProcess || managedProcess.process.exitCode === null) {
      if (managedProcess?.spawnError) {
        return `Docker preview failed to start: ${managedProcess.spawnError.message}.${this.getStartupLogSuffix(ref)}`;
      }
      return null;
    }

    return `Docker preview exited with code ${managedProcess.process.exitCode}.${this.getStartupLogSuffix(ref)}`;
  }
}

function resolveRestoredContainerName(ref: SandboxRef): string | null {
  if (ref.metadata?.type !== 'docker') {
    return null;
  }

  const containerName = ref.metadata.containerName;
  if (!containerName || !/^pairdock-[a-z0-9-]+$/.test(containerName)) {
    throw new Error(`Invalid persisted Docker container name for session ${ref.sessionId}.`);
  }

  return containerName;
}

async function resolveSessionPreviewConfig(
  previewConfig: ProjectPreviewConfig | undefined,
  sessionId: string,
  portAllocator: () => Promise<number>,
): Promise<ProjectPreviewConfig | undefined> {
  if (!previewConfig) {
    return undefined;
  }

  const serializedConfig = JSON.stringify(previewConfig);
  const hostPort = serializedConfig.includes('{{hostPort}}') ? await portAllocator() : null;
  const replaceTemplates = (value: string) =>
    value
      .replaceAll('{{sessionId}}', sessionId)
      .replaceAll('{{hostPort}}', hostPort === null ? '{{hostPort}}' : String(hostPort));
  const sandbox = previewConfig.sandbox;
  const tunnel = previewConfig.tunnel;

  return {
    ...previewConfig,
    ...(sandbox
      ? {
          sandbox: {
            ...sandbox,
            startCommand: replaceTemplates(sandbox.startCommand),
            ...(sandbox.stopCommand ? { stopCommand: replaceTemplates(sandbox.stopCommand) } : {}),
            healthcheckUrl: replaceTemplates(sandbox.healthcheckUrl),
            ...(sandbox.env
              ? {
                  env: Object.fromEntries(
                    Object.entries(sandbox.env).map(([key, value]) => [key, replaceTemplates(value)]),
                  ),
                }
              : {}),
            ...(sandbox.ports ? { ports: sandbox.ports.map(replaceTemplates) } : {}),
          },
        }
      : {}),
    ...(tunnel
      ? {
          tunnel: {
            ...tunnel,
            ...(tunnel.publicUrl ? { publicUrl: replaceTemplates(tunnel.publicUrl) } : {}),
          },
        }
      : {}),
    ...(previewConfig.healthcheckTimeoutMs ? { healthcheckTimeoutMs: previewConfig.healthcheckTimeoutMs } : {}),
    ...(previewConfig.healthcheckIntervalMs ? { healthcheckIntervalMs: previewConfig.healthcheckIntervalMs } : {}),
  };
}

async function allocateHostPort(): Promise<number> {
  const server = createServer();

  return new Promise<number>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();

      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Could not allocate a local preview port.'));
        return;
      }

      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(address.port);
      });
    });
  });
}

function appendLogs(current: string, next: string): string {
  const combined = `${current}${next}`;
  return combined.length <= MAX_STARTUP_LOG_CHARS ? combined : combined.slice(-MAX_STARTUP_LOG_CHARS);
}

function buildDockerRunArgs(input: SandboxStartInput, containerName: string, nodeModulesPaths: string[]): string[] {
  const sandboxConfig = input.previewConfig?.sandbox;

  if (!sandboxConfig) {
    throw new Error(`Missing Docker sandbox config for project ${input.projectKey}.`);
  }

  const workdir = sandboxConfig.workdir ?? '/workspace';
  const args = [
    'run',
    '--rm',
    '--init',
    '--name',
    containerName,
    ...buildManagedResourceLabels(input.runtimeOwnerId, input.sessionId),
    ...buildContainerHardeningArgs(),
    '--workdir',
    workdir,
    '--volume',
    `${input.worktreePath}:${workdir}`,
  ];

  for (const nodeModulesPath of nodeModulesPaths) {
    const target = posix.join(workdir, nodeModulesPath);
    const dependencyVolume = sandboxDependencyVolumes(input.previewConfig).get(target);

    if (dependencyVolume) {
      args.push('--volume', `${dependencyVolume}:${target}`);
    } else {
      args.push('--tmpfs', buildNodeModulesTmpfsArg(workdir, nodeModulesPath));
    }
  }

  for (const port of sandboxConfig.ports ?? inferPortsFromHealthcheck(sandboxConfig.healthcheckUrl)) {
    args.push('--publish', port);
  }

  if (sandboxConfig.network === 'host-services') {
    args.push('--add-host', 'host.docker.internal:host-gateway');
  } else {
    args.push('--network', 'none');
  }

  args.push('--env', 'HOME=/tmp');

  for (const [name, value] of Object.entries(sandboxConfig.env ?? {})) {
    args.push('--env', `${name}=${value}`);
  }

  const image = sandboxConfig.image ?? DEFAULT_SANDBOX_IMAGE;
  assertSafeContainerImage(image);
  args.push(image, 'sh', '-lc', sandboxConfig.startCommand);
  return args;
}

function sandboxDependencyVolumes(previewConfig: ProjectPreviewConfig | undefined): Map<string, string> {
  return new Map(
    (previewConfig?.dependencyCache?.mounts ?? []).map((mount) => {
      if (!/^pairdock-deps-[a-f0-9]{40}$/.test(mount.volumeName)) {
        throw new Error('Invalid PairDock Docker dependency volume name.');
      }

      return [mount.target, mount.volumeName];
    }),
  );
}

async function findNodeModulesPaths(worktreePath: string): Promise<string[]> {
  const paths = new Set(['node_modules']);

  const visit = async (directoryPath: string, depth: number): Promise<void> => {
    if (depth > MAX_NODE_MODULES_SCAN_DEPTH) {
      return;
    }

    const entries = await readdir(directoryPath, { withFileTypes: true });

    await Promise.all(
      entries.map(async (entry) => {
        if (!entry.isDirectory() || entry.name === '.git') {
          return;
        }

        const entryPath = join(directoryPath, entry.name);
        if (entry.name === 'node_modules') {
          paths.add(relative(worktreePath, entryPath).split(sep).join('/'));
          return;
        }

        await visit(entryPath, depth + 1);
      }),
    );
  };

  await visit(worktreePath, 0);
  return [...paths].sort();
}

function buildNodeModulesTmpfsArg(workdir: string, nodeModulesPath: string): string {
  const target = posix.join(workdir, nodeModulesPath);
  return `${target}:rw,exec,nosuid,nodev,uid=${process.getuid?.() ?? 1000},gid=${process.getgid?.() ?? 1000},mode=0700,size=2g`;
}

function buildManagedResourceLabels(ownerId: string | undefined, sessionId: string): string[] {
  return ownerId
    ? [
        '--label',
        `${PAIRDOCK_DOCKER_OWNER_LABEL}=${ownerId}`,
        '--label',
        `${PAIRDOCK_DOCKER_SESSION_LABEL}=${sessionId}`,
      ]
    : [];
}

function buildContainerHardeningArgs(): string[] {
  return [
    '--read-only',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges',
    '--pids-limit',
    '512',
    '--user',
    `${process.getuid?.() ?? 1000}:${process.getgid?.() ?? 1000}`,
    '--tmpfs',
    '/tmp:rw,nosuid,nodev',
  ];
}

function assertSafeContainerImage(image: string): void {
  if (
    image.length > 512 ||
    image.startsWith('-') ||
    image.includes('://') ||
    /[\s\0]/.test(image) ||
    !/^[a-z0-9][a-z0-9._\-/:@]+$/i.test(image)
  ) {
    throw new Error('Sandbox image must be a valid container image reference.');
  }
}

function inferPortsFromHealthcheck(healthcheckUrl: string): string[] {
  try {
    const url = new URL(healthcheckUrl);
    const port = url.port || (url.protocol === 'https:' ? '443' : '80');
    return [`127.0.0.1:${port}:${port}`];
  } catch {
    return [];
  }
}

async function onceExit(process: ChildProcess): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    process.once('exit', () => resolve());
    process.once('error', reject);
  });
}
