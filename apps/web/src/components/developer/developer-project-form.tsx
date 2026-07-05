import type {
  CreateDeveloperProjectInput,
  DeveloperProjectSetup,
  DeveloperSetupAgentModel,
} from '@pairdock/shared-contracts';
import { type ChangeEvent, type FormEvent, useState } from 'react';
import { Button } from '../button.js';
import { SectionCard } from '../section-card.js';
import { SelectInput } from '../select-input.js';
import { TextArea } from '../text-area.js';
import { TextInput } from '../text-input.js';

interface DeveloperProjectFormProps {
  developerSeed: string;
  isSetupLoading: boolean;
  isSubmitting: boolean;
  onSubmit: (input: CreateDeveloperProjectInput) => Promise<void>;
  setup: DeveloperProjectSetup | null;
}

interface ProjectFormState {
  name: string;
  description: string;
  repoFullName: string;
  defaultBranch: string;
  agentProjectKey: string;
  defaultModelId: string;
  pmCanStartSessions: boolean;
}

interface AgentProjectOption {
  agentId: string;
  key: string;
  name: string;
  repoFullName: string;
  models?: string[];
  agentModels: DeveloperSetupAgentModel[];
}

export function DeveloperProjectForm({
  developerSeed,
  isSetupLoading,
  isSubmitting,
  onSubmit,
  setup,
}: DeveloperProjectFormProps) {
  const normalizedSeed = developerSeed.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const [state, setState] = useState<ProjectFormState>({
    name: 'PairDock local project',
    description: 'Local project controlled by the developer dashboard.',
    repoFullName: '',
    defaultBranch: '',
    agentProjectKey: '',
    defaultModelId: '',
    pmCanStartSessions: true,
  });
  const repositories = setup?.repositories ?? [];
  const selectedRepository = repositories.find((repository) => repository.fullName === state.repoFullName) ?? null;
  const allAgentProjects = (setup?.agents ?? []).flatMap((agent) =>
    agent.projects.map((project) => ({
      agentId: agent.agentId,
      key: project.key,
      name: project.name,
      repoFullName: project.repoFullName,
      models: project.models,
      agentModels: agent.models,
    })),
  );
  const matchingAgentProjects = allAgentProjects.filter((project) => project.repoFullName === state.repoFullName);
  const selectedAgentProject = matchingAgentProjects.find((project) => project.key === state.agentProjectKey) ?? null;
  const modelOptions = selectedAgentProject ? resolveModelOptions(selectedAgentProject) : [];
  const createDisabled =
    isSetupLoading ||
    isSubmitting ||
    !state.name.trim() ||
    !selectedRepository ||
    !state.defaultBranch ||
    !selectedAgentProject ||
    !state.defaultModelId;

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setState((current) => ({ ...current, name: event.target.value }));
  }

  function handleDescriptionChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setState((current) => ({ ...current, description: event.target.value }));
  }

  function handleRepositoryChange(event: ChangeEvent<HTMLSelectElement>) {
    const repoFullName = event.target.value;
    const repository = repositories.find((candidate) => candidate.fullName === repoFullName);
    setState((current) => ({
      ...current,
      repoFullName,
      defaultBranch: repository?.defaultBranch ?? repository?.branches[0] ?? '',
      agentProjectKey: '',
      defaultModelId: '',
    }));
  }

  function handleBranchChange(event: ChangeEvent<HTMLSelectElement>) {
    setState((current) => ({ ...current, defaultBranch: event.target.value }));
  }

  function handleAgentProjectChange(event: ChangeEvent<HTMLSelectElement>) {
    const agentProjectKey = event.target.value;
    const agentProject = matchingAgentProjects.find((project) => project.key === agentProjectKey) ?? null;
    const firstModel = agentProject ? resolveModelOptions(agentProject)[0] : null;
    setState((current) => ({
      ...current,
      agentProjectKey,
      defaultModelId: firstModel?.id ?? '',
    }));
  }

  function handleModelChange(event: ChangeEvent<HTMLSelectElement>) {
    setState((current) => ({ ...current, defaultModelId: event.target.value }));
  }

  function handlePmCanStartSessionsChange(event: ChangeEvent<HTMLInputElement>) {
    setState((current) => ({ ...current, pmCanStartSessions: event.target.checked }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (createDisabled) {
      return;
    }

    await onSubmit({
      name: state.name.trim(),
      description: state.description.trim(),
      repoFullName: state.repoFullName,
      defaultBranch: state.defaultBranch,
      defaultModelId: state.defaultModelId,
      agentProjectKey: state.agentProjectKey,
      pmCanStartSessions: state.pmCanStartSessions,
    });
    setState({
      name: 'PairDock local project',
      description: 'Local project controlled by the developer dashboard.',
      repoFullName: '',
      defaultBranch: '',
      agentProjectKey: '',
      defaultModelId: '',
      pmCanStartSessions: true,
    });
  }

  return (
    <SectionCard
      eyebrow="Project creation"
      title="Configurer une instance"
      description="Sélectionne un dépôt GitHub installé, une branche, un projet agent local et un modèle publié par cet agent."
    >
      <form className="grid gap-4 lg:grid-cols-[1fr_1fr]" onSubmit={handleSubmit}>
        <label className="space-y-2 text-sm text-slate-300" htmlFor="developer-project-name">
          <span className="block">Nom du projet</span>
          <TextInput id="developer-project-name" onChange={handleNameChange} required value={state.name} />
        </label>
        <label className="space-y-2 text-sm text-slate-300" htmlFor="developer-project-repository">
          <span className="block">Dépôt GitHub</span>
          <SelectInput
            disabled={isSetupLoading || repositories.length === 0}
            id="developer-project-repository"
            onChange={handleRepositoryChange}
            required
            value={state.repoFullName}
          >
            <option value="">Sélectionner un dépôt</option>
            {repositories.map((repository) => (
              <option key={repository.fullName} value={repository.fullName}>
                {repository.fullName}
              </option>
            ))}
          </SelectInput>
        </label>
        <label className="space-y-2 text-sm text-slate-300" htmlFor="developer-project-branch">
          <span className="block">Branche de base</span>
          <SelectInput
            disabled={!selectedRepository}
            id="developer-project-branch"
            onChange={handleBranchChange}
            required
            value={state.defaultBranch}
          >
            <option value="">Sélectionner une branche</option>
            {selectedRepository?.branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </SelectInput>
        </label>
        <label className="space-y-2 text-sm text-slate-300" htmlFor="developer-project-agent-project">
          <span className="block">Projet agent local</span>
          <SelectInput
            disabled={!selectedRepository || matchingAgentProjects.length === 0}
            id="developer-project-agent-project"
            onChange={handleAgentProjectChange}
            required
            value={state.agentProjectKey}
          >
            <option value="">Sélectionner un projet agent</option>
            {matchingAgentProjects.map((project) => (
              <option key={`${project.agentId}:${project.key}`} value={project.key}>
                {project.name} ({project.agentId})
              </option>
            ))}
          </SelectInput>
        </label>
        <label className="space-y-2 text-sm text-slate-300" htmlFor="developer-project-model">
          <span className="block">Modèle agent</span>
          <SelectInput
            disabled={!selectedAgentProject || modelOptions.length === 0}
            id="developer-project-model"
            onChange={handleModelChange}
            required
            value={state.defaultModelId}
          >
            <option value="">Sélectionner un modèle</option>
            {modelOptions.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label} ({model.provider})
              </option>
            ))}
          </SelectInput>
        </label>
        <label className="flex min-h-10 items-center gap-2 self-end rounded-[9px] border border-white/10 bg-[#1f232b] px-3 py-2 text-sm text-slate-300">
          <input checked={state.pmCanStartSessions} onChange={handlePmCanStartSessionsChange} type="checkbox" />
          Sessions PM autorisées
        </label>
        <label className="space-y-2 text-sm text-slate-300 lg:col-span-2" htmlFor="developer-project-description">
          <span className="block">Description</span>
          <TextArea id="developer-project-description" onChange={handleDescriptionChange} value={state.description} />
        </label>
        <ProjectSetupState
          hasAgents={(setup?.agents.length ?? 0) > 0}
          hasRepositories={repositories.length > 0}
          isSetupLoading={isSetupLoading}
          matchingAgentProjects={matchingAgentProjects.length}
          repoSelected={Boolean(selectedRepository)}
        />
        <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
          <Button disabled={createDisabled} type="submit">
            {isSubmitting ? 'Création...' : 'Créer le projet'}
          </Button>
          <p className="font-mono text-[11.5px] text-[#6f7686]">
            Seed local: {normalizedSeed || 'developer'} · GitHub App et agent local requis.
          </p>
        </div>
      </form>
    </SectionCard>
  );
}

