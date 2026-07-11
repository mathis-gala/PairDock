import {
  type AgentCancelCommandEnvelope,
  type AgentCommandEnvelope,
  type AgentConnectedEventEnvelope,
  type AgentEventEnvelope,
  type AgentPromptCommandEnvelope,
  agentProtocolMessageEventName,
  type ChecksResultEventEnvelope,
  type GitPushBranchCommandEnvelope,
  type ReadinessCheckCommandEnvelope,
  type SessionCloseCommandEnvelope,
  type SessionPrepareCommandEnvelope,
} from '@pairdock/shared-contracts';
import { io, type Socket } from 'socket.io-client';
import { type CheckResult, ChecksRunner, type ProjectChecksConfig } from '../checks/checks-runner.js';
import type { AgentModelConfig, AgentProjectDescriptor } from '../config/agent-config.js';
import { DiffService } from '../git/diff.service.js';
import { CodexHarnessAdapter } from '../harness/codex-harness.adapter.js';
import type { AgentHarnessPort } from '../harness/index.js';
import { LogRedactor } from '../logging/redactor.js';
import { ReadinessRunner } from '../readiness/readiness-runner.js';
import { SessionRunner } from '../session/session-runner.js';
import {
  buildAgentConnectedEvent,
  buildAgentDoneEvent,
  buildAgentOutputEvent,
  buildChecksResultEvent,
  buildErrorEvent,
  buildGitBranchPushedEvent,
  buildGitDiffEvent,
  buildReadinessResultEvent,
  buildSessionClosedEvent,
  buildSessionProgressEvent,
  buildSessionReadyEvent,
  parseAgentCommandEnvelope,
} from './message-codecs.js';

export interface AgentClientConfig {
  backendUrl: string;
  agentId: string;
  authToken?: string;
  capabilities: string[];
  models?: AgentModelConfig[];
  projects?: AgentProjectDescriptor[];
  projectPaths: Record<string, string>;
  previewConfigs?: Record<string, import('../docker/sandbox.port.js').ProjectPreviewConfig>;
  checksConfigs?: Record<string, ProjectChecksConfig>;
  agentHarnessConfigs?: Record<string, import('../harness/agent-harness.port.js').ProjectAgentHarnessConfig>;
}

export interface AgentClientLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export class AgentClient {
  private socket: Socket | null = null;
  private readonly sessionRunner: SessionRunner;
  private readonly agentHarnessPort: AgentHarnessPort;
  private readonly diffService: DiffService;
  private readonly checksRunner: ChecksRunner;
  private readonly readinessRunner: ReadinessRunner;
  private readonly logRedactor: LogRedactor;

  constructor(
    private readonly config: AgentClientConfig,
    private readonly logger: AgentClientLogger = console,
    dependencies: {
      sessionRunner?: SessionRunner;
      agentHarnessPort?: AgentHarnessPort;
      diffService?: DiffService;
      checksRunner?: ChecksRunner;
      readinessRunner?: ReadinessRunner;
      logRedactor?: LogRedactor;
    } = {},
  ) {
    this.sessionRunner =
      dependencies.sessionRunner ??
      new SessionRunner({
        projectPaths: config.projectPaths,
        previewConfigs: config.previewConfigs,
        logger: this.logger,
      });
    this.agentHarnessPort = dependencies.agentHarnessPort ?? new CodexHarnessAdapter(config.agentHarnessConfigs ?? {});
    this.diffService = dependencies.diffService ?? new DiffService();
    this.checksRunner = dependencies.checksRunner ?? new ChecksRunner(config.checksConfigs ?? {});
    this.readinessRunner =
      dependencies.readinessRunner ??
      new ReadinessRunner({
        authToken: config.authToken,
        projectPaths: config.projectPaths,
        previewConfigs: config.previewConfigs,
        checksConfigs: config.checksConfigs,
        agentHarnessConfigs: config.agentHarnessConfigs,
      });
    this.logRedactor = dependencies.logRedactor ?? new LogRedactor();
  }

