import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api/client.js';
import type { SessionMessageView } from '../schemas/session.js';

export function useSessionData(accessToken: string, sessionId: string) {
  const api = createApiClient(accessToken);
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => api.sessions.get(sessionId),
  });

  const messagesQuery = useQuery({
    queryKey: ['session-messages', sessionId],
    queryFn: () => api.sessions.listMessages(sessionId),
  });

  const eventsQuery = useQuery({
    queryKey: ['session-events', sessionId],
    queryFn: () => api.sessions.listEvents(sessionId),
  });

  const sendPromptMutation = useMutation({
    mutationFn: (content: string) => api.sessions.sendPrompt(sessionId, content),
    onSuccess: (message) => {
      queryClient.setQueryData<SessionMessageView[]>(['session-messages', sessionId], (currentMessages) =>
        currentMessages ? [...currentMessages, message] : [message],
      );
    },
  });

  const cancelPromptMutation = useMutation({
    mutationFn: () => api.sessions.cancelPrompt(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      void queryClient.invalidateQueries({ queryKey: ['session-events', sessionId] });
    },
  });

  const createReviewRequestMutation = useMutation({
    mutationFn: () => api.sessions.createDraftReviewRequest(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      void queryClient.invalidateQueries({ queryKey: ['session-events', sessionId] });
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
