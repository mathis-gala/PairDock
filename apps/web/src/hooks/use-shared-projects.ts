import type { SharedProjectSummary } from '@pairdock/shared-contracts';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createApiClient } from '../api/client.js';

interface StartPmSessionInput {
  project: SharedProjectSummary;
}

interface UseSharedProjectsResult {
  sharedProjectsQuery: ReturnType<typeof useQuery<SharedProjectSummary[], Error>>;
  startSessionMutation: ReturnType<typeof useMutation<SessionStarted, Error, StartPmSessionInput>>;
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
    mutationFn: ({ project }: StartPmSessionInput) =>
      api.sessions
        .create({
          projectId: project.id,
          startSource: 'pm',
        })
        .then((session) => ({ sessionId: session.id })),
    onSuccess: (result) => {
      onSessionStarted(result.sessionId);
    },
  });

  return { sharedProjectsQuery, startSessionMutation };
}
