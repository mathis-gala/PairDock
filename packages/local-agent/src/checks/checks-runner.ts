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
  sessionId: string;
}

export type CheckCommandExecutor = (input: {
  command: string;
  sessionId: string;
}) => Promise<{ exitCode: number; logs: string }>;

const MAX_LOG_CHARS = 4_000;

export class ChecksRunner {
  constructor(
    private readonly projectChecks: Record<string, ProjectChecksConfig> = {},
    private readonly commandExecutor?: CheckCommandExecutor,
  ) {}

  async run(input: RunChecksInput): Promise<ChecksResult> {
    const projectChecks = this.projectChecks[input.projectKey] ?? {};
    const build = await this.runCommandCheck(projectChecks.build, input.sessionId, 'build');
    const tests = await this.runCommandCheck(projectChecks.test, input.sessionId, 'test');
    const lint = await this.runCommandCheck(projectChecks.lint, input.sessionId, 'lint');
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

  private async runCommandCheck(command: string | undefined, sessionId: string, label: string): Promise<CheckResult> {
    if (!command) {
      return {
        status: 'skipped',
        logs: `No ${label} command configured.`,
      };
    }

    const firstAttempt = await this.runCommandAttempt(command, sessionId);

    if (firstAttempt.status !== 'failed' || !isTransientPackageExtractionFailure(firstAttempt.logs)) {
      return firstAttempt;
    }

    const retry = await this.runCommandAttempt(command, sessionId);
    const retryNotice = 'Retry 1/1 after a transient package extraction failure.';
    const logs = [firstAttempt.logs, retryNotice, retry.logs].filter(Boolean).join('\n').trim();

    return {
      ...retry,
      ...(logs ? { logs: logs.slice(-MAX_LOG_CHARS) } : {}),
    };
  }

  private async runCommandAttempt(command: string, sessionId: string): Promise<CheckResult> {
    if (!this.commandExecutor) {
      throw new Error('Validation command executor is not configured. Refusing to run checks on the host.');
    }

    const result = await this.commandExecutor({ command, sessionId });
    const logs = result.logs.trim();

    return {
      status: result.exitCode === 0 ? 'passed' : 'failed',
      command,
      ...(logs ? { logs: logs.slice(-MAX_LOG_CHARS) } : {}),
    };
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
