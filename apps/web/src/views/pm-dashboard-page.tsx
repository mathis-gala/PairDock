import { SharedProjectCard } from '../components/pm-session/shared-project-card.js';
import { SectionCard } from '../components/section-card.js';
import { useSharedProjects } from '../hooks/use-shared-projects.js';

interface PmDashboardPageProps {
  accessToken: string;
  onOpenSession: (sessionId: string) => void;
}

export function PmDashboardPage({ accessToken, onOpenSession }: PmDashboardPageProps) {
  const { sharedProjectsQuery, startSessionMutation } = useSharedProjects(accessToken, onOpenSession);
  const pendingProjectId = startSessionMutation.variables?.id ?? null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 max-w-3xl space-y-2">
        <h2 className="text-3xl font-semibold text-white">Shared projects</h2>
        <p className="text-slate-400">
          Start a PM session only from projects that are already shared with you and currently ready for PM-started
          work.
        </p>
      </div>
      {sharedProjectsQuery.isLoading ? (
        <SectionCard
          title="Loading shared projects"
          description="Reading project memberships and live start availability."
        />
      ) : null}
      {sharedProjectsQuery.isError ? (
        <SectionCard
          title="Could not load shared projects"
          description={
            sharedProjectsQuery.error instanceof Error ? sharedProjectsQuery.error.message : 'Request failed.'
          }
        />
      ) : null}
      {sharedProjectsQuery.data && sharedProjectsQuery.data.length === 0 ? (
        <SectionCard
          title="No shared projects yet"
          description="A project only appears here after a developer shares it with your PM identity and the owning agent reports a ready state."
        />
      ) : null}
      {sharedProjectsQuery.data && sharedProjectsQuery.data.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {sharedProjectsQuery.data.map((project) => (
            <SharedProjectCard
              key={project.id}
              onStart={(selectedProject) => {
                startSessionMutation.reset();
                startSessionMutation.mutate(selectedProject);
              }}
              project={project}
              startPending={pendingProjectId === project.id && startSessionMutation.isPending}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
