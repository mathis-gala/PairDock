import { ConnectionActivityRail } from '../components/developer/connection-activity-rail.js';
import { DeveloperProjectCard } from '../components/developer/developer-project-card.js';
import { DeveloperProjectForm } from '../components/developer/developer-project-form.js';
import { ProductShell } from '../components/product-shell.js';
import { SectionCard } from '../components/section-card.js';
import { useDeveloperProjects } from '../hooks/use-developer-projects.js';
import type { AuthSession } from '../schemas/auth.js';

interface DeveloperHomePageProps {
  onSignOut: () => void;
  session: AuthSession;
}

export function DeveloperHomePage({ onSignOut, session }: DeveloperHomePageProps) {
  const {
    closeSessionMutation,
    createProjectMutation,
    projectsQuery,
    requestReadinessMutation,
    shareProjectMutation,
    setupQuery,
    updateExecutionDefaultsMutation,
  } = useDeveloperProjects(session.accessToken);
  const projects = projectsQuery.data ?? [];
  const createError = createProjectMutation.error instanceof Error ? createProjectMutation.error.message : null;
  const shareError = shareProjectMutation.error instanceof Error ? shareProjectMutation.error.message : null;
  const closeError = closeSessionMutation.error instanceof Error ? closeSessionMutation.error.message : null;
  const updateDefaultsError =
    updateExecutionDefaultsMutation.error instanceof Error ? updateExecutionDefaultsMutation.error.message : null;
  const readinessError =
    requestReadinessMutation.error instanceof Error ? requestReadinessMutation.error.message : null;

  return (
    <ProductShell
      navItems={[{ active: true, href: '#/developer', label: 'Projets' }]}
      onSignOut={onSignOut}
      user={session.user}
      viewLabel="Projets"
    >
      <div className="flex min-h-screen min-w-0">
        <div className="min-w-0 flex-1 overflow-auto px-6 py-8 lg:px-9">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-['Space_Grotesk'] text-2xl font-semibold tracking-[-0.01em]">Projets</h1>
              <p className="mt-1 text-[13.5px] text-[#5e6878]">
                Chaque projet pointe vers un dépôt, un agent local et un modèle par défaut.
              </p>
            </div>
          </div>

          <DeveloperProjectForm
            developerSeed={session.user.email}
            isSetupLoading={setupQuery.isLoading}
            isSubmitting={createProjectMutation.isPending}
            onSubmit={async (input) => {
              createProjectMutation.reset();
              await createProjectMutation.mutateAsync(input);
            }}
            setup={setupQuery.data ?? null}
          />
          <div className="mt-5 space-y-3">
            {createError ? <ErrorCard title="Could not create project" message={createError} /> : null}
            {shareError ? <ErrorCard title="Could not share project" message={shareError} /> : null}
            {readinessError ? <ErrorCard title="Could not request readiness check" message={readinessError} /> : null}
            {closeError ? <ErrorCard title="Could not close session" message={closeError} /> : null}
            {updateDefaultsError ? (
              <ErrorCard title="Could not update agent configuration" message={updateDefaultsError} />
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
              title="Could not load developer projects"
              message={projectsQuery.error instanceof Error ? projectsQuery.error.message : 'Request failed.'}
            />
          ) : null}

          <div className="mt-5 space-y-3">
            {projects.length > 0 ? (
              projects.map((project) => (
                <DeveloperProjectCard
                  closePendingSessionId={
                    closeSessionMutation.isPending ? (closeSessionMutation.variables ?? null) : null
                  }
                  key={project.id}
                  onCloseSession={async (sessionId) => {
                    closeSessionMutation.reset();
                    await closeSessionMutation.mutateAsync(sessionId);
                  }}
                  onRequestReadiness={async (projectId) => {
                    requestReadinessMutation.reset();
                    await requestReadinessMutation.mutateAsync(projectId);
                  }}
                  onShareProject={async (projectId, pmEmail) => {
                    shareProjectMutation.reset();
                    await shareProjectMutation.mutateAsync({ projectId, pmEmail });
                  }}
                  onUpdateExecutionDefaults={async (projectId, modelId, reasoningEffort) => {
                    updateExecutionDefaultsMutation.reset();
                    await updateExecutionDefaultsMutation.mutateAsync({ projectId, modelId, reasoningEffort });
                  }}
                  project={project}
                  readinessPendingProjectId={
                    requestReadinessMutation.isPending ? (requestReadinessMutation.variables ?? null) : null
                  }
                  sharePendingProjectId={
                    shareProjectMutation.isPending ? (shareProjectMutation.variables?.projectId ?? null) : null
                  }
                  updateDefaultsPendingProjectId={
                    updateExecutionDefaultsMutation.isPending
                      ? (updateExecutionDefaultsMutation.variables?.projectId ?? null)
                      : null
                  }
                />
              ))
            ) : projectsQuery.isLoading ? null : (
              <SectionCard
                title="Aucun projet"
                description="Crée un projet pour enregistrer un dépôt local et sa connexion source-control."
              />
            )}
          </div>
        </div>
        <ConnectionActivityRail projects={projects} />
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
