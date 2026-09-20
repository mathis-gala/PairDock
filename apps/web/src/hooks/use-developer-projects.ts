import type {
  CreateDeveloperProjectInput,
  DeveloperProjectSummary,
  UpdateDeveloperProjectInput,
  UpdateProjectExecutionDefaultsInput,
} from '@pairdock/shared-contracts';
import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api/client.js';
import { requestProjectReadiness } from '../lib/project-readiness.js';

interface UpdateExecutionDefaultsInput extends UpdateProjectExecutionDefaultsInput {
  projectId: string;
}

interface UpdateProjectInput extends UpdateDeveloperProjectInput {
  projectId: string;
}

interface ShareDeveloperProjectInput {
  projectId: string;
  pmEmail: string;
}

interface ProjectReadinessRequestState {
  isPending: boolean;
  error: string | null;
}

const emptyReadinessRequests: Record<string, ProjectReadinessRequestState> = {};

export function useDeveloperProjects(accessToken: string) {
  const api = createApiClient(accessToken);
  const queryClient = useQueryClient();
  const queryKey = ['developer-projects', accessToken];
  const readinessRequestKey = ['developer-project-readiness', accessToken];
  // Observed while this page is mounted; normal query GC releases an inactive identity's status.
  const readinessRequests = useQuery({
    queryKey: readinessRequestKey,
    queryFn: skipToken,
    initialData: emptyReadinessRequests,
  });

  function setReadinessRequest(projectId: string, state: ProjectReadinessRequestState) {
    queryClient.setQueryData<Record<string, ProjectReadinessRequestState>>(readinessRequestKey, (current = {}) => ({
      ...current,
      [projectId]: state,
    }));
  }

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
    mutationKey: readinessRequestKey,
    onMutate: (projectId: string) => {
      setReadinessRequest(projectId, { isPending: true, error: null });
    },
    mutationFn: (projectId: string) => requestProjectReadiness(api.projects, projectId),
    onSuccess: async (readiness, projectId) => {
      // An older list request must not overwrite the result we just waited for.
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData<DeveloperProjectSummary[]>(queryKey, (currentProjects) =>
        currentProjects?.map((project) => (project.id === projectId ? { ...project, readiness } : project)),
      );
      setReadinessRequest(projectId, { isPending: false, error: null });
    },
    onError: (error, projectId) => {
      setReadinessRequest(projectId, { isPending: false, error: error.message });
    },
  });

  const updateExecutionDefaultsMutation = useMutation({
    mutationFn: ({ projectId, ...input }: UpdateExecutionDefaultsInput) =>
      api.projects.updateExecutionDefaults(projectId, input),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData<DeveloperProjectSummary[]>(queryKey, (currentProjects) =>
        currentProjects?.map((project) => (project.id === updatedProject.id ? updatedProject : project)),
      );
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ projectId, ...input }: UpdateProjectInput) => api.projects.update(projectId, input),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData<DeveloperProjectSummary[]>(queryKey, (currentProjects) =>
        currentProjects?.map((project) => (project.id === updatedProject.id ? updatedProject : project)),
      );
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
    readinessByProject: readinessRequests.data ?? emptyReadinessRequests,
    requestReadinessMutation,
    shareProjectMutation,
    setupQuery,
    updateExecutionDefaultsMutation,
    updateProjectMutation,
  };
}
