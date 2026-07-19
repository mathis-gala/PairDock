import { spawn } from 'node:child_process';

export interface ProjectChecksConfig {
  build?: string;
  test?: string;
  lint?: string;
}

export interface CheckResult {
  status: 'passed' | 'failed' | 'skipped';
  command?: string;
  logs?: string;
}

export interface ChecksResult {
  ok: boolean;
  build: CheckResult;
  tests: CheckResult;
  lint: CheckResult;
  preview: CheckResult;
}

export interface RunChecksInput {
  projectKey: string;
  previewUrl?: string | null;
  worktreePath: string;
}

const MAX_LOG_CHARS = 4_000;

export class ChecksRunner {
  constructor(private readonly projectChecks: Record<string, ProjectChecksConfig> = {}) {}

  async run(input: RunChecksInput): Promise<ChecksResult> {
    const projectChecks = this.projectChecks[input.projectKey] ?? {};
    const build = await this.runCommandCheck(projectChecks.build, input.worktreePath, 'build');
    const tests = await this.runCommandCheck(projectChecks.test, input.worktreePath, 'test');
    const lint = await this.runCommandCheck(projectChecks.lint, input.worktreePath, 'lint');
    const preview = await this.runPreviewCheck(input.previewUrl);
    const ok = [build, tests, lint, preview].every((check) => check.status === 'passed');

    return {
      ok,
      build,
      tests,
      lint,
      preview,
    };
  }

  private async runCommandCheck(command: string | undefined, cwd: string, label: string): Promise<CheckResult> {
    if (!command) {
      return {
        status: 'skipped',
        logs: `No ${label} command configured.`,
      };
    }

    const firstAttempt = await this.runCommandAttempt(command, cwd);

    if (firstAttempt.status !== 'failed' || !isTransientPackageExtractionFailure(firstAttempt.logs)) {
      return firstAttempt;
    }

    const retry = await this.runCommandAttempt(command, cwd);
    const retryNotice = 'Retry 1/1 after a transient package extraction failure.';
    const logs = [firstAttempt.logs, retryNotice, retry.logs].filter(Boolean).join('\n').trim();

    return {
      ...retry,
      ...(logs ? { logs: logs.slice(-MAX_LOG_CHARS) } : {}),
    };
  }

  private runCommandAttempt(command: string, cwd: string): Promise<CheckResult> {
    return new Promise<CheckResult>((resolve, reject) => {
      let logs = '';
      const child = spawn(command, {
        cwd,
        env: process.env,
        shell: true,
      });

      child.stdout.on('data', (chunk: Buffer | string) => {
        logs = appendLogs(logs, chunk.toString());
      });
      child.stderr.on('data', (chunk: Buffer | string) => {
        logs = appendLogs(logs, chunk.toString());
      });
      child.on('error', reject);
      child.on('close', (code, signal) => {
        const resultLogs = logs.trim() || (signal ? `Process terminated with signal ${signal}.` : undefined);
        resolve({
          status: code === 0 ? 'passed' : 'failed',
          command,
          ...(resultLogs ? { logs: resultLogs } : {}),
        });
      });
    });
  }

  private async runPreviewCheck(previewUrl: string | null | undefined): Promise<CheckResult> {
    if (!previewUrl) {
      return {
        status: 'failed',
        logs: 'Preview URL is not available.',
      };
    }

    try {
      const response = await fetch(previewUrl);

      if (!response.ok) {
        return {
          status: 'failed',
          logs: `Preview responded with HTTP ${response.status}.`,
        };
      }

      return {
        status: 'passed',
      };
    } catch (error) {
      return {
        status: 'failed',
        logs: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

function isTransientPackageExtractionFailure(logs: string | undefined): boolean {
  return /fail extracting tarball for/i.test(logs ?? '');
}

function appendLogs(current: string, next: string): string {
  const combined = `${current}${next}`;

  if (combined.length <= MAX_LOG_CHARS) {
    return combined;
  }

  return combined.slice(-MAX_LOG_CHARS);
}
