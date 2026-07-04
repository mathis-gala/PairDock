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

  const createProjectMutation = useMutation({
    mutationFn: (input: CreateDeveloperProjectInput) => api.projects.create(input),
    onSuccess: (project) => {
      queryClient.setQueryData<DeveloperProjectSummary[]>(queryKey, (currentProjects) =>
        currentProjects ? [...currentProjects, project] : [project],
      );
    },
  });

  const shareProjectMutation = useMutation({
    mutationFn: ({ projectId, pmEmail }: ShareDeveloperProjectInput) => api.projects.share(projectId, { pmEmail }),
    onSuccess: (project) => {
      replaceProject(queryClient, queryKey, project);
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
    startSessionMutation,
  };
}

function replaceProject(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: string[],
  project: DeveloperProjectSummary,
) {
  queryClient.setQueryData<DeveloperProjectSummary[]>(
    queryKey,
    (currentProjects) =>
      currentProjects?.map((currentProject) => (currentProject.id === project.id ? project : currentProject)) ?? [
        project,
      ],
  );
}
