import type { CreateDeveloperProjectInput, DeveloperProjectSummary } from '@pairdock/shared-contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api/client.js';

interface StartDeveloperSessionInput {
  projectId: string;
  modelId: string;
}

interface ShareDeveloperProjectInput {
  projectId: string;
  pmEmail: string;
}

export function useDeveloperProjects(accessToken: string) {
  const api = createApiClient(accessToken);
  const queryClient = useQueryClient();
  const queryKey = ['developer-projects', accessToken];

  const projectsQuery = useQuery({
    queryKey,
    queryFn: () => api.projects.listDeveloper(),
  });

  const setupQuery = useQuery({
    queryKey: ['developer-project-setup', accessToken],
    queryFn: () => api.projects.getSetup(),
  });

  const createProjectMutation = useMutation({
    mutationFn: (input: CreateDeveloperProjectInput) => api.projects.create(input),
    onSuccess: (project) => {
      queryClient.setQueryData<DeveloperProjectSummary[]>(queryKey, (currentProjects) =>
        currentProjects ? [...currentProjects, project] : [project],
      );
      void queryClient.invalidateQueries({ queryKey: ['developer-project-setup', accessToken] });
    },
  });

  const shareProjectMutation = useMutation({
    mutationFn: ({ projectId, pmEmail }: ShareDeveloperProjectInput) => api.projects.share(projectId, { pmEmail }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const requestReadinessMutation = useMutation({
    mutationFn: (projectId: string) => api.projects.requestReadinessCheck(projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const startSessionMutation = useMutation({
    mutationFn: ({ projectId, modelId }: StartDeveloperSessionInput) =>
      api.sessions.create({
        projectId,
        modelId,
        startSource: 'developer',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const closeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => api.sessions.close(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    closeSessionMutation,
    createProjectMutation,
    projectsQuery,
    requestReadinessMutation,
    shareProjectMutation,
    setupQuery,
    startSessionMutation,
  };
}
