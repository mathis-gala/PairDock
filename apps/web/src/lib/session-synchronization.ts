import {
  type CreateReviewRequestInput,
  uiSessionEventName,
  uiSessionSubscribedEventName,
  uiSessionSubscribeEventName,
} from '@pairdock/shared-contracts';
import { type QueryClient, QueryObserver } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { type ApiClient, createApiClient } from '../api/client.js';
import type { SessionEventRecordView, SessionMessageView, SessionView } from '../schemas/session.js';
import { getBackendUrl } from './backend-url.js';
import { buildSessionConversation, type SessionConversationItem } from './session-conversation.js';
import { sessionQueryKeys } from './session-query-keys.js';

export type SessionSnapshot =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready'; session: SessionView; conversation: SessionConversationItem[] };

export interface SessionSocket {
  on(event: string, listener: () => void): void;
  emit(event: string, payload: { sessionId: string }): void;
  removeAllListeners(): void;
  disconnect(): void;
}

export interface SessionPrompt {
  content: string;
  screenshots: File[];
}

export interface SessionReviewRequest {
  input: CreateReviewRequestInput;
  screenshots: File[];
}

export class SessionSynchronization {
  private readonly api: ApiClient;
  private readonly listeners = new Set<() => void>();
  private readonly session: QueryObserver<SessionView>;
  private readonly messages: QueryObserver<SessionMessageView[]>;
  private readonly events: QueryObserver<SessionEventRecordView[]>;
  private snapshot: SessionSnapshot = { status: 'loading' };
  private lastMessages: SessionMessageView[] | undefined;
  private lastEvents: SessionEventRecordView[] | undefined;
  private subscriptions: (() => void)[] = [];
  private socket: SessionSocket | null = null;

  constructor(
    private readonly queryClient: QueryClient,
    private readonly accessToken: string,
    private readonly sessionId: string,
    private readonly connectSocket: (accessToken: string) => SessionSocket = openSessionSocket,
  ) {
    this.api = createApiClient(accessToken);
    this.session = new QueryObserver<SessionView>(queryClient, {
      queryKey: sessionQueryKeys.detail(accessToken, sessionId),
      queryFn: () => this.api.sessions.get(sessionId),
    });
    this.messages = new QueryObserver<SessionMessageView[]>(queryClient, {
      queryKey: sessionQueryKeys.messages(accessToken, sessionId),
      queryFn: () => this.api.sessions.listMessages(sessionId),
    });
    this.events = new QueryObserver<SessionEventRecordView[]>(queryClient, {
      queryKey: sessionQueryKeys.events(accessToken, sessionId),
      queryFn: () => this.api.sessions.listEvents(sessionId),
    });
    this.updateSnapshot();
  }

  getSnapshot = (): SessionSnapshot => this.snapshot;

  sendPrompt = async (input: SessionPrompt) => {
    const message = await this.api.sessions.sendPrompt(this.sessionId, input);
    // An in-flight read may predate the accepted prompt; its response must not erase the acknowledgement.
    await this.queryClient.cancelQueries({ queryKey: sessionQueryKeys.messages(this.accessToken, this.sessionId) });
    this.queryClient.setQueryData<SessionMessageView[]>(
      sessionQueryKeys.messages(this.accessToken, this.sessionId),
      (current = []) => [...current.filter((item) => item.id !== message.id), message],
    );
    // Catch up anything delivered by the cancelled read, even if there is no subsequent socket event.
    this.refresh();
  };

  cancelPrompt = async () => {
    await this.api.sessions.cancelPrompt(this.sessionId);
    this.refresh();
  };

  createReviewRequest = async ({ input, screenshots }: SessionReviewRequest) => {
    await this.api.sessions.createReviewRequest(this.sessionId, input, screenshots);
    this.refresh();
  };

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    if (this.listeners.size === 1) {
      this.subscriptions = [
        this.session.subscribe(this.updateSnapshot),
        this.messages.subscribe(this.updateSnapshot),
        this.events.subscribe(this.updateSnapshot),
      ];
      const socket = this.connectSocket(this.accessToken);
      socket.on('connect', () => socket.emit(uiSessionSubscribeEventName, { sessionId: this.sessionId }));
      // The subscription acknowledgement also repairs events missed before joining or during a disconnect.
      socket.on(uiSessionSubscribedEventName, this.refresh);
      socket.on(uiSessionEventName, this.refresh);
      this.socket = socket;
      this.updateSnapshot();
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        for (const unsubscribe of this.subscriptions) unsubscribe();
        this.subscriptions = [];
        this.socket?.removeAllListeners();
        this.socket?.disconnect();
        this.socket = null;
      }
    };
  };

  private refresh = () => {
    if (this.listeners.size === 0) return;
    const queryKeys = [
      sessionQueryKeys.detail(this.accessToken, this.sessionId),
      sessionQueryKeys.messages(this.accessToken, this.sessionId),
      sessionQueryKeys.events(this.accessToken, this.sessionId),
    ];
    for (const queryKey of queryKeys) {
      // Invalidation alone can reuse an initial read taken before the notification when its cache is still empty.
      void this.queryClient.cancelQueries({ queryKey, exact: true }).then(() => {
        if (this.listeners.size > 0) {
          return this.queryClient.invalidateQueries({ queryKey, exact: true });
        }
      });
    }
  };

  private updateSnapshot = () => {
    const session = this.session.getCurrentResult();
    const messages = this.messages.getCurrentResult();
    const events = this.events.getCurrentResult();
    const error = session.error ?? messages.error ?? events.error;
    if (error) {
      if (this.snapshot.status === 'error' && this.snapshot.error === error) return;
      this.snapshot = { status: 'error', error };
    } else if (!session.data || !messages.data || !events.data) {
      if (this.snapshot.status === 'loading') return;
      this.snapshot = { status: 'loading' };
    } else {
      const unchanged =
        this.snapshot.status === 'ready' &&
        this.snapshot.session === session.data &&
        this.lastMessages === messages.data &&
        this.lastEvents === events.data;
      if (unchanged) return;
      this.lastMessages = messages.data;
      this.lastEvents = events.data;
      this.snapshot = {
        status: 'ready',
        session: session.data,
        conversation: buildSessionConversation(messages.data, events.data),
      };
    }
    for (const listener of this.listeners) listener();
  };
}

function openSessionSocket(accessToken: string): SessionSocket {
  return io(`${getBackendUrl()}/ui`, { transports: ['websocket'], auth: { token: accessToken } });
}
