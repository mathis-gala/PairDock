import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useSyncExternalStore } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getBackendUrl } from '../lib/backend-url.js';
import { uiSessionEventName, uiSessionSubscribedEventName, uiSessionSubscribeEventName } from './session-api.js';

type FeedConnectionState = 'idle' | 'connecting' | 'subscribed' | 'error';

export interface SessionEventFeedSnapshot {
  connectionState: FeedConnectionState;
  errorMessage: string | null;
  lastEventType: string | null;
}

interface FeedIdentity {
  accessToken: string;
  sessionId: string;
}

class SessionEventFeed {
  private readonly listeners = new Set<() => void>();
  private readonly snapshot: SessionEventFeedSnapshot = {
    connectionState: 'idle',
    errorMessage: null,
    lastEventType: null,
  };
  private socket: Socket | null = null;

  constructor(
    private readonly identity: FeedIdentity,
    private readonly invalidate: () => void,
  ) {}

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);

    if (this.listeners.size === 1) {
      this.open();
    }

    return () => {
      this.listeners.delete(listener);

      if (this.listeners.size === 0) {
        this.close();
      }
    };
  };

  getSnapshot = (): SessionEventFeedSnapshot => this.snapshot;

  private open(): void {
    if (this.socket) {
      return;
    }

    this.updateSnapshot({ connectionState: 'connecting', errorMessage: null });

    const socket = io(`${getBackendUrl()}/ui`, {
      transports: ['websocket'],
      auth: {
        token: this.identity.accessToken,
      },
    });

    socket.on('connect', () => {
      socket.emit(uiSessionSubscribeEventName, { sessionId: this.identity.sessionId });
    });
    socket.on(uiSessionSubscribedEventName, () => {
      this.updateSnapshot({ connectionState: 'subscribed', errorMessage: null });
    });
    socket.on(uiSessionEventName, (event: { type?: string }) => {
      this.updateSnapshot({
        connectionState: 'subscribed',
        errorMessage: null,
        lastEventType: typeof event.type === 'string' ? event.type : null,
      });
      this.invalidate();
    });
    socket.on('connect_error', (error: Error) => {
      this.updateSnapshot({ connectionState: 'error', errorMessage: error.message });
    });
    socket.on('disconnect', () => {
      if (this.listeners.size > 0) {
        this.updateSnapshot({ connectionState: 'connecting' });
      }
    });

    this.socket = socket;
  }

  private close(): void {
    this.socket?.close();
    this.socket = null;
    this.updateSnapshot({ connectionState: 'idle', errorMessage: null, lastEventType: null });
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      listener();
    });
  }

  private updateSnapshot(partialSnapshot: Partial<SessionEventFeedSnapshot>): void {
    Object.assign(this.snapshot, partialSnapshot);
    this.notify();
  }
}

const feedRegistry = new Map<string, SessionEventFeed>();

export function useSessionEventFeed(accessToken: string, sessionId: string): SessionEventFeedSnapshot {
  const queryClient = useQueryClient();
  const feed = useMemo(
    () =>
      getFeed(
        {
          accessToken,
          sessionId,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
          void queryClient.invalidateQueries({ queryKey: ['session-events', sessionId] });
        },
      ),
    [accessToken, queryClient, sessionId],
  );

  return useSyncExternalStore(feed.subscribe, feed.getSnapshot, feed.getSnapshot);
}

function getFeed(identity: FeedIdentity, invalidate: () => void): SessionEventFeed {
  const key = `${identity.accessToken}:${identity.sessionId}`;
  const existingFeed = feedRegistry.get(key);

  if (existingFeed) {
    return existingFeed;
  }

  const nextFeed = new SessionEventFeed(identity, invalidate);
  feedRegistry.set(key, nextFeed);
  return nextFeed;
}
