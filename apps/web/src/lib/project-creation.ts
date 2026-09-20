import type {
  CreateDeveloperProjectInput,
  DeveloperProjectSetup,
  DeveloperSetupAgentModel,
  DeveloperSetupAgentProject,
  DeveloperSetupRepository,
} from '@pairdock/shared-contracts';

export interface AgentProjectOption extends DeveloperSetupAgentProject {
  agentId: string;
  agentModels: DeveloperSetupAgentModel[];
}

interface ReasoningOption {
  id: string;
  label: string;
  description?: string;
}

export interface ProjectCreationState {
  values: CreateDeveloperProjectInput;
  repositories: DeveloperSetupRepository[];
  selectedRepository: DeveloperSetupRepository | null;
  allAgentProjects: AgentProjectOption[];
  matchingAgentProjects: AgentProjectOption[];
  selectedAgentProject: AgentProjectOption | null;
  modelOptions: DeveloperSetupAgentModel[];
  reasoningOptions: ReasoningOption[];
  canCreate: boolean;
  handoffUnavailable: boolean;
}

export function resolveProjectCreation(
  setup: DeveloperProjectSetup | null,
  edits: Partial<CreateDeveloperProjectInput>,
  preferredAgentProjectKey?: string,
): ProjectCreationState {
  const repositories = setup?.repositories ?? [];
  const allAgentProjects = (setup?.agents ?? []).flatMap((agent) =>
    agent.projects.map((project) => ({ ...project, agentId: agent.agentId, agentModels: agent.models })),
  );
  const handoffProjects = allAgentProjects.filter(
    (project) =>
      project.key === preferredAgentProjectKey &&
      repositories.some((repository) => repository.fullName === project.repoFullName),
  );
  const handoffProject = handoffProjects.length === 1 ? handoffProjects[0] : null;
  const handoffUnavailable = Boolean(setup && preferredAgentProjectKey && !handoffProject);
  const eligibleRepositories = repositories.filter((repository) =>
    allAgentProjects.some((project) => project.repoFullName === repository.fullName),
  );
  let inferredRepository = repositories.length === 1 ? repositories[0] : null;
  if (eligibleRepositories.length === 1) {
    inferredRepository = eligibleRepositories[0];
  }
  if (preferredAgentProjectKey) {
    inferredRepository =
      repositories.find((repository) => repository.fullName === handoffProject?.repoFullName) ?? null;
  }
  const repoFullName = edits.repoFullName ?? inferredRepository?.fullName ?? '';
  const selectedRepository = repositories.find((repository) => repository.fullName === repoFullName) ?? null;
  const matchingAgentProjects = allAgentProjects.filter(
    (project) => project.repoFullName === selectedRepository?.fullName,
  );
  let inferredAgentProject = matchingAgentProjects.length === 1 ? matchingAgentProjects[0] : null;
  if (handoffProject?.repoFullName === selectedRepository?.fullName) {
    inferredAgentProject = handoffProject;
  }
  const agentProjectKey = edits.agentProjectKey ?? inferredAgentProject?.key ?? '';
  const selectedAgentProjects = matchingAgentProjects.filter((project) => project.key === agentProjectKey);
  const selectedAgentProject = selectedAgentProjects.length === 1 ? (selectedAgentProjects[0] ?? null) : null;
  const allowedModelIds = selectedAgentProject?.models?.length ? new Set(selectedAgentProject.models) : null;
  const modelOptions = (selectedAgentProject?.agentModels ?? []).filter(
    (model) => !allowedModelIds || allowedModelIds.has(model.id),
  );
  const defaultModelId = edits.defaultModelId ?? (modelOptions.length === 1 ? modelOptions[0]?.id : '') ?? '';
  const selectedModel = modelOptions.find((model) => model.id === defaultModelId) ?? null;
  let reasoningOptions = selectedModel?.reasoningEfforts ?? [];
  if (selectedModel && reasoningOptions.length === 0) {
    // AgentExecutionCapabilitiesService accepts medium for legacy models without reasoning metadata.
    reasoningOptions = [{ id: 'medium', label: 'Medium' }];
  }
  let inferredReasoning = reasoningOptions.length === 1 ? (reasoningOptions[0]?.id ?? '') : '';
  if (reasoningOptions.some((effort) => effort.id === selectedModel?.defaultReasoningEffort)) {
    inferredReasoning = selectedModel?.defaultReasoningEffort ?? '';
  }
  const values: CreateDeveloperProjectInput = {
    name: edits.name ?? selectedAgentProject?.name ?? selectedRepository?.name ?? '',
    description: edits.description ?? '',
    repoFullName,
    agentProjectKey,
    defaultBranch: edits.defaultBranch ?? resolveDefaultBranch(selectedRepository, selectedAgentProject),
    defaultModelId,
    defaultReasoningEffort: edits.defaultReasoningEffort ?? inferredReasoning,
    pmCanStartSessions: edits.pmCanStartSessions ?? true,
  };
  const branchAvailable = selectedRepository?.branches.includes(values.defaultBranch) ?? false;
  const reasoningAvailable = reasoningOptions.some((effort) => effort.id === values.defaultReasoningEffort);
  const canCreate = Boolean(
    values.name.trim() &&
      selectedRepository &&
      selectedAgentProject &&
      selectedModel &&
      branchAvailable &&
      reasoningAvailable,
  );

  return {
    values,
    repositories,
    selectedRepository,
    allAgentProjects,
    matchingAgentProjects,
    selectedAgentProject,
    modelOptions,
    reasoningOptions,
    canCreate,
    handoffUnavailable,
  };
}

function resolveDefaultBranch(repository: DeveloperSetupRepository | null, project: AgentProjectOption | null) {
  if (!repository) return '';
  if (project?.defaultBranch && repository.branches.includes(project.defaultBranch)) return project.defaultBranch;
  if (repository.branches.includes(repository.defaultBranch)) return repository.defaultBranch;
  return repository.branches.length === 1 ? (repository.branches[0] ?? '') : '';
}