interface ProjectSetupStateProps {
  hasAgents: boolean;
  hasRepositories: boolean;
  isSetupLoading: boolean;
  matchingAgentProjects: number;
  repoSelected: boolean;
}

function ProjectSetupState({
  hasAgents,
  hasRepositories,
  isSetupLoading,
  matchingAgentProjects,
  repoSelected,
}: ProjectSetupStateProps) {
  if (isSetupLoading) {
    return <SetupHint message="Chargement des dépôts GitHub et agents locaux." />;
  }

  if (!hasRepositories) {
    return <SetupHint message="Aucun dépôt GitHub disponible. Installe la GitHub App sur au moins un dépôt." />;
  }

  if (!hasAgents) {
    return <SetupHint message="Aucun agent local en ligne. Lance: pairdock-agent start" />;
  }

  if (repoSelected && matchingAgentProjects === 0) {
    return (
      <SetupHint message="Aucun projet agent publié pour ce dépôt. Ajoute pairdock.yml à la racine puis redémarre l'agent local." />
    );
  }

  return <SetupHint message="Readiness verte requise avant qu'un PM puisse lancer une session." />;
}

function SetupHint({ message }: { message: string }) {
  return (
    <div className="rounded-[9px] border border-white/10 bg-[#171b22] px-3 py-2 text-[12px] text-[#9aa2b3] lg:col-span-2">
      {message}
    </div>
  );
}

function resolveModelOptions(project: AgentProjectOption): DeveloperSetupAgentModel[] {
  const allowedModelIds = project.models?.length ? new Set(project.models) : null;
  return project.agentModels.filter((model) => !allowedModelIds || allowedModelIds.has(model.id));
}
