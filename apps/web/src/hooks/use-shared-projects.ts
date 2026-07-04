import type { SharedProjectSummary } from '@pairdock/shared-contracts';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createApiClient } from '../api/client.js';

interface UseSharedProjectsResult {
  sharedProjectsQuery: ReturnType<typeof useQuery<SharedProjectSummary[], Error>>;
  startSessionMutation: ReturnType<typeof useMutation<SessionStarted, Error, SharedProjectSummary>>;
}

interface SessionStarted {
  sessionId: string;
}

export function useSharedProjects(
  accessToken: string,
  onSessionStarted: (sessionId: string) => void,
): UseSharedProjectsResult {
  const api = createApiClient(accessToken);

  const sharedProjectsQuery = useQuery({
    queryKey: ['shared-projects', accessToken],
    queryFn: () => api.projects.listShared(),
  });

  const startSessionMutation = useMutation({
    mutationFn: (project: SharedProjectSummary) =>
      api.sessions
        .create({
          projectId: project.id,
          modelId: project.defaultModelId,
          startSource: 'pm',
        })
        .then((session) => ({ sessionId: session.id })),
    onSuccess: (result) => {
      onSessionStarted(result.sessionId);
    },
  });

  return { sharedProjectsQuery, startSessionMutation };
}
