export type FeedConnectionState = 'idle' | 'connecting' | 'subscribed' | 'error';

export interface SessionEventFeedSnapshot {
  connectionState: FeedConnectionState;
  errorMessage: string | null;
  lastEventType: string | null;
}
