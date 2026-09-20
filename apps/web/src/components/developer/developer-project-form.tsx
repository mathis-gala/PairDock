import type { CreateDeveloperProjectInput, DeveloperAgent, DeveloperProjectSetup } from '@pairdock/shared-contracts';
import { type ChangeEvent, type FormEvent, useState } from 'react';
import { authApi } from '../../api/client.js';
import { rememberDeveloperAgentReturn } from '../../hooks/use-auth-session.js';
import { type AgentProjectOption, resolveProjectCreation } from '../../lib/project-creation.js';
import { Button } from '../button.js';
import { SectionCard } from '../section-card.js';
import { SelectInput } from '../select-input.js';
import { TextArea } from '../text-area.js';
import { TextInput } from '../text-input.js';

interface DeveloperProjectFormProps {
  devices?: DeveloperAgent[];
  isSetupLoading: boolean;
  isSubmitting: boolean;
  preferredAgentProjectKey?: string;
  onSubmit: (input: CreateDeveloperProjectInput) => Promise<void>;
  setup: DeveloperProjectSetup | null;
}

export function DeveloperProjectForm({
  devices = [],
  isSetupLoading,
  isSubmitting,
  onSubmit,
  preferredAgentProjectKey,
  setup,
}: DeveloperProjectFormProps) {
  const [edits, setEdits] = useState<Partial<CreateDeveloperProjectInput>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    values: state,
    repositories,
    selectedRepository,
    selectedAgentProject,
    matchingAgentProjects,
    modelOptions,
    reasoningOptions,
    canCreate,
    handoffUnavailable,
  } = resolveProjectCreation(setup, edits, preferredAgentProjectKey);
  const branchPlaceholder = selectedRepository ? 'Sélectionner une branche' : 'Choisis d’abord un dépôt';
  let agentProjectPlaceholder = 'Sélectionner un dossier local';
  if (!selectedRepository) agentProjectPlaceholder = 'Choisis d’abord un dépôt';
  else if (matchingAgentProjects.length === 0) agentProjectPlaceholder = 'Ajoute ce dépôt dans l’application PairDock';
  let modelPlaceholder = 'Sélectionner un modèle';
  if (!selectedAgentProject) modelPlaceholder = 'Choisis d’abord un dossier local';
  else if (modelOptions.length === 0) modelPlaceholder = 'Aucun modèle disponible sur cet appareil';
  const createDisabled = isSetupLoading || isSubmitting || !canCreate;

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setEdits((current) => ({ ...current, name: event.target.value }));
  }

  function handleDescriptionChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setEdits((current) => ({ ...current, description: event.target.value }));
  }

  function handleRepositoryChange(event: ChangeEvent<HTMLSelectElement>) {
    const repoFullName = event.target.value;
    setEdits(({ name, description, pmCanStartSessions }) => ({ name, description, pmCanStartSessions, repoFullName }));
  }

  function handleBranchChange(event: ChangeEvent<HTMLSelectElement>) {
    setEdits((current) => ({ ...current, defaultBranch: event.target.value }));
  }

  function handleAgentProjectChange(event: ChangeEvent<HTMLSelectElement>) {
    const agentProjectKey = event.target.value;
    setEdits((current) => ({
      ...current,
      repoFullName: state.repoFullName,
      agentProjectKey,
      defaultModelId: undefined,
      defaultReasoningEffort: undefined,
    }));
  }

  function handleModelChange(event: ChangeEvent<HTMLSelectElement>) {
    const defaultModelId = event.target.value;
    setEdits((current) => ({ ...current, defaultModelId, defaultReasoningEffort: undefined }));
  }

  function handleReasoningChange(event: ChangeEvent<HTMLSelectElement>) {
    setEdits((current) => ({ ...current, defaultReasoningEffort: event.target.value }));
  }

  function handlePmCanStartSessionsChange(event: ChangeEvent<HTMLInputElement>) {
    setEdits((current) => ({ ...current, pmCanStartSessions: event.target.checked }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createDisabled) return;
    setSubmitError(null);
    try {
      await onSubmit({ ...state, name: state.name.trim(), description: state.description?.trim() });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Le projet n’a pas pu être créé. Réessaie.');
    }
  }

  function formatAgentProject(project: AgentProjectOption) {
    const device = devices.find((candidate) => candidate.agentId === project.agentId && !candidate.revokedAt);
    return `${project.name} · ${device?.deviceName ?? project.pathAlias}`;
  }

  if (isSetupLoading) {
    return (
      <SectionCard title="Préparation du projet" description="Chargement des dépôts GitHub et des dossiers locaux…" />
    );
  }

  if (!repositories.length || !setup?.agents.length) {
    return (
      <SectionCard title="Préparer ton premier projet" description="Connecte ton dépôt et ton appareil pour continuer.">
        <ProjectSetupState
          hasAgents={(setup?.agents.length ?? 0) > 0}
          hasRepositories={repositories.length > 0}
          matchingAgentProjects={0}
          repoSelected={false}
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Créer un projet"
      description="Vérifie le dépôt proposé et choisis le modèle qui traitera les demandes de ton équipe."
    >
      <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
        {handoffUnavailable ? (
          <p className="text-sm leading-6 text-amber-200 lg:col-span-2" role="status">
            Le dossier transmis par l’application n’est pas disponible. Vérifie que PairDock est connecté et que le
            dépôt est autorisé sur GitHub, puis actualise.
          </p>
        ) : null}
        <label className="space-y-2 text-sm text-slate-300" htmlFor="developer-project-name">
          <span className="block">Nom du projet</span>
          <TextInput
            disabled={isSubmitting}
            id="developer-project-name"
            onChange={handleNameChange}
            required
            value={state.name}
          />
        </label>
        <label className="space-y-2 text-sm text-slate-300" htmlFor="developer-project-repository">
          <span className="block">Dépôt GitHub</span>
          <SelectInput
            disabled={isSubmitting}
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
            disabled={isSubmitting}
            id="developer-project-branch"
            onChange={handleBranchChange}
            required
            value={state.defaultBranch}
          >
            <option disabled value="">
              {branchPlaceholder}
            </option>
            {selectedRepository?.branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </SelectInput>
        </label>
        <label className="space-y-2 text-sm text-slate-300" htmlFor="developer-project-agent-project">
          <span className="block">Dossier et appareil</span>
          <SelectInput
            disabled={isSubmitting}
            id="developer-project-agent-project"
            onChange={handleAgentProjectChange}
            required
            value={state.agentProjectKey}
          >
            <option disabled value="">
              {agentProjectPlaceholder}
            </option>
            {matchingAgentProjects.map((project) => (
              <option key={`${project.agentId}:${project.key}`} value={project.key}>
                {formatAgentProject(project)}
              </option>
            ))}
          </SelectInput>
        </label>
        <label className="space-y-2 text-sm text-slate-300" htmlFor="developer-project-model">
          <span className="block">Modèle</span>
          <SelectInput
            disabled={isSubmitting}
            id="developer-project-model"
            onChange={handleModelChange}
            required
            value={state.defaultModelId}
          >
            <option disabled value="">
              {modelPlaceholder}
            </option>
            {modelOptions.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label} ({model.provider})
              </option>
            ))}
          </SelectInput>
        </label>
        <label className="space-y-2 text-sm text-slate-300" htmlFor="developer-project-reasoning">
          <span className="block">Niveau de raisonnement</span>
          <SelectInput
            disabled={isSubmitting}
            id="developer-project-reasoning"
            onChange={handleReasoningChange}
            required
            value={state.defaultReasoningEffort}
          >
            <option disabled value="">
              Choisis d’abord un modèle
            </option>
            {reasoningOptions.map((effort) => (
              <option key={effort.id} value={effort.id}>
                {effort.label}
              </option>
            ))}
          </SelectInput>
        </label>
        <label className="flex min-h-10 items-center gap-2 self-end rounded-[9px] border border-white/10 bg-[#1f232b] px-3 py-2 text-sm text-slate-300">
          <input
            disabled={isSubmitting}
            checked={state.pmCanStartSessions ?? true}
            onChange={handlePmCanStartSessionsChange}
            type="checkbox"
          />
          Autoriser les PM invités à démarrer des sessions
        </label>
        <label className="space-y-2 text-sm text-slate-300 lg:col-span-2" htmlFor="developer-project-description">
          <span className="block">Description (facultative)</span>
          <TextArea
            disabled={isSubmitting}
            id="developer-project-description"
            onChange={handleDescriptionChange}
            value={state.description ?? ''}
          />
        </label>
        <ProjectSetupState
          hasAgents={(setup?.agents.length ?? 0) > 0}
          hasRepositories={repositories.length > 0}
          matchingAgentProjects={matchingAgentProjects.length}
          repoSelected={Boolean(selectedRepository)}
        />
        {submitError ? (
          <p className="text-sm text-rose-300 lg:col-span-2" role="alert">
            {submitError}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
          <Button disabled={createDisabled} type="submit">
            {isSubmitting ? 'Création…' : 'Créer le projet'}
          </Button>
          <p className="font-mono text-[11.5px] text-[#6f7686]">
            Tu pourras ensuite vérifier le projet et inviter un PM.
          </p>
        </div>
      </form>
    </SectionCard>
  );
}

interface ProjectSetupStateProps {
  hasAgents: boolean;
  hasRepositories: boolean;
  matchingAgentProjects: number;
  repoSelected: boolean;
}

function ProjectSetupState({
  hasAgents,
  hasRepositories,
  matchingAgentProjects,
  repoSelected,
}: ProjectSetupStateProps) {
  function handleReconnectGithub() {
    rememberDeveloperAgentReturn();
    window.location.assign(authApi.developerStartUrl());
  }

  if (!hasRepositories) {
    return (
      <div className="space-y-3 text-sm leading-6 text-[#aeb5c3]">
        <p>
          Aucun dépôt GitHub disponible. Vérifie que l’application GitHub de ton équipe a accès au dépôt, puis
          reconnecte GitHub.
        </p>
        <Button onClick={handleReconnectGithub}>Reconnecter GitHub</Button>
      </div>
    );
  }

  if (!hasAgents) {
    return (
      <SetupHint
        agentSetupLink
        message="Aucun agent local en ligne. Associe ton Mac, puis ouvre l’application PairDock."
      />
    );
  }

  if (repoSelected && matchingAgentProjects === 0) {
    return (
      <SetupHint agentSetupLink message="Ajoute ce dépôt avec le sélecteur de dossiers dans l’application PairDock." />
    );
  }

  return <SetupHint message="Après la création, lance les vérifications du projet avant de le partager." />;
}

function SetupHint({ agentSetupLink = false, message }: { agentSetupLink?: boolean; message: string }) {
  return (
    <div className="rounded-[9px] border border-white/10 bg-[#171b22] px-3 py-2 text-[12px] text-[#9aa2b3] lg:col-span-2">
      {message}
      {agentSetupLink ? (
        <a className="ml-2 inline-block text-[#5fdf9b] underline underline-offset-4" href="#/developer/agents">
          Configurer mon agent
        </a>
      ) : null}
    </div>
  );
}
