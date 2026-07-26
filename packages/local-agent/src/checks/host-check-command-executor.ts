import { type ChildProcess, spawn } from 'node:child_process';
import { terminateHostProcessGroup } from '../process/host-process-group.js';
import { compactValidationLogs } from './validation-log.js';

const CHECK_TIMEOUT_MS = 10 * 60 * 1_000;
const SAFE_HOST_COMMAND_ENVIRONMENT_KEYS = [
  'COLORTERM',
  'HOME',
  'LANG',
  'LC_ALL',
  'LOGNAME',
  'NODE_EXTRA_CA_CERTS',
  'PATH',
  'SHELL',
  'SSL_CERT_DIR',
  'SSL_CERT_FILE',
  'TERM',
  'TMPDIR',
  'USER',
  'XDG_CACHE_HOME',
  'XDG_CONFIG_HOME',
  'XDG_DATA_HOME',
] as const;

interface HostCommandSpawnOptions {
  cwd: string;
  detached: true;
  env: NodeJS.ProcessEnv;
  shell: false;
  stdio: ['ignore', 'pipe', 'pipe'];
}

interface HostCheckCommandExecutorDependencies {
  environment?: NodeJS.ProcessEnv;
  spawn?: (command: string, args: string[], options: HostCommandSpawnOptions) => ChildProcess;
  terminateProcessGroup?: (pid: number) => Promise<void>;
  timeoutMs?: number;
}

export interface HostCheckCommandInput {
  command: string;
  sessionId: string;
  worktreePath: string;
}

export interface HostCheckCommandRunner {
  run(input: HostCheckCommandInput): Promise<{ exitCode: number; logs: string }>;
}

export class HostCheckCommandExecutor implements HostCheckCommandRunner {
  constructor(private readonly dependencies: HostCheckCommandExecutorDependencies = {}) {}

  run(input: HostCheckCommandInput): Promise<{ exitCode: number; logs: string }> {
    if (!input.command.trim() || input.command.length > 8_192 || /[\0\r\n]/.test(input.command)) {
      throw new Error('Host validation command is invalid.');
    }

    return new Promise((resolve, reject) => {
      let logs = '';
      let timedOut = false;
      const childProcess = this.spawn('sh', ['-lc', input.command], {
        cwd: input.worktreePath,
        detached: true,
        env: buildHostCommandEnvironment(this.dependencies.environment ?? process.env, input.sessionId),
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const appendLogs = (chunk: Buffer | string) => {
        logs = compactValidationLogs(`${logs}${chunk.toString()}`);
      };

      childProcess.stdout?.on('data', appendLogs);
      childProcess.stderr?.on('data', appendLogs);
      const timeoutMs = this.dependencies.timeoutMs ?? CHECK_TIMEOUT_MS;
      const timeout = setTimeout(async () => {
        timedOut = true;
        try {
          if (childProcess.pid) {
            await (this.dependencies.terminateProcessGroup ?? terminateHostProcessGroup)(childProcess.pid);
          } else {
            childProcess.kill('SIGTERM');
          }
        } catch (error) {
          reject(error);
        }
      }, timeoutMs);
      timeout.unref();
      childProcess.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      childProcess.once('close', (code: number | null, signal: NodeJS.Signals | null) => {
        clearTimeout(timeout);
        const exitCode = typeof code === 'number' ? code : signal ? 130 : 1;
        const timeoutMessage = timedOut ? `Validation timed out after ${timeoutMs}ms.` : '';
        resolve({ exitCode, logs: [logs.trim(), timeoutMessage].filter(Boolean).join('\n') });
      });
    });
  }

  private spawn(command: string, args: string[], options: HostCommandSpawnOptions): ChildProcess {
    return this.dependencies.spawn?.(command, args, options) ?? spawn(command, args, options);
  }
}

export function buildHostCommandEnvironment(source: NodeJS.ProcessEnv, sessionId: string): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {};

  for (const key of SAFE_HOST_COMMAND_ENVIRONMENT_KEYS) {
    const value = source[key];
    if (value !== undefined) {
      environment[key] = value;
    }
  }

  return {
    ...environment,
    PAIRDOCK_SESSION_ID: sessionId,
  };
}
