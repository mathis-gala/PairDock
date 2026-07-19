import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import type { ToolReadinessCheck } from '@pairdock/shared-contracts';
import type { ProjectChecksConfig } from '../checks/checks-runner.js';
import { compareVersions } from '../config/codex-model-catalog.js';
import type { ProjectPreviewConfig } from '../docker/sandbox.port.js';
import type { ProjectAgentHarnessConfig } from '../harness/agent-harness.port.js';

interface ReadinessRunnerConfig {
  authToken?: string;
  projectPaths: Record<string, string>;
  previewConfigs?: Record<string, ProjectPreviewConfig>;
  checksConfigs?: Record<string, ProjectChecksConfig>;
  agentHarnessConfigs?: Record<string, ProjectAgentHarnessConfig>;
  commandTimeoutMs?: number;
}

interface CommandResult {
  ok: boolean;
  output: string;
}

type CommandRunner = (command: string, args: string[], cwd?: string) => Promise<CommandResult>;

const MINIMUM_RESTRICTED_CODEX_VERSION = '0.138.0';

export interface RunReadinessInput {
  projectKey: string;
  sessionId?: string;
}

export interface ReadinessResult {
  projectKey: string;
  sessionId?: string;
  ok: boolean;
  checks: ToolReadinessCheck[];
}

export class ReadinessRunner {
  private readonly commandTimeoutMs: number;

  constructor(
    private readonly config: ReadinessRunnerConfig,
    private readonly commandRunner: CommandRunner = runCommand,
  ) {
    this.commandTimeoutMs = config.commandTimeoutMs ?? 10_000;
  }

  async run(input: RunReadinessInput): Promise<ReadinessResult> {
    const repositoryPath = this.config.projectPaths[input.projectKey];
    const checks: ToolReadinessCheck[] = [
      this.checkAgent(),
      await this.checkGitCli(),
      await this.checkRepository(repositoryPath),
      await this.checkSourceControl(repositoryPath),
      await this.checkAgentHarness(input.projectKey),
      await this.checkDocker(input.projectKey),
      this.checkPreviewTunnel(input.projectKey),
      this.checkProjectCommands(input.projectKey),
    ];

    return {
      projectKey: input.projectKey,
      ...(input.sessionId ? { sessionId: input.sessionId } : {}),
      ok: checks.every((check) => !check.required || check.status === 'passed'),
      checks,
    };
  }

  private checkAgent(): ToolReadinessCheck {
    return this.config.authToken
      ? passed('agent', true, 'Local agent is connected with an auth token.')
      : failed(
          'agent',
          true,
          'Local agent auth token is not configured.',
          'Run pairdock-agent login with an agent token.',
        );
  }

  private async checkGitCli(): Promise<ToolReadinessCheck> {
    const result = await this.runDeveloperCommand('git', ['--version']);
    return result.ok
      ? passed('git', true, 'Git CLI is available.')
      : failed(
          'git',
          true,
          failureMessage('Git CLI is unavailable.', result),
          'Install Git and ensure git is on PATH.',
        );
  }

  private async checkRepository(repositoryPath: string | undefined): Promise<ToolReadinessCheck> {
    if (!repositoryPath) {
      return failed(
        'repository',
        true,
        'No local repository path is configured for this project.',
        'Configure a local repository path in the PairDock agent config.',
      );
    }

    try {
      await access(repositoryPath);
    } catch {
      return failed(
        'repository',
        true,
        'Configured repository path is not accessible.',
        'Update the project path in the PairDock agent config.',
      );
    }

    const result = await this.runDeveloperCommand('git', ['rev-parse', '--is-inside-work-tree'], repositoryPath);
    return result.ok
      ? passed('repository', true, 'Configured project path is a Git repository.')
      : failed(
          'repository',
          true,
          failureMessage('Configured project path is not a Git repository.', result),
          'Choose a project path inside the Git repository you want PairDock to edit.',
        );
  }

  private async checkSourceControl(repositoryPath: string | undefined): Promise<ToolReadinessCheck> {
    if (!repositoryPath) {
      return failed(
        'source-control',
        true,
        'Source-control remote cannot be checked without a repository path.',
        'Configure a local repository path first.',
      );
    }

    const result = await this.runDeveloperCommand('git', ['remote', 'get-url', 'origin'], repositoryPath);
    return result.ok
      ? passed('source-control', true, 'Source-control origin remote is configured.')
      : failed(
          'source-control',
          true,
          failureMessage('Source-control origin remote is missing.', result),
          'Add an origin remote that matches the configured source-control repository.',
        );
  }

