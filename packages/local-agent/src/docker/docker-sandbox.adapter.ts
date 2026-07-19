import { type ChildProcess, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
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
}

const MAX_STARTUP_LOG_CHARS = 4_000;

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
    const process = this.spawn('docker', buildDockerRunArgs({ ...input, previewConfig }, containerName), {
      cwd: input.worktreePath,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

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

    if (managedProcess?.process && !managedProcess.process.killed && managedProcess.process.exitCode === null) {
      managedProcess.process.kill('SIGTERM');
      await Promise.race([onceExit(managedProcess.process), delay(2_000)]);
      if (!managedProcess.process.killed && managedProcess.process.exitCode === null) {
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
      const response = await fetch(ref.healthcheckUrl, { signal: AbortSignal.timeout(2_000) });
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
        message: `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        ready: false,
        url: ref.healthcheckUrl,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private spawn(command: string, args: string[], options: SandboxSpawnOptions): ChildProcess {
    return this.dependencies.spawn?.(command, args, options) ?? spawn(command, args, options);
  }

  private getExitedProcessMessage(ref: SandboxRef): string | null {
    const managedProcess = this.processes.get(ref.id);

    if (!managedProcess || managedProcess.process.exitCode === null) {
      return null;
    }

    const logSuffix = managedProcess.logs ? ` Startup logs: ${managedProcess.logs}` : '';
    return `Docker preview exited with code ${managedProcess.process.exitCode}.${logSuffix}`;
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

function buildDockerRunArgs(input: SandboxStartInput, containerName: string): string[] {
  const sandboxConfig = input.previewConfig?.sandbox;

  if (!sandboxConfig) {
    throw new Error(`Missing Docker sandbox config for project ${input.projectKey}.`);
  }

  const workdir = sandboxConfig.workdir ?? '/workspace';
  const args = [
    'run',
    '--rm',
    '--name',
    containerName,
    '--workdir',
    workdir,
    '--volume',
    `${input.worktreePath}:${workdir}`,
  ];

  for (const port of sandboxConfig.ports ?? inferPortsFromHealthcheck(sandboxConfig.healthcheckUrl)) {
    args.push('--publish', port);
  }

  if (sandboxConfig.network === 'host-services') {
    args.push('--add-host', 'host.docker.internal:host-gateway');
  }

  for (const [name, value] of Object.entries(sandboxConfig.env ?? {})) {
    args.push('--env', `${name}=${value}`);
  }

  args.push(sandboxConfig.image ?? 'node:22-bookworm-slim', 'sh', '-lc', sandboxConfig.startCommand);
  return args;
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
