import { ConnectionActivityRail } from '../components/developer/connection-activity-rail.js';
import { DeveloperProjectCard } from '../components/developer/developer-project-card.js';
import { DeveloperProjectForm } from '../components/developer/developer-project-form.js';
import { SectionCard } from '../components/section-card.js';
import { useDeveloperProjects } from '../hooks/use-developer-projects.js';
import type { AuthSession } from '../schemas/auth.js';

interface DeveloperHomePageProps {
  session: AuthSession;
}

export function DeveloperHomePage({ session }: DeveloperHomePageProps) {
  const {
    closeSessionMutation,
    createProjectMutation,
    projectsQuery,
    requestReadinessMutation,
    shareProjectMutation,
    startSessionMutation,
  } = useDeveloperProjects(session.accessToken);
  const projects = projectsQuery.data ?? [];
  const createError = createProjectMutation.error instanceof Error ? createProjectMutation.error.message : null;
  const shareError = shareProjectMutation.error instanceof Error ? shareProjectMutation.error.message : null;
  const startError = startSessionMutation.error instanceof Error ? startSessionMutation.error.message : null;
  const closeError = closeSessionMutation.error instanceof Error ? closeSessionMutation.error.message : null;
  const readinessError =
    requestReadinessMutation.error instanceof Error ? requestReadinessMutation.error.message : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div className="max-w-3xl space-y-2">
        <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Developer control</p>
        <h2 className="text-3xl font-semibold text-white">Project, session, model, sharing, and cleanup controls</h2>
        <p className="text-slate-400">
          Signed in as {session.user.displayName ?? session.user.email}. Create a project, grant PM access, choose a
          model, start a developer-owned session, and close it with explicit cleanup confirmation.
        </p>
      </div>

      <DeveloperProjectForm
        developerSeed={session.user.email}
        isSubmitting={createProjectMutation.isPending}
        onSubmit={async (input) => {
          createProjectMutation.reset();
          await createProjectMutation.mutateAsync(input);
        }}
      />
      {createError ? <ErrorCard title="Could not create project" message={createError} /> : null}
      {shareError ? <ErrorCard title="Could not share project" message={shareError} /> : null}
      {readinessError ? <ErrorCard title="Could not request readiness check" message={readinessError} /> : null}
      {startError ? <ErrorCard title="Could not start session" message={startError} /> : null}
      {closeError ? <ErrorCard title="Could not close session" message={closeError} /> : null}

      {projectsQuery.isLoading ? (
        <SectionCard
          title="Loading developer projects"
          description="Reading owned projects, sessions, and PM access."
        />
      ) : null}
      {projectsQuery.isError ? (
        <ErrorCard
          title="Could not load developer projects"
          message={projectsQuery.error instanceof Error ? projectsQuery.error.message : 'Request failed.'}
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          {projects.length > 0 ? (
            projects.map((project) => (
              <DeveloperProjectCard
                closePendingSessionId={closeSessionMutation.variables ?? null}
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
                onStartSession={async (projectId, modelId) => {
                  startSessionMutation.reset();
                  await startSessionMutation.mutateAsync({ projectId, modelId });
                }}
                project={project}
                readinessPendingProjectId={requestReadinessMutation.variables ?? null}
                sharePendingProjectId={shareProjectMutation.variables?.projectId ?? null}
                startPendingProjectId={startSessionMutation.variables?.projectId ?? null}
              />
            ))
          ) : projectsQuery.isLoading ? null : (
            <SectionCard
              title="No developer projects yet"
              description="Use the project creation screen above to register a local repository and source-control connection."
            />
          )}
        </div>
        <ConnectionActivityRail projects={projects} />
      </div>
    </div>
  );
}

interface ErrorCardProps {
  title: string;
  message: string;
}

function ErrorCard({ message, title }: ErrorCardProps) {
  return <SectionCard className="border-rose-500/40" title={title} description={message} />;
}
