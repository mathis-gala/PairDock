import {
  type AgentCancelCommandEnvelope,
  type AgentCommandEnvelope,
  type AgentConnectedEventEnvelope,
  type AgentEventEnvelope,
  type AgentPromptCommandEnvelope,
  agentProtocolMessageEventName,
  type GitPushBranchCommandEnvelope,
  type ReadinessCheckCommandEnvelope,
  type SessionCloseCommandEnvelope,
  type SessionPrepareCommandEnvelope,
} from '@pairdock/shared-contracts';
import { io, type Socket } from 'socket.io-client';
import { PromptAttachmentDownloader } from '../attachments/prompt-attachment-downloader.js';
import { ChecksRunner, type ProjectChecksConfig } from '../checks/checks-runner.js';
import type { AgentModelConfig, AgentProjectDescriptor } from '../config/agent-config.js';
import { DiffService } from '../git/diff.service.js';
import { CodexHarnessAdapter } from '../harness/codex-harness.adapter.js';
import type { AgentHarnessPort } from '../harness/index.js';
import { LogRedactor } from '../logging/redactor.js';
import { ReadinessRunner } from '../readiness/readiness-runner.js';
import { type PromptExecutionEvent, PromptRunner, type PromptRunnerLogger } from '../session/prompt-runner.js';
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
  buildSessionRecoveredEvent,
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

export type AgentClientLogger = PromptRunnerLogger;

export interface AgentClientStatus {
  status: 'starting' | 'online' | 'reconnecting' | 'error' | 'stopped';
  busy: boolean;
  message?: string;
}

class BackendEventRejectedError extends Error {
  constructor(eventType: AgentEventEnvelope['type'], message: string) {
    super(`PairDock backend rejected ${eventType}: ${message}`);
    this.name = 'BackendEventRejectedError';
  }
}

