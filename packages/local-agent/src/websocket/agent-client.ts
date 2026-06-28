import {
  type AgentCommandEnvelope,
  type AgentConnectedEventEnvelope,
  agentProtocolMessageEventName,
} from '@pairdock/shared-contracts';
import { io, type Socket } from 'socket.io-client';
import { buildAgentConnectedEvent, parseAgentCommandEnvelope } from './message-codecs.js';

export interface AgentClientConfig {
  backendUrl: string;
  agentId: string;
  authToken?: string;
  capabilities: string[];
}

export interface AgentClientLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export class AgentClient {
  private socket: Socket | null = null;

  constructor(
    private readonly config: AgentClientConfig,
    private readonly logger: AgentClientLogger = console,
  ) {}

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
      this.handleProtocolMessage(payload);
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

  private handleProtocolMessage(payload: unknown): void {
    let command: AgentCommandEnvelope;

    try {
      command = parseAgentCommandEnvelope(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Rejected invalid backend command: ${message}`);
      return;
    }

    this.logger.info(this.describeCommand(command));
  }

  private describeCommand(command: AgentCommandEnvelope): string {
    return `Received backend command ${command.type} for session ${command.sessionId}.`;
  }
}

export type { AgentConnectedEventEnvelope };