  async start(): Promise<void> {
    if (this.socket) {
      throw new Error('AgentClient is already running.');
    }

    const socket = io(`${this.config.backendUrl}/agent`, {
      autoConnect: false,
      extraHeaders: this.config.authToken
        ? {
            Authorization: `Bearer ${this.config.authToken}`,
          }
        : undefined,
      reconnection: true,
      transports: ['websocket'],
    });

    this.socket = socket;
    socket.on('connect', () => {
      const event = buildAgentConnectedEvent({
        agentId: this.config.agentId,
        capabilities: this.config.capabilities,
        models: this.config.models ?? [],
        projects: this.config.projects ?? [],
      });

      socket.emit(agentProtocolMessageEventName, event);
      void this.publishConfiguredProjectReadiness();
      this.logger.info(
        `Connected agent ${event.payload.agentId} to ${this.config.backendUrl} with ${event.payload.capabilities.length} capabilities.`,
      );
    });
    socket.on('disconnect', (reason: string) => {
      this.logger.warn(`Disconnected from PairDock backend: ${reason}.`);
    });
    socket.on(
      agentProtocolMessageEventName,
      (payload: unknown, acknowledge?: (response: { accepted: boolean; error?: string }) => void) => {
        void this.handleProtocolMessage(payload)
          .then(() => {
            acknowledge?.({ accepted: true });
          })
          .catch((error: unknown) => {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`Agent command handling failed: ${message}`);
            acknowledge?.({ accepted: false, error: message });
          });
      },
    );

    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        socket.off('connect', onConnect);
        socket.off('connect_error', onError);
      };

      const onConnect = () => {
        cleanup();
        resolve();
      };

      const onError = (error: Error) => {
        cleanup();
        this.socket = null;
        socket.close();
        reject(error);
      };

      socket.once('connect', onConnect);
      socket.once('connect_error', onError);
      socket.connect();
    });
  }

  async stop(): Promise<void> {
    if (!this.socket) {
      return;
    }

    const socket = this.socket;
    this.socket = null;

    await new Promise<void>((resolve) => {
      if (!socket.connected) {
        socket.close();
        resolve();
        return;
      }

      socket.once('disconnect', () => resolve());
      socket.close();
    });
  }

  private async handleProtocolMessage(payload: unknown): Promise<void> {
    let command: AgentCommandEnvelope;

    try {
      command = parseAgentCommandEnvelope(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Rejected invalid backend command: ${message}`);
      return;
    }

    this.logger.info(this.describeCommand(command));

    switch (command.type) {
      case 'session.prepare':
        await this.handleSessionPrepare(command);
        return;
      case 'readiness.check':
        await this.handleReadinessCheck(command);
        return;
      case 'session.close':
        await this.handleSessionClose(command);
        return;
      case 'agent.prompt':
        await this.handleAgentPrompt(command);
        return;
      case 'agent.cancel':
        await this.handleAgentCancel(command);
        return;
      case 'git.pushBranch':
        await this.handleGitPushBranch(command);
        return;
      default:
        return;
    }
  }

  private describeCommand(command: AgentCommandEnvelope): string {
    return `Received backend command ${command.type}${command.sessionId ? ` for session ${command.sessionId}` : ''}.`;
  }

  private async publishConfiguredProjectReadiness(): Promise<void> {
    for (const projectKey of Object.keys(this.config.projectPaths)) {
      try {
        const result = await this.readinessRunner.run({ projectKey });
        await this.emitEvent(buildReadinessResultEvent(result));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Readiness check failed for project ${projectKey}: ${message}`);
      }
    }
  }

  private async handleReadinessCheck(command: ReadinessCheckCommandEnvelope): Promise<void> {
    this.logger.info(`Running readiness check for project ${command.payload.projectKey}.`);
    const result = await this.readinessRunner.run({
      projectKey: command.payload.projectKey,
      sessionId: command.payload.sessionId,
    });
    this.logger.info(`Publishing readiness result for project ${result.projectKey}.`);
    await this.emitEvent(buildReadinessResultEvent(result));
  }

  private async handleSessionPrepare(command: SessionPrepareCommandEnvelope): Promise<void> {
    try {
      await this.emitEvent(
        buildSessionProgressEvent({
          sessionId: command.sessionId,
          status: 'AGENT_CONNECTING',
        }),
      );

      const workspace = await this.sessionRunner.prepare(command, {
        onProgress: async (status, message) => {
          await this.emitEvent(
            buildSessionProgressEvent({
              sessionId: command.sessionId,
              status,
              ...(message ? { message } : {}),
            }),
          );
        },
      });

      await this.emitEvent(
        buildSessionReadyEvent({
          previewUrl: workspace.previewUrl ?? '',
          sessionId: command.sessionId,
        }),
      );
    } catch (error) {
      const retryable = isRetryableError(error);
      await this.emitError('session.preview.failed', command.sessionId, error, retryable);
    }
  }

  private async handleSessionClose(command: SessionCloseCommandEnvelope): Promise<void> {
    try {
      const result = await this.sessionRunner.close(command);

      await this.emitEvent(
        buildSessionClosedEvent({
          sessionId: command.sessionId,
          cleaned: result.cleaned,
        }),
      );
    } catch (error) {
      await this.emitError('session.close.failed', command.sessionId, error, false);
      throw error;
    }
  }

  private async handleAgentPrompt(command: AgentPromptCommandEnvelope): Promise<void> {
    const workspace = this.sessionRunner.findWorkspace(command.sessionId);

    if (!workspace) {
      await this.emitError(
        'agent.prompt.failed',
        command.sessionId,
        new Error(`Session ${command.sessionId} is not prepared on this agent.`),
        false,
      );
      return;
    }

    try {
      let exitCode: number | null = null;

      await this.emitEvent(
        buildSessionProgressEvent({
          sessionId: command.sessionId,
          status: 'AGENT_RUNNING',
        }),
      );

      for await (const event of this.agentHarnessPort.runPrompt({
        sessionId: command.sessionId,
        projectKey: workspace.projectKey,
        prompt: command.payload.prompt,
        modelId: command.payload.modelId,
        worktreePath: workspace.worktreePath,
      })) {
        if (event.type === 'output') {
          await this.emitEvent(
            buildAgentOutputEvent({
              sessionId: command.sessionId,
              stream: event.stream,
              text: this.logRedactor.redact(event.text),
            }),
          );
          continue;
        }

        exitCode = event.exitCode;
      }

      if (exitCode === null) {
        throw new Error(`Agent harness completed without a final done event for session ${command.sessionId}.`);
      }

      await this.emitEvent(
        buildAgentDoneEvent({
          sessionId: command.sessionId,
          exitCode,
        }),
      );

      const diff = await this.diffService.collect(workspace.worktreePath);

      if (diff.changedFiles.length > 0) {
        await this.emitEvent(
          buildGitDiffEvent({
            sessionId: command.sessionId,
            diff: diff.diff,
            changedFiles: diff.changedFiles,
          }),
        );
      }

      await this.emitEvent(
        buildChecksResultEvent({
          sessionId: command.sessionId,
          result: this.redactChecksResult(
            await this.checksRunner.run({
              projectKey: workspace.projectKey,
              previewUrl: workspace.previewUrl,
              worktreePath: workspace.worktreePath,
            }),
          ),
        }),
      );
    } catch (error) {
      await this.emitError('agent.prompt.failed', command.sessionId, error, false);
    }
  }

  private async handleAgentCancel(command: AgentCancelCommandEnvelope): Promise<void> {
    try {
      await this.agentHarnessPort.cancel(command.sessionId);
    } catch (error) {
      await this.emitError('agent.cancel.failed', command.sessionId, error, false);
    }
  }

  private async handleGitPushBranch(command: GitPushBranchCommandEnvelope): Promise<void> {
    try {
      const result = await this.sessionRunner.pushBranch(command);
      await this.emitEvent(
        buildGitBranchPushedEvent({
          sessionId: command.sessionId,
          branchName: result.branchName,
        }),
      );
    } catch (error) {
      await this.emitError('git.pushBranch.failed', command.sessionId, error, false);
    }
  }

  private redactChecksResult(
    checks: Awaited<ReturnType<ChecksRunner['run']>>,
  ): Omit<ChecksResultEventEnvelope['payload'], 'sessionId'> {
    return {
      ok: checks.ok,
      build: this.redactCheckResult(checks.build),
      tests: this.redactCheckResult(checks.tests),
      lint: this.redactCheckResult(checks.lint),
      preview: this.redactCheckResult(checks.preview),
    };
  }

  private redactCheckResult(check: CheckResult) {
    return {
      status: check.status,
      ...(check.command ? { command: check.command } : {}),
      ...(check.logs ? { logs: this.logRedactor.redact(check.logs) } : {}),
    };
  }

  private async emitError(
    code: string,
    sessionId: string | undefined,
    error: unknown,
    retryable: boolean,
  ): Promise<void> {
    const message = this.logRedactor.redact(error instanceof Error ? error.message : String(error));
    await this.emitEvent(
      buildErrorEvent({
        code,
        message,
        retryable,
        sessionId,
      }),
    );
  }

  private async emitEvent(event: AgentEventEnvelope): Promise<void> {
    if (!this.socket) {
      throw new Error('AgentClient socket is not connected.');
    }

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        this.logger.warn(`PairDock backend did not acknowledge ${event.type} within 5000ms.`);
        resolve();
      }, 5_000);

      this.socket?.emit(agentProtocolMessageEventName, event, (response?: { accepted?: boolean; error?: string }) => {
        clearTimeout(timeout);

        if (response?.accepted === false) {
          this.logger.warn(`PairDock backend rejected ${event.type}: ${response.error ?? 'unknown error'}`);
        }

        resolve();
      });
    });
  }
}

function isRetryableError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'retryable' in error && error.retryable === true);
}

export type { AgentConnectedEventEnvelope };