export class AgentClient {
  private socket: Socket | null = null;
  private readonly sessionRunner: SessionRunner;
  private readonly promptRunner: PromptRunner;
  private readonly readinessRunner: ReadinessRunner;
  private readonly logRedactor: LogRedactor;
  private readonly onStatus?: (state: AgentClientStatus) => void;
  private readonly preventStopWhileBusy: boolean;
  private activeCommands = 0;
  private stopping = false;
  private connectionStatus: AgentClientStatus['status'] = 'stopped';

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
      promptAttachmentDownloader?: PromptAttachmentDownloader;
      onStatus?: (state: AgentClientStatus) => void;
      preventStopWhileBusy?: boolean;
    } = {},
  ) {
    this.onStatus = dependencies.onStatus;
    this.preventStopWhileBusy = dependencies.preventStopWhileBusy ?? false;
    this.sessionRunner =
      dependencies.sessionRunner ??
      new SessionRunner({
        projectPaths: config.projectPaths,
        previewConfigs: config.previewConfigs,
        logger: this.logger,
      });
    const agentHarnessPort = dependencies.agentHarnessPort ?? new CodexHarnessAdapter(config.agentHarnessConfigs ?? {});
    const diffService = dependencies.diffService ?? new DiffService();
    const checksRunner =
      dependencies.checksRunner ??
      new ChecksRunner(config.checksConfigs ?? {}, ({ command, sessionId }) =>
        this.sessionRunner.runCommand(sessionId, command),
      );
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
    const promptAttachmentDownloader =
      dependencies.promptAttachmentDownloader ?? new PromptAttachmentDownloader(config.backendUrl, config.authToken);
    this.promptRunner = new PromptRunner({
      harness: agentHarnessPort,
      diff: diffService,
      checks: checksRunner,
      attachments: promptAttachmentDownloader,
      publish: (event) => this.publishPromptEvent(event),
      logger: this.logger,
      logRedactor: this.logRedactor,
    });
  }

  async start(): Promise<void> {
    if (this.socket) {
      throw new Error('AgentClient is already running.');
    }

    this.stopping = false;
    this.updateStatus('starting');

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
    let recoveryPromise: ReturnType<SessionRunner['restore']> | null = null;
    let recoveryPublished = false;
    const handleConnected = async () => {
      if (this.stopping) return;
      const event = buildAgentConnectedEvent({
        agentId: this.config.agentId,
        capabilities: this.config.capabilities,
        models: this.config.models ?? [],
        projects: this.config.projects ?? [],
      });

      await this.registerAgent(socket, event);
      if (this.stopping || this.socket !== socket) return;
      recoveryPromise ??= this.sessionRunner.restore();
      const recovery = await recoveryPromise;
      if (this.stopping || this.socket !== socket) return;
      if (recovery.recoveredSessionIds.length > 0) {
        this.logger.info(`Recovered ${recovery.recoveredSessionIds.length} prepared PairDock session(s).`);
      }
      if (!recoveryPublished) {
        await this.publishRecoveredSessions(recovery.recoveredSessionIds);
        await this.publishRecoveryFailures(recovery.failures);
        recoveryPublished = true;
      }
      if (Object.keys(this.config.projectPaths).length > 0) {
        void this.trackCommand(() => this.publishConfiguredProjectReadiness());
      }
      this.updateStatus('online');
      this.logger.info(
        `Connected agent ${event.payload.agentId} to ${this.config.backendUrl} with ${event.payload.capabilities.length} capabilities.`,
      );
    };
    let resolveFirstRegistration!: () => void;
    let rejectFirstRegistration!: (error: Error) => void;
    let firstRegistrationPending = true;
    const firstRegistration = new Promise<void>((resolve, reject) => {
      resolveFirstRegistration = resolve;
      rejectFirstRegistration = reject;
    });
    socket.on('connect', () => {
      void this.trackCommand(handleConnected)
        .then(() => {
          if (firstRegistrationPending) {
            firstRegistrationPending = false;
            resolveFirstRegistration();
          }
        })
        .catch((error: unknown) => {
          const normalizedError = error instanceof Error ? error : new Error(String(error));
          if (this.stopping || this.socket !== socket) return;
          this.logger.error(`Agent registration failed: ${normalizedError.message}`);
          this.updateStatus('error', normalizedError.message);
          if (firstRegistrationPending) {
            firstRegistrationPending = false;
            rejectFirstRegistration(normalizedError);
          }
        });
    });
    socket.on('disconnect', (reason: string) => {
      this.logger.warn(`Disconnected from PairDock backend: ${reason}.`);
      if (!this.stopping) {
        this.updateStatus(reason === 'io server disconnect' ? 'error' : 'reconnecting');
      }
    });
    socket.on(
      agentProtocolMessageEventName,
      (payload: unknown, acknowledge?: (response: { accepted: boolean; error?: string }) => void) => {
        if (this.stopping) {
          acknowledge?.({ accepted: false, error: 'The local agent is stopping.' });
          return;
        }
        void this.trackCommand(() => this.handleProtocolMessage(payload))
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

    let rejectInitialConnection!: (error: Error) => void;
    const initialConnection = new Promise<void>((_resolve, reject) => {
      rejectInitialConnection = reject;
    });
    const handleInitialConnectionError = (error: Error) => {
      this.updateStatus('error', error.message);
      rejectInitialConnection(error);
    };
    socket.on('connect_error', (error: Error) => {
      if (!firstRegistrationPending && !this.stopping) {
        this.updateStatus(socket.active ? 'reconnecting' : 'error', error.message);
      }
    });
    socket.once('connect_error', handleInitialConnectionError);
    socket.connect();

    try {
      await Promise.race([firstRegistration, initialConnection]);
    } catch (error) {
      this.socket = null;
      socket.close();
      throw error;
    } finally {
      socket.off('connect_error', handleInitialConnectionError);
    }
  }

  async stop(): Promise<void> {
    if (this.preventStopWhileBusy && this.activeCommands > 0) {
      throw new Error('Agent work is still running. Wait for the current operation to finish before stopping.');
    }
    this.stopping = true;
    if (this.socket) {
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

    await this.sessionRunner.shutdown();
    this.updateStatus('stopped');
  }

  private async trackCommand(operation: () => Promise<void>): Promise<void> {
    this.activeCommands += 1;
    this.updateStatus(this.connectionStatus);
    try {
      await operation();
    } finally {
      this.activeCommands -= 1;
      this.updateStatus(this.connectionStatus);
    }
  }

  private updateStatus(status: AgentClientStatus['status'], message?: string): void {
    this.connectionStatus = status;
    this.onStatus?.({ status, busy: this.activeCommands > 0, ...(message ? { message } : {}) });
  }

  private async publishRecoveryFailures(failures: Array<{ sessionId: string; message: string }>): Promise<void> {
    for (const failure of failures) {
      try {
        await this.emitError('session.recovery.failed', failure.sessionId, new Error(failure.message), false);
      } catch (error) {
        const message = this.logRedactor.redact(error instanceof Error ? error.message : String(error));
        this.logger.warn(
          `[session:${failure.sessionId}] Could not publish session.recovery.failed; continuing startup: ${message}`,
        );
      }
    }
  }

  private async publishRecoveredSessions(sessionIds: string[]): Promise<void> {
    for (const sessionId of sessionIds) {
      const workspace = this.sessionRunner.findWorkspace(sessionId);
      if (!workspace?.previewUrl) {
        throw new Error(`Recovered session ${sessionId} has no preview URL.`);
      }

      await this.emitRequiredEvent(
        buildSessionRecoveredEvent({
          sessionId,
          previewUrl: workspace.previewUrl,
        }),
      );
    }
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
      await this.promptRunner.run({
        sessionId: command.sessionId,
        projectKey: workspace.projectKey,
        prompt: command.payload.prompt,
        attachments: command.payload.attachments,
        modelId: command.payload.modelId,
        reasoningEffort: command.payload.reasoningEffort,
        worktreePath: workspace.worktreePath,
        previewUrl: workspace.previewUrl,
      });
    } catch (error) {
      if (error instanceof BackendEventRejectedError) {
        throw error;
      }

      await this.emitError('agent.prompt.failed', command.sessionId, error, false);
    }
  }

  private async publishPromptEvent(event: PromptExecutionEvent): Promise<void> {
    switch (event.type) {
      case 'session.progress':
        await this.emitEvent(buildSessionProgressEvent(event.payload));
        return;
      case 'agent.output':
        await this.emitEvent(buildAgentOutputEvent(event.payload));
        return;
      case 'agent.done':
        await this.emitEvent(buildAgentDoneEvent(event.payload));
        return;
      case 'git.diff':
        await this.emitEvent(buildGitDiffEvent(event.payload));
        return;
      case 'checks.result':
        await this.emitEvent(buildChecksResultEvent({ sessionId: event.payload.sessionId, result: event.payload }));
        return;
    }
  }

  private async handleAgentCancel(command: AgentCancelCommandEnvelope): Promise<void> {
    try {
      await this.promptRunner.cancel(command.sessionId);
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

  private async emitError(
    code: string,
    sessionId: string | undefined,
    error: unknown,
    retryable: boolean,
  ): Promise<void> {
    const message = this.logRedactor.redact(error instanceof Error ? error.message : String(error));
    this.logger.error(`[session:${sessionId ?? 'none'}] ${code}: ${message}`);
    const event = buildErrorEvent({
      code,
      message,
      retryable,
      sessionId,
    });

    await this.emitEvent(event);
  }

  private async emitEvent(event: AgentEventEnvelope): Promise<void> {
    const socket = this.socket;
    if (!socket) {
      throw new Error('AgentClient socket is not connected.');
    }

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.logger.warn(`PairDock backend did not acknowledge ${event.type} within 5000ms.`);
        resolve();
      }, 5_000);

      socket.emit(agentProtocolMessageEventName, event, (response?: { accepted?: boolean; error?: string }) => {
        clearTimeout(timeout);

        if (response?.accepted === false) {
          const message = response.error ?? 'unknown error';
          this.logger.warn(`PairDock backend rejected ${event.type}: ${message}`);
          reject(new BackendEventRejectedError(event.type, message));
          return;
        }

        resolve();
      });
    });
  }

  private async emitRequiredEvent(event: AgentEventEnvelope, socket = this.socket): Promise<void> {
    if (!socket) {
      throw new Error('AgentClient socket is not connected.');
    }

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`PairDock backend did not acknowledge ${event.type} within 5000ms.`));
      }, 5_000);

      socket.emit(agentProtocolMessageEventName, event, (response?: { accepted?: boolean; error?: string }) => {
        clearTimeout(timeout);

        if (response?.accepted !== true) {
          const message = response?.error ?? 'unknown error';
          this.logger.warn(`PairDock backend rejected ${event.type}: ${message}`);
          reject(new BackendEventRejectedError(event.type, message));
          return;
        }

        resolve();
      });
    });
  }

  private async registerAgent(socket: Socket, event: AgentConnectedEventEnvelope): Promise<void> {
    await this.emitRequiredEvent(event, socket);
  }
}

function isRetryableError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'retryable' in error && error.retryable === true);
}

export type { AgentConnectedEventEnvelope };