  private async checkAgentHarness(projectKey: string): Promise<ToolReadinessCheck> {
    const command = this.config.agentHarnessConfigs?.[projectKey]?.command ?? 'codex';
    const executable = command.trim().split(/\s+/)[0];
    const result = await this.runDeveloperCommand('sh', ['-c', `command -v ${shellQuote(executable)}`]);

    if (!result.ok) {
      return failed(
        'agent-harness',
        true,
        failureMessage('Agent harness command is unavailable.', result),
        'Install or authenticate the configured agent harness, then rerun readiness checks.',
      );
    }

    if (isCodexExecutable(executable)) {
      const versionResult = await this.runDeveloperCommand(executable, ['--version']);
      const version = versionResult.output.match(/\d+\.\d+\.\d+/)?.[0];

      if (!versionResult.ok || !version || compareVersions(version, MINIMUM_RESTRICTED_CODEX_VERSION) < 0) {
        return failed(
          'agent-harness',
          true,
          `Codex CLI ${version ?? 'unknown'} is too old; PairDock requires ${MINIMUM_RESTRICTED_CODEX_VERSION} or newer for restricted filesystem permissions.`,
          'Run "codex update", restart pairdock-agent, then rerun readiness checks.',
        );
      }
    }

    return passed('agent-harness', true, 'Agent harness command is available.');
  }

  private async checkDocker(projectKey: string): Promise<ToolReadinessCheck> {
    void projectKey;
    const result = await this.runDeveloperCommand('docker', ['info']);

    if (result.ok) {
      return passed('docker', true, 'Docker is available.');
    }

    return failed(
      'docker',
      true,
      failureMessage('Docker is unavailable.', result),
      'Start Docker Desktop and rerun readiness checks.',
    );
  }

  private checkPreviewTunnel(projectKey: string): ToolReadinessCheck {
    const tunnelConfig = this.config.previewConfigs?.[projectKey]?.tunnel;

    if (tunnelConfig?.publicUrl || tunnelConfig?.provider === 'cloudflare') {
      return passed('preview-tunnel', false, 'Preview tunnel is configured.');
    }

    return warning(
      'preview-tunnel',
      false,
      'Preview tunnel is optional for this project.',
      'Configure a tunnel before sharing previews outside the local network.',
    );
  }

  private checkProjectCommands(projectKey: string): ToolReadinessCheck {
    const checksConfig = this.config.checksConfigs?.[projectKey];
    const configured = [checksConfig?.build, checksConfig?.test, checksConfig?.lint].filter(Boolean).length;

    return configured === 3
      ? passed('project-commands', true, 'Build, test, and lint commands are configured.')
      : failed(
          'project-commands',
          true,
          'Build, test, and lint commands are not fully configured.',
          'Add build, test, and lint commands to pairdock.yml.',
        );
  }

  private async runDeveloperCommand(command: string, args: string[], cwd?: string): Promise<CommandResult> {
    let timeout: NodeJS.Timeout | undefined;
    const timeoutResult = new Promise<CommandResult>((resolve) => {
      timeout = setTimeout(() => {
        resolve({
          ok: false,
          output: `${command} ${args.join(' ')} timed out after ${this.commandTimeoutMs}ms.`,
        });
      }, this.commandTimeoutMs);
    });

    try {
      return await Promise.race([this.commandRunner(command, args, cwd), timeoutResult]);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }
}

function passed(key: ToolReadinessCheck['key'], required: boolean, message: string): ToolReadinessCheck {
  return { key, status: 'passed', required, message, remediation: null };
}

function warning(
  key: ToolReadinessCheck['key'],
  required: boolean,
  message: string,
  remediation: string,
): ToolReadinessCheck {
  return { key, status: 'warning', required, message, remediation };
}

function failed(
  key: ToolReadinessCheck['key'],
  required: boolean,
  message: string,
  remediation: string,
): ToolReadinessCheck {
  return { key, status: 'failed', required, message, remediation };
}

function failureMessage(defaultMessage: string, result: CommandResult): string {
  return result.output ? `${defaultMessage} ${result.output}` : defaultMessage;
}

function runCommand(command: string, args: string[], cwd?: string): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';

    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.on('error', (error) => {
      resolve({ ok: false, output: error.message });
    });
    child.on('close', (exitCode) => {
      resolve({ ok: exitCode === 0, output: output.trim() });
    });
  });
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function isCodexExecutable(executable: string): boolean {
  return executable.split(/[\\/]/).at(-1) === 'codex';
}
