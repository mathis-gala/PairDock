import { SharedProjectCard } from '../components/pm-session/shared-project-card.js';
import { ProductShell } from '../components/product-shell.js';
import { SectionCard } from '../components/section-card.js';
import { useAuthSession } from '../hooks/use-auth-session.js';
import { useSharedProjects } from '../hooks/use-shared-projects.js';

interface PmDashboardPageProps {
  accessToken: string;
  onSignOut: () => void;
  onOpenSession: (sessionId: string) => void;
}

export function PmDashboardPage({ accessToken, onOpenSession, onSignOut }: PmDashboardPageProps) {
  const authSession = useAuthSession();
  const { sharedProjectsQuery, startSessionMutation } = useSharedProjects(accessToken, onOpenSession);
  const pendingProjectId = startSessionMutation.variables?.id ?? null;

  if (!authSession) {
    return null;
  }

  return (
    <ProductShell
      accent="pm"
      navItems={['Projets partagés', 'Mes sessions', 'Pull requests']}
      onSignOut={onSignOut}
      user={authSession.user}
    >
      <div className="px-6 py-8 lg:px-9">
        <div className="mb-6 max-w-3xl">
          <h1 className="font-['Space_Grotesk'] text-2xl font-semibold tracking-[-0.01em]">
            Projets partagés avec toi
          </h1>
          <p className="mt-1 text-[13.5px] text-[#8b92a1]">
            Démarre une session pour décrire un correctif. Tu empruntes l'agent du développeur, aucune installation
            requise.
          </p>
        </div>
        {sharedProjectsQuery.isLoading ? (
          <SectionCard
            title="Chargement des projets"
            description="Lecture des partages et de la disponibilité agent."
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
            title="Aucun projet partagé"
            description="Un projet apparaît ici après partage par un développeur et readiness agent."
          />
        ) : null}
        {sharedProjectsQuery.data && sharedProjectsQuery.data.length > 0 ? (
          <div className="grid max-w-[920px] gap-3.5 lg:grid-cols-2">
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
    </ProductShell>
  );
}
