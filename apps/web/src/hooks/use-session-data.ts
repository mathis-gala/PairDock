import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useSyncExternalStore } from 'react';
import { SessionSynchronization } from '../lib/session-synchronization.js';

export function useSessionData(accessToken: string, sessionId: string) {
  const queryClient = useQueryClient();
  const synchronization = useMemo(
    () => new SessionSynchronization(queryClient, accessToken, sessionId),
    [accessToken, queryClient, sessionId],
  );
  const snapshot = useSyncExternalStore(
    synchronization.subscribe,
    synchronization.getSnapshot,
    synchronization.getSnapshot,
  );
  const send = useMutation({ mutationFn: synchronization.sendPrompt });
  const cancel = useMutation({ mutationFn: synchronization.cancelPrompt });
  const reviewRequest = useMutation({ mutationFn: synchronization.createReviewRequest });

  return {
    snapshot,
    isSending: send.isPending,
    isCancelling: cancel.isPending,
    isCreatingReviewRequest: reviewRequest.isPending,
    reviewRequestError: reviewRequest.error?.message ?? null,
    sendPrompt: send.mutateAsync,
    cancelPrompt: cancel.mutateAsync,
    createReviewRequest: reviewRequest.mutateAsync,
    resetReviewRequest: reviewRequest.reset,
  };
}
