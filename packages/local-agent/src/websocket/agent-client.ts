import {
  type AgentCommandEnvelope,
  type AgentConnectedEventEnvelope,
  type AgentEventEnvelope,
  agentProtocolMessageEventName,
  type SessionCloseCommandEnvelope,
  type SessionPrepareCommandEnvelope,
} from '@pairdock/shared-contracts';
import { io, type Socket } from 'socket.io-client';
import { SessionRunner } from '../session/session-runner.js';
import {
  buildAgentConnectedEvent,
  buildErrorEvent,
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
  projectPaths: Record<string, string>;
}

export interface AgentClientLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export class AgentClient {
  private socket: Socket | null = null;
  private readonly sessionRunner: SessionRunner;

  constructor(
    private readonly config: AgentClientConfig,
    private readonly logger: AgentClientLogger = console,
    dependencies: {
      sessionRunner?: SessionRunner;
    } = {},
  ) {
    this.sessionRunner =
      dependencies.sessionRunner ??
      new SessionRunner({
        projectPaths: config.projectPaths,
      });
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
      });

      socket.emit(agentProtocolMessageEventName, event);
      this.logger.info(
        `Connected agent ${event.payload.agentId} to ${this.config.backendUrl} with ${event.payload.capabilities.length} capabilities.`,
      );
    });
    socket.on('disconnect', (reason) => {
      this.logger.warn(`Disconnected from PairDock backend: ${reason}.`);
    });
    socket.on(agentProtocolMessageEventName, (payload: unknown) => {
      void this.handleProtocolMessage(payload).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Agent command handling failed: ${message}`);
      });
    });

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
      case 'session.close':
        await this.handleSessionClose(command);
        return;
      default:
        return;
    }
  }

  private describeCommand(command: AgentCommandEnvelope): string {
    return `Received backend command ${command.type} for session ${command.sessionId}.`;
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
    }
  }

  private async emitError(
    code: string,
    sessionId: string | undefined,
    error: unknown,
    retryable: boolean,
  ): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);
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

    await this.socket.emitWithAck(agentProtocolMessageEventName, event);
  }
}

function isRetryableError(error: unknown): boolean {
  return Boolean(
    error && typeof error === 'object' && 'retryable' in error && (error as { retryable?: unknown }).retryable === true,
  );
}

export type { AgentConnectedEventEnvelope };
