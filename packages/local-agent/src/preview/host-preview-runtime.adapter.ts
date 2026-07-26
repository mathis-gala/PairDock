import { type ChildProcess, execFile, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:net';
import { promisify } from 'node:util';
import { buildHostCommandEnvironment } from '../checks/host-check-command-executor.js';
import type { SandboxPort, SandboxRef, SandboxStartInput } from '../docker/sandbox.port.js';
import { terminateHostProcessGroup } from '../process/host-process-group.js';

interface HostSpawnOptions {
  cwd: string;
  detached: true;
  env: NodeJS.ProcessEnv;
  shell: false;
  stdio: ['ignore', 'pipe', 'pipe'];
}

interface HostPreviewRuntimeDependencies {
  allocateHostPort?: () => Promise<number>;
  fetch?: typeof fetch;
  isProcessGroupOwned?: (pid: number, runtimeToken: string) => Promise<boolean>;
  spawn?: (command: string, args: string[], options: HostSpawnOptions) => ChildProcess;
  terminateProcessGroup?: (pid: number) => Promise<void>;
}

interface ManagedHostPreviewProcess {
  logs: string;
  process: ChildProcess;
  spawnError?: Error;
}

export class HostPreviewRuntimeAdapter implements SandboxPort {
  private readonly processes = new Map<string, ManagedHostPreviewProcess>();

  constructor(private readonly dependencies: HostPreviewRuntimeDependencies = {}) {}

  async start(input: SandboxStartInput): Promise<SandboxRef> {
    const previewConfig = input.previewConfig;
    const runtimeConfig = previewConfig?.sandbox;

    if (!previewConfig || !runtimeConfig?.startCommand || !runtimeConfig.healthcheckUrl) {
      throw new Error(`Missing host preview config for project ${input.projectKey}.`);
    }

    const serializedConfig = JSON.stringify(previewConfig);
    const hostPort = serializedConfig.includes('{{hostPort}}')
      ? await (this.dependencies.allocateHostPort ?? allocateHostPort)()
      : null;
    const replaceTemplates = (value: string) =>
      value
        .replaceAll('{{sessionId}}', input.sessionId)
        .replaceAll('{{hostPort}}', hostPort === null ? '{{hostPort}}' : String(hostPort));
    const resolvedPreviewConfig = {
      ...previewConfig,
      sandbox: {
        ...runtimeConfig,
        startCommand: replaceTemplates(runtimeConfig.startCommand),
        healthcheckUrl: replaceTemplates(runtimeConfig.healthcheckUrl),
        ...(runtimeConfig.env
          ? {
              env: Object.fromEntries(
                Object.entries(runtimeConfig.env).map(([name, value]) => [name, replaceTemplates(value)]),
              ),
            }
          : {}),
      },
      ...(previewConfig.tunnel
        ? {
            tunnel: {
              ...previewConfig.tunnel,
              ...(previewConfig.tunnel.publicUrl
                ? { publicUrl: replaceTemplates(previewConfig.tunnel.publicUrl) }
                : {}),
            },
          }
        : {}),
    };
    const runtimeToken = randomUUID();
    const childProcess = this.spawn('sh', ['-lc', resolvedPreviewConfig.sandbox.startCommand], {
      cwd: input.worktreePath,
      detached: true,
      env: {
        ...buildHostCommandEnvironment(process.env, input.sessionId),
        ...resolvedPreviewConfig.sandbox.env,
        PAIRDOCK_SESSION_ID: input.sessionId,
        PAIRDOCK_RUNTIME_TOKEN: runtimeToken,
        ...(hostPort === null ? {} : { PAIRDOCK_PREVIEW_PORT: String(hostPort) }),
      },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const managedProcess: ManagedHostPreviewProcess = { logs: '', process: childProcess };
    const appendLogs = (chunk: Buffer | string) => {
      managedProcess.logs = `${managedProcess.logs}${chunk.toString()}`.slice(-4_000);
    };
    childProcess.stdout?.on('data', appendLogs);
    childProcess.stderr?.on('data', appendLogs);
    childProcess.once('error', (error) => {
      managedProcess.spawnError = error;
    });

    if (!childProcess.pid) {
      throw new Error(`Host preview process did not publish a PID for session ${input.sessionId}.`);
    }

    const ref = {
      id: randomUUID(),
      sessionId: input.sessionId,
      healthcheckUrl: resolvedPreviewConfig.sandbox.healthcheckUrl,
      previewConfig: resolvedPreviewConfig,
      metadata: {
        type: 'host',
        pid: String(childProcess.pid),
        runtimeToken,
      },
    };
    this.processes.set(ref.id, managedProcess);
    return ref;
  }

  async stop(ref: SandboxRef): Promise<void> {
    if (ref.metadata?.type !== 'host') {
      throw new Error(`Preview runtime ${ref.id} is not a host process.`);
    }

    const pid = Number(ref.metadata.pid);
    if (!Number.isSafeInteger(pid) || pid <= 0) {
      throw new Error(`Invalid persisted host preview PID for session ${ref.sessionId}.`);
    }

    if (!this.processes.has(ref.id)) {
      const runtimeToken = ref.metadata.runtimeToken;
      const isOwned = runtimeToken
        ? await (this.dependencies.isProcessGroupOwned ?? isProcessGroupOwned)(pid, runtimeToken)
        : false;
      if (!isOwned) {
        return;
      }
    }

    await (this.dependencies.terminateProcessGroup ?? terminateHostProcessGroup)(pid);
    this.processes.delete(ref.id);
  }

  async check(ref: SandboxRef) {
    const managedProcess = this.processes.get(ref.id);
    const childProcess = managedProcess?.process;
    const startupLogs = managedProcess?.logs.trim();
    const startupLogSuffix = startupLogs ? ` Startup logs: ${startupLogs}` : '';
    if (managedProcess?.spawnError) {
      return {
        ready: false,
        url: ref.healthcheckUrl,
        message: `Host preview failed to start: ${managedProcess.spawnError.message}.${startupLogSuffix}`,
      };
    }
    if (childProcess?.exitCode !== null && childProcess?.exitCode !== undefined) {
      return {
        ready: false,
        url: ref.healthcheckUrl,
        message: `Host preview exited with code ${childProcess.exitCode}.${startupLogSuffix}`,
      };
    }

    try {
      const response = await (this.dependencies.fetch ?? fetch)(ref.healthcheckUrl, {
        signal: AbortSignal.timeout(2_000),
      });
      const exitedAfterRequest = this.processes.get(ref.id)?.process;
      if (exitedAfterRequest?.exitCode !== null && exitedAfterRequest?.exitCode !== undefined) {
        return {
          ready: false,
          url: ref.healthcheckUrl,
          message: `Host preview exited with code ${exitedAfterRequest.exitCode}.${startupLogSuffix}`,
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
        message: `${error instanceof Error ? error.message : String(error)}${startupLogSuffix}`,
      };
    }
  }

  private spawn(command: string, args: string[], options: HostSpawnOptions): ChildProcess {
    return this.dependencies.spawn?.(command, args, options) ?? spawn(command, args, options);
  }
}

const execFileAsync = promisify(execFile);

async function isProcessGroupOwned(pid: number, runtimeToken: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync('ps', ['eww', '-p', String(pid), '-o', 'command=']);
    return stdout.includes(`PAIRDOCK_RUNTIME_TOKEN=${runtimeToken}`);
  } catch {
    return false;
  }
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
