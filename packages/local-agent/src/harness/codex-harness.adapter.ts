import { type ChildProcess, spawn } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { basename, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import type {
  AgentHarnessEvent,
  AgentHarnessPort,
  ProjectAgentHarnessConfig,
  RunPromptInput,
} from './agent-harness.port.js';

const SAFE_HARNESS_ENVIRONMENT_KEYS = [
  'CODEX_HOME',
  'COLORTERM',
  'HOME',
  'LANG',
  'LC_ALL',
  'LOGNAME',
  'NODE_EXTRA_CA_CERTS',
  'OPENAI_BASE_URL',
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

export class CodexHarnessAdapter implements AgentHarnessPort {
  private readonly activeRuns = new Map<string, ChildProcess>();
  private readonly codexThreadIds = new Map<string, string>();

  constructor(private readonly projectConfigs: Record<string, ProjectAgentHarnessConfig> = {}) {}

  runPrompt(input: RunPromptInput): AsyncIterable<AgentHarnessEvent> {
    if (this.activeRuns.has(input.sessionId)) {
      throw new Error(`An agent harness run is already active for session ${input.sessionId}.`);
    }

    const projectConfig = this.projectConfigs[input.projectKey] ?? {};
    const command = projectConfig.command?.trim() || 'codex';
    const usesCodexJsonProtocol = !projectConfig.args?.length && isCodexCommand(command);
    const args = buildCommandArgs(projectConfig, input, this.codexThreadIds.get(input.sessionId));
    const environment = buildHarnessEnvironment(process.env, input);
    const harnessTempDirectory = environment.TMPDIR;

    if (!harnessTempDirectory) {
      throw new Error('PairDock could not configure an isolated temporary directory for the agent harness.');
    }

    mkdirSync(harnessTempDirectory, { recursive: true, mode: 0o700 });
    const childProcess = spawn(command, args, {
      cwd: input.worktreePath,
      env: environment,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const queue = new AgentHarnessEventQueue();
    let stdoutBuffer = '';
    let settled = false;

    this.activeRuns.set(input.sessionId, childProcess);

    const finish = (exitCode: number) => {
      if (settled) {
        return;
      }

      settled = true;
      this.activeRuns.delete(input.sessionId);
      rmSync(harnessTempDirectory, { recursive: true, force: true });
      queue.push({ type: 'done', exitCode });
      queue.close();
    };

    const fail = (error: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      this.activeRuns.delete(input.sessionId);
      rmSync(harnessTempDirectory, { recursive: true, force: true });
      queue.fail(error);
    };

    childProcess.stdout?.on('data', (chunk: Buffer | string) => {
      if (!usesCodexJsonProtocol) {
        queue.push({ type: 'output', stream: 'stdout', text: chunk.toString() });
        return;
      }

      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop() ?? '';
      for (const line of lines) {
        this.handleCodexJsonLine(input.sessionId, line, queue);
      }
    });
    childProcess.stderr?.on('data', (chunk: Buffer | string) => {
      queue.push({
        type: 'output',
        stream: 'stderr',
        text: chunk.toString(),
      });
    });
    childProcess.once('close', (code: number | null, signal: NodeJS.Signals | null) => {
      if (usesCodexJsonProtocol && stdoutBuffer.trim()) {
        this.handleCodexJsonLine(input.sessionId, stdoutBuffer, queue);
      }
      finish(normalizeExitCode(code, signal));
    });
    childProcess.once('error', (error: Error) => {
      fail(error);
    });

    return queue;
  }

  async cancel(sessionId: string): Promise<void> {
    const activeRun = this.activeRuns.get(sessionId);

    if (!activeRun || activeRun.exitCode !== null) {
      return;
    }

    activeRun.kill('SIGTERM');
    await Promise.race([onceExit(activeRun), delay(1_000)]);

    if (activeRun.exitCode === null) {
      activeRun.kill('SIGKILL');
    }
  }

  private handleCodexJsonLine(sessionId: string, line: string, queue: AgentHarnessEventQueue): void {
    const event = parseCodexJsonLine(line);

    if (event.type === 'thread') {
      this.codexThreadIds.set(sessionId, event.threadId);
      return;
    }

    if (event.type === 'message') {
      queue.push({ type: 'output', stream: 'stdout', text: event.text });
      return;
    }

    if (event.type === 'error') {
      queue.push({ type: 'output', stream: 'stderr', text: `ERROR: ${event.message}` });
    }
  }
}

export function buildHarnessEnvironment(source: NodeJS.ProcessEnv, input: RunPromptInput): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {};

  for (const key of SAFE_HARNESS_ENVIRONMENT_KEYS) {
    const value = source[key];
    if (value !== undefined) {
      environment[key] = value;
    }
  }

  const harnessTempDirectory = resolveHarnessTempDirectory(input.sessionId);

  return {
    ...environment,
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    PAIRDOCK_MODEL_ID: input.modelId,
    PAIRDOCK_REASONING_EFFORT: input.reasoningEffort ?? 'medium',
    PAIRDOCK_PROJECT_KEY: input.projectKey,
    PAIRDOCK_PROMPT: input.prompt,
    PAIRDOCK_SESSION_ID: input.sessionId,
    TMPDIR: harnessTempDirectory,
    XDG_CACHE_HOME: join(harnessTempDirectory, 'cache'),
    XDG_CONFIG_HOME: join(harnessTempDirectory, 'config'),
    XDG_DATA_HOME: join(harnessTempDirectory, 'data'),
  };
}

export function buildCommandArgs(
  projectConfig: ProjectAgentHarnessConfig,
  input: RunPromptInput,
  codexThreadId?: string,
): string[] {
  const reasoningEffort = input.reasoningEffort ?? 'medium';
  const codexSecurityArgs = buildCodexSecurityArgs(input.sessionId);

  if (projectConfig.args?.length) {
    return projectConfig.args.map((arg) =>
      arg
        .replaceAll('{{modelId}}', input.modelId)
        .replaceAll('{{reasoningEffort}}', reasoningEffort)
        .replaceAll('{{projectKey}}', input.projectKey)
        .replaceAll('{{prompt}}', input.prompt)
        .replaceAll('{{sessionId}}', input.sessionId),
    );
  }

  if (codexThreadId) {
    return [
      'exec',
      ...codexSecurityArgs,
      'resume',
      '--json',
      '--model',
      input.modelId,
      '--config',
      `model_reasoning_effort="${reasoningEffort}"`,
      codexThreadId,
      input.prompt,
    ];
  }

  return [
    'exec',
    ...codexSecurityArgs,
    '--json',
    '--model',
    input.modelId,
    '--config',
    `model_reasoning_effort="${reasoningEffort}"`,
    input.prompt,
  ];
}

function buildCodexSecurityArgs(sessionId: string): string[] {
  const harnessTempDirectory = resolveHarnessTempDirectory(sessionId);
  const cacheDirectory = join(harnessTempDirectory, 'cache');
  const configDirectory = join(harnessTempDirectory, 'config');
  const dataDirectory = join(harnessTempDirectory, 'data');

  return [
    '--ignore-user-config',
    '--config',
    'approval_policy="never"',
    '--config',
    'default_permissions="pairdock-restricted"',
    '--config',
    `permissions.pairdock-restricted.filesystem={":minimal"="read",${JSON.stringify(harnessTempDirectory)}="write","/System/Library/OpenSSL"="read","~/.agents/skills"="read","~/.codex/skills"="read",":workspace_roots"={"."="write","**/.env"="deny","**/.env.local"="deny","**/.env.*.local"="deny","**/.npmrc"="deny","**/.netrc"="deny","**/.pypirc"="deny","**/*.pem"="deny","**/*.key"="deny","**/*.p12"="deny","**/*.pfx"="deny"}}`,
    '--config',
    'permissions.pairdock-restricted.network.enabled=false',
    '--config',
    `shell_environment_policy.set={GIT_CONFIG_GLOBAL="/dev/null",GIT_CONFIG_NOSYSTEM="1",TMPDIR="${harnessTempDirectory}",XDG_CACHE_HOME="${cacheDirectory}",XDG_CONFIG_HOME="${configDirectory}",XDG_DATA_HOME="${dataDirectory}"}`,
  ];
}

function resolveHarnessTempDirectory(sessionId: string): string {
  return join('/tmp', 'pairdock', sessionId);
}

export type ParsedCodexJsonLine =
  | { type: 'thread'; threadId: string }
  | { type: 'message'; text: string }
  | { type: 'error'; message: string }
  | { type: 'ignored' };

export function parseCodexJsonLine(line: string): ParsedCodexJsonLine {
  try {
    const event = JSON.parse(line) as Record<string, unknown>;

    if (event.type === 'thread.started' && typeof event.thread_id === 'string') {
      return { type: 'thread', threadId: event.thread_id };
    }

    if (event.type === 'item.completed' && isRecord(event.item)) {
      const item = event.item;
      if (item.type === 'agent_message' && typeof item.text === 'string' && item.text.trim()) {
        return { type: 'message', text: item.text.trim() };
      }
    }

    if ((event.type === 'error' || event.type === 'turn.failed') && typeof event.message === 'string') {
      return { type: 'error', message: event.message };
    }
  } catch {
    return { type: 'ignored' };
  }

  return { type: 'ignored' };
}

function isCodexCommand(command: string): boolean {
  return basename(command) === 'codex';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeExitCode(code: number | null, signal: NodeJS.Signals | null): number {
  if (typeof code === 'number') {
    return code;
  }

  return signal ? 130 : 1;
}

async function onceExit(process: ChildProcess): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    process.once('close', () => resolve());
    process.once('error', reject);
  });
}

class AgentHarnessEventQueue implements AsyncIterable<AgentHarnessEvent> {
  private readonly values: AgentHarnessEvent[] = [];
  private readonly waiters: Array<(result: IteratorResult<AgentHarnessEvent, void>) => void> = [];
  private closed = false;
  private failure: Error | null = null;

  push(value: AgentHarnessEvent): void {
    if (this.closed || this.failure) {
      return;
    }

    const waiter = this.waiters.shift();
    if (waiter) {
      waiter({ done: false, value });
      return;
    }

    this.values.push(value);
  }

  close(): void {
    this.closed = true;
    while (this.waiters.length > 0) {
      this.waiters.shift()?.({ done: true, value: undefined });
    }
  }

  fail(error: Error): void {
    this.failure = error;
    this.closed = true;
    while (this.waiters.length > 0) {
      this.waiters.shift()?.({ done: true, value: undefined });
    }
  }

  [Symbol.asyncIterator](): AsyncIterator<AgentHarnessEvent, void> {
    return {
      next: async (): Promise<IteratorResult<AgentHarnessEvent, void>> => {
        if (this.values.length > 0) {
          const value = this.values.shift();
          if (value) {
            return { done: false, value };
          }
        }

        if (this.failure) {
          throw this.failure;
        }

        if (this.closed) {
          return { done: true, value: undefined };
        }

        return new Promise<IteratorResult<AgentHarnessEvent, void>>((resolve) => {
          this.waiters.push(resolve);
        }).then((result) => {
          if (result.done && this.failure) {
            throw this.failure;
          }

          return result;
        });
      },
    };
  }
}

export type { AgentHarnessEvent, ProjectAgentHarnessConfig, RunPromptInput } from './agent-harness.port.js';
