import { type ChildProcess, spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import type {
  AgentHarnessEvent,
  AgentHarnessPort,
  ProjectAgentHarnessConfig,
  RunPromptInput,
} from './agent-harness.port.js';

export class CodexHarnessAdapter implements AgentHarnessPort {
  private readonly activeRuns = new Map<string, ChildProcess>();

  constructor(private readonly projectConfigs: Record<string, ProjectAgentHarnessConfig> = {}) {}

  runPrompt(input: RunPromptInput): AsyncIterable<AgentHarnessEvent> {
    if (this.activeRuns.has(input.sessionId)) {
      throw new Error(`An agent harness run is already active for session ${input.sessionId}.`);
    }

    const projectConfig = this.projectConfigs[input.projectKey] ?? {};
    const command = projectConfig.command?.trim() || 'codex';
    const args = buildCommandArgs(projectConfig, input);
    const childProcess = spawn(command, args, {
      cwd: input.worktreePath,
      env: {
        ...process.env,
        PAIRDOCK_MODEL_ID: input.modelId,
        PAIRDOCK_PROJECT_KEY: input.projectKey,
        PAIRDOCK_PROMPT: input.prompt,
        PAIRDOCK_SESSION_ID: input.sessionId,
      },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const queue = new AgentHarnessEventQueue();
    let settled = false;

    this.activeRuns.set(input.sessionId, childProcess);

    const finish = (exitCode: number) => {
      if (settled) {
        return;
      }

      settled = true;
      this.activeRuns.delete(input.sessionId);
      queue.push({ type: 'done', exitCode });
      queue.close();
    };

    const fail = (error: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      this.activeRuns.delete(input.sessionId);
      queue.fail(error);
    };

    childProcess.stdout?.on('data', (chunk: Buffer | string) => {
      queue.push({
        type: 'output',
        stream: 'stdout',
        text: chunk.toString(),
      });
    });
    childProcess.stderr?.on('data', (chunk: Buffer | string) => {
      queue.push({
        type: 'output',
        stream: 'stderr',
        text: chunk.toString(),
      });
    });
    childProcess.once('close', (code: number | null, signal: NodeJS.Signals | null) => {
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
}

function buildCommandArgs(projectConfig: ProjectAgentHarnessConfig, input: RunPromptInput): string[] {
  if (projectConfig.args?.length) {
    return projectConfig.args.map((arg) =>
      arg
        .replaceAll('{{modelId}}', input.modelId)
        .replaceAll('{{projectKey}}', input.projectKey)
        .replaceAll('{{prompt}}', input.prompt)
        .replaceAll('{{sessionId}}', input.sessionId),
    );
  }

  return ['exec', '--model', input.modelId, input.prompt];
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
