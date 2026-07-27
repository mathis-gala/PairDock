import type { CreateReviewRequestInput } from '@pairdock/shared-contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api/client.js';
import { sessionQueryKeys } from '../lib/session-query-keys.js';
import type { SessionMessageView } from '../schemas/session.js';

export function useSessionData(accessToken: string, sessionId: string) {
  const api = createApiClient(accessToken);
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: sessionQueryKeys.detail(accessToken, sessionId),
    queryFn: () => api.sessions.get(sessionId),
  });

  const messagesQuery = useQuery({
    queryKey: sessionQueryKeys.messages(accessToken, sessionId),
    queryFn: () => api.sessions.listMessages(sessionId),
  });

  const eventsQuery = useQuery({
    queryKey: sessionQueryKeys.events(accessToken, sessionId),
    queryFn: () => api.sessions.listEvents(sessionId),
  });

  const sendPromptMutation = useMutation({
    mutationFn: (input: { content: string; screenshots: File[] }) => api.sessions.sendPrompt(sessionId, input),
    onSuccess: (message) => {
      queryClient.setQueryData<SessionMessageView[]>(
        sessionQueryKeys.messages(accessToken, sessionId),
        (currentMessages) => (currentMessages ? [...currentMessages, message] : [message]),
      );
    },
  });

  const cancelPromptMutation = useMutation({
    mutationFn: () => api.sessions.cancelPrompt(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sessionQueryKeys.detail(accessToken, sessionId) });
      void queryClient.invalidateQueries({ queryKey: sessionQueryKeys.events(accessToken, sessionId) });
    },
  });

  const createReviewRequestMutation = useMutation({
    mutationFn: (request: { input: CreateReviewRequestInput; screenshots: File[] }) =>
      api.sessions.createReviewRequest(sessionId, request.input, request.screenshots),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sessionQueryKeys.detail(accessToken, sessionId) });
      void queryClient.invalidateQueries({ queryKey: sessionQueryKeys.events(accessToken, sessionId) });
    },
  });

  return {
    sessionQuery,
    messagesQuery,
    eventsQuery,
    sendPromptMutation,
    cancelPromptMutation,
    createReviewRequestMutation,
  };
}
