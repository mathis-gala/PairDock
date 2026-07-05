import { type ChildProcess, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
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
}

interface SandboxSpawnOptions {
  cwd?: string;
  shell: boolean;
  stdio: 'ignore';
}

type SandboxSpawn = (command: string, args: string[], options: SandboxSpawnOptions) => ChildProcess;

interface DockerSandboxAdapterDependencies {
  spawn?: SandboxSpawn;
}

export class DockerSandboxAdapter implements SandboxPort {
  private readonly processes = new Map<string, ManagedSandboxProcess>();

  constructor(private readonly dependencies: DockerSandboxAdapterDependencies = {}) {}

  async start(input: SandboxStartInput): Promise<SandboxRef> {
    const sandboxConfig = input.previewConfig?.sandbox;

    if (!sandboxConfig?.startCommand || !sandboxConfig.healthcheckUrl) {
      throw new Error(`Missing sandbox preview config for project ${input.projectKey}.`);
    }

    const containerName = `pairdock-${input.sessionId.replaceAll('-', '').slice(0, 24)}`;
    const process = this.spawn('docker', buildDockerRunArgs(input, containerName), {
      cwd: input.worktreePath,
      shell: false,
      stdio: 'ignore',
    });

    const sandboxRef: SandboxRef = {
      id: randomUUID(),
      sessionId: input.sessionId,
      healthcheckUrl: sandboxConfig.healthcheckUrl,
      metadata: {
        projectKey: input.projectKey,
        type: 'docker',
        containerName,
      },
    };

    this.processes.set(sandboxRef.id, {
      containerName,
      cwd: input.worktreePath,
      process,
    });
    return sandboxRef;
  }

  async stop(ref: SandboxRef, previewConfig?: ProjectPreviewConfig): Promise<void> {
    const sandboxConfig = previewConfig?.sandbox;
    const managedProcess = this.processes.get(ref.id);

    if (sandboxConfig?.stopCommand && managedProcess) {
      const stopProcess = this.spawn(
        'docker',
        ['exec', managedProcess.containerName, 'sh', '-lc', sandboxConfig.stopCommand],
        {
          cwd: managedProcess.cwd,
          shell: false,
          stdio: 'ignore',
        },
      );

      await onceExit(stopProcess);
    }

    if (managedProcess) {
      const stopProcess = this.spawn('docker', ['stop', managedProcess.containerName], {
        cwd: managedProcess.cwd,
        shell: false,
        stdio: 'ignore',
      });
      await Promise.race([onceExit(stopProcess), delay(5_000)]);
    }

    if (managedProcess?.process && !managedProcess.process.killed) {
      managedProcess.process.kill('SIGTERM');
      await Promise.race([onceExit(managedProcess.process), delay(2_000)]);
      if (!managedProcess.process.killed && managedProcess.process.exitCode === null) {
        managedProcess.process.kill('SIGKILL');
      }
    }

    this.processes.delete(ref.id);
  }

  async check(ref: SandboxRef): Promise<HealthcheckResult> {
    try {
      const response = await fetch(ref.healthcheckUrl, { signal: AbortSignal.timeout(2_000) });
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
