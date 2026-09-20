import type { CreateDeveloperProjectInput, UpdateDeveloperProjectInput } from '@pairdock/shared-contracts';
import { useState } from 'react';
import { Button } from '../components/button.js';
import { DeveloperOnboardingJourney } from '../components/developer/developer-onboarding-journey.js';
import { DeveloperProjectCard } from '../components/developer/developer-project-card.js';
import { DeveloperProjectForm } from '../components/developer/developer-project-form.js';
import { ProductShell } from '../components/product-shell.js';
import { SectionCard } from '../components/section-card.js';
import { useDeveloperAgents } from '../hooks/use-developer-agents.js';
import { useDeveloperProjects } from '../hooks/use-developer-projects.js';
import type { AuthSession } from '../schemas/auth.js';

interface DeveloperHomePageProps {
  agentProjectKey?: string;
  onSignOut: () => void;
  session: AuthSession;
}

const navItems = [
  { active: true, href: '#/developer', label: 'Projets' },
  { active: false, href: '#/developer/agents', label: 'Agents' },
];

export function DeveloperHomePage({ agentProjectKey, onSignOut, session }: DeveloperHomePageProps) {
  const [creationRequested, setCreationRequested] = useState(false);
  const [dismissedHandoff, setDismissedHandoff] = useState<string | undefined>();
  const [createdProjectName, setCreatedProjectName] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const { agentsQuery } = useDeveloperAgents(session.accessToken);
  const {
    closeSessionMutation,
    createProjectMutation,
    projectsQuery,
    readinessByProject,
    requestReadinessMutation,
    shareProjectMutation,
    setupQuery,
    updateExecutionDefaultsMutation,
    updateProjectMutation,
  } = useDeveloperProjects(session.accessToken);
  const projects = projectsQuery.data ?? [];
  const shareError = shareProjectMutation.error instanceof Error ? shareProjectMutation.error.message : null;
  const closeError = closeSessionMutation.error instanceof Error ? closeSessionMutation.error.message : null;
  const updateDefaultsError =
    updateExecutionDefaultsMutation.error instanceof Error ? updateExecutionDefaultsMutation.error.message : null;
  const updateProjectError = updateProjectMutation.error instanceof Error ? updateProjectMutation.error.message : null;

  const handedOffProject = projects.find((project) => project.agentProjectKey === agentProjectKey);
  const hasLoadedProjects = projectsQuery.data !== undefined;
  const pendingHandoff = Boolean(
    hasLoadedProjects && agentProjectKey && agentProjectKey !== dismissedHandoff && !handedOffProject,
  );
  const firstProject = hasLoadedProjects && projects.length === 0;
  const showCreation = firstProject || creationRequested || pendingHandoff;
  const projectToGuide =
    projects.find((project) => project.id === createdProjectId) ??
    handedOffProject ??
    projects.find(
      (project) => project.agentAvailability !== 'online' || !project.readiness?.ok || project.pmMemberCount === 0,
    ) ??
    null;
  const showJourney = hasLoadedProjects && (showCreation || Boolean(projectToGuide));
  const isGuidedProjectVerifying = Boolean(projectToGuide && readinessByProject[projectToGuide.id]?.isPending);

  function handleOpenCreation() {
    createProjectMutation.reset();
    setCreationRequested(true);
    requestAnimationFrame(() => document.getElementById('developer-project-creation')?.focus());
  }

  function handleCloseCreation() {
    setCreationRequested(false);
    setDismissedHandoff(agentProjectKey);
  }

  async function handleCreateProject(input: CreateDeveloperProjectInput) {
    createProjectMutation.reset();
    const project = await createProjectMutation.mutateAsync(input);
    setCreatedProjectName(input.name);
    setCreatedProjectId(project.id);
    setCreationRequested(false);
    setDismissedHandoff(agentProjectKey);
  }

  function handleRefreshSetup() {
    void setupQuery.refetch();
    void agentsQuery.refetch();
  }

  async function handleCloseSession(sessionId: string) {
    closeSessionMutation.reset();
    await closeSessionMutation.mutateAsync(sessionId);
  }

  async function handleRequestReadiness(projectId: string) {
    try {
      await requestReadinessMutation.mutateAsync(projectId);
    } catch {
      // Each project's mutation error remains visible next to its card below.
    }
  }

  async function handleShareProject(projectId: string, pmEmail: string) {
    shareProjectMutation.reset();
    await shareProjectMutation.mutateAsync({ projectId, pmEmail });
  }

  async function handleUpdateExecutionDefaults(projectId: string, modelId: string, reasoningEffort: string) {
    updateExecutionDefaultsMutation.reset();
    await updateExecutionDefaultsMutation.mutateAsync({ projectId, modelId, reasoningEffort });
  }

  async function handleUpdateProject(projectId: string, input: UpdateDeveloperProjectInput) {
    updateProjectMutation.reset();
    await updateProjectMutation.mutateAsync({ projectId, ...input });
  }

  return (
    <ProductShell navItems={navItems} onSignOut={onSignOut} user={session.user} viewLabel="Projets">
      <div className="mx-auto min-w-0 max-w-7xl px-4 py-8 sm:px-6 lg:px-9">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-['Space_Grotesk'] text-2xl font-semibold tracking-[-0.01em]">Projets</h1>
            <p className="mt-1 text-[13.5px] text-[#8b92a1]">
              Prépare tes projets, partage-les avec ton équipe et retrouve les sessions en cours.
            </p>
          </div>
          {projects.length > 0 && !showCreation ? <Button onClick={handleOpenCreation}>Nouveau projet</Button> : null}
        </div>
        {createdProjectName ? (
          <p className="mb-5 text-sm text-[#a9efc9]" role="status">
            Projet « {createdProjectName} » créé. Vérifie sa préparation avant d’inviter ton équipe.
          </p>
        ) : null}
        {showJourney ? (
          <DeveloperOnboardingJourney
            isVerifying={isGuidedProjectVerifying}
            onCreateProject={handleOpenCreation}
            project={showCreation ? null : projectToGuide}
            setup={setupQuery.data ?? null}
          />
        ) : null}
        {showCreation ? (
          <div className="mb-6 scroll-mt-5 outline-none" id="developer-project-creation" tabIndex={-1}>
            <div className="mb-3 flex flex-wrap justify-end gap-2">
              <Button disabled={setupQuery.isFetching} onClick={handleRefreshSetup} variant="secondary">
                {setupQuery.isFetching ? 'Actualisation…' : 'Actualiser les dépôts et appareils'}
              </Button>
              {projects.length > 0 ? (
                <Button disabled={createProjectMutation.isPending} onClick={handleCloseCreation} variant="ghost">
                  Annuler
                </Button>
              ) : null}
            </div>
            {setupQuery.isError && !setupQuery.data ? (
              <ErrorCard title="Configuration indisponible" message={setupQuery.error.message} />
            ) : (
              <>
                {setupQuery.isError ? (
                  <p className="mb-3 text-sm text-amber-200" role="alert">
                    Actualisation impossible. Tes choix sont conservés. {setupQuery.error.message}
                  </p>
                ) : null}
                <DeveloperProjectForm
                  isSetupLoading={setupQuery.isLoading}
                  isSubmitting={createProjectMutation.isPending}
                  devices={agentsQuery.data ?? []}
                  key={agentProjectKey ?? 'manual'}
                  onSubmit={handleCreateProject}
                  preferredAgentProjectKey={pendingHandoff ? agentProjectKey : undefined}
                  setup={setupQuery.data ?? null}
                />
              </>
            )}
          </div>
        ) : null}
        <div className="mt-5 space-y-3">
          {shareError ? <ErrorCard title="Partage du projet impossible" message={shareError} /> : null}
          {closeError ? <ErrorCard title="Fermeture de la session impossible" message={closeError} /> : null}
          {updateDefaultsError ? (
            <ErrorCard title="Configuration du modèle impossible" message={updateDefaultsError} />
          ) : null}
        </div>

        {projectsQuery.isLoading ? (
          <SectionCard
            className="mt-5"
            title="Chargement des projets"
            description="Lecture des projets, sessions et accès PM."
          />
        ) : null}
        {projectsQuery.isError ? (
          <ErrorCard
            title="Projets indisponibles"
            message={projectsQuery.error instanceof Error ? projectsQuery.error.message : 'La demande a échoué.'}
          />
        ) : null}

        <div className="mt-5 space-y-3">
          {projects.length > 0
            ? projects.map((project) => {
                const readinessRequest = readinessByProject[project.id];
                return (
                  <div className="space-y-3" key={project.id}>
                    {readinessRequest?.error ? (
                      <ErrorCard
                        title={`Vérification de « ${project.name} » impossible`}
                        message={readinessRequest.error}
                      />
                    ) : null}
                    <DeveloperProjectCard
                      closePendingSessionId={
                        closeSessionMutation.isPending ? (closeSessionMutation.variables ?? null) : null
                      }
                      onCloseSession={handleCloseSession}
                      onResetUpdateProject={updateProjectMutation.reset}
                      onRequestReadiness={handleRequestReadiness}
                      onShareProject={handleShareProject}
                      onUpdateExecutionDefaults={handleUpdateExecutionDefaults}
                      onUpdateProject={handleUpdateProject}
                      project={project}
                      readinessPendingProjectId={readinessRequest?.isPending ? project.id : null}
                      sharePendingProjectId={
                        shareProjectMutation.isPending ? (shareProjectMutation.variables?.projectId ?? null) : null
                      }
                      updateDefaultsPendingProjectId={
                        updateExecutionDefaultsMutation.isPending
                          ? (updateExecutionDefaultsMutation.variables?.projectId ?? null)
                          : null
                      }
                      updateProjectError={
                        updateProjectMutation.variables?.projectId === project.id ? updateProjectError : null
                      }
                      updateProjectPendingId={
                        updateProjectMutation.isPending ? (updateProjectMutation.variables?.projectId ?? null) : null
                      }
                    />
                  </div>
                );
              })
            : null}
        </div>
      </div>
    </ProductShell>
  );
}

interface ErrorCardProps {
  title: string;
  message: string;
}

function ErrorCard({ message, title }: ErrorCardProps) {
  return <SectionCard className="border-rose-500/40" title={title} description={message} />;
}
