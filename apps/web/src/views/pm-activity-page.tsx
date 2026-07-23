import type { SharedSessionHistoryItem } from '@pairdock/shared-contracts';
import { Button } from '../components/button.js';
import { ProductShell } from '../components/product-shell.js';
import { SectionCard } from '../components/section-card.js';
import { StatusBadge } from '../components/status-badge.js';
import { useAuthSession } from '../hooks/use-auth-session.js';
import { useSharedSessionHistory } from '../hooks/use-shared-session-history.js';

interface PmActivityPageProps {
  accessToken: string;
  mode: 'sessions' | 'review-requests';
  onOpenSession: (sessionId: string) => void;
  onSignOut: () => void;
}

export function PmActivityPage({ accessToken, mode, onOpenSession, onSignOut }: PmActivityPageProps) {
  const authSession = useAuthSession();
  const historyQuery = useSharedSessionHistory(accessToken);

  if (!authSession) {
    return null;
  }

  const allSessions = historyQuery.data ?? [];
  const sessions =
    mode === 'review-requests' ? allSessions.filter((session) => session.reviewRequest !== null) : allSessions;
  const isReviewRequestView = mode === 'review-requests';
  const title = isReviewRequestView ? 'Pull requests' : 'Sessions';

  return (
    <ProductShell
      accent="pm"
      navItems={[
        { active: false, href: '#/pm', label: 'Projets partagés' },
        { active: mode === 'sessions', href: '#/pm/sessions', label: 'Sessions' },
        {
          active: mode === 'review-requests',
          href: '#/pm/review-requests',
          label: 'Pull requests',
        },
      ]}
      onSignOut={onSignOut}
      user={authSession.user}
      viewLabel={title}
    >
      <div className="px-6 py-8 lg:px-9">
        <div className="mb-6 max-w-3xl">
          <h1 className="font-['Space_Grotesk'] text-2xl font-semibold tracking-[-0.01em]">{title}</h1>
          <p className="mt-1 text-[13.5px] text-[#5e6878]">
            {isReviewRequestView
              ? 'Retrouve les draft pull requests créées après validation PM.'
              : 'Reprends une session passée ou vérifie son état courant.'}
          </p>
        </div>

        {historyQuery.isLoading ? (
          <SectionCard title="Chargement de l’historique" description="Lecture des sessions partagées." />
        ) : null}
        {historyQuery.isError ? (
          <SectionCard
            className="border-rose-500/40"
            title="Historique indisponible"
            description={historyQuery.error instanceof Error ? historyQuery.error.message : 'Request failed.'}
          />
        ) : null}
        {!historyQuery.isLoading && !historyQuery.isError && sessions.length === 0 ? (
          <SectionCard
            title={isReviewRequestView ? 'Aucune pull request' : 'Aucune session'}
            description={
              isReviewRequestView
                ? 'Une draft pull request apparaîtra ici après validation des checks et soumission par le PM.'
                : 'Démarre une session depuis un projet partagé pour la retrouver ici.'
            }
          />
        ) : null}
        {sessions.length > 0 ? (
          <div className="max-w-[980px] overflow-hidden rounded-xl border border-black/10 bg-[#ffffff]">
            {sessions.map((session) => (
              <SessionHistoryRow key={session.id} onOpenSession={onOpenSession} session={session} />
            ))}
          </div>
        ) : null}
      </div>
    </ProductShell>
  );
}

function SessionHistoryRow({
  onOpenSession,
  session,
}: {
  onOpenSession: (sessionId: string) => void;
  session: SharedSessionHistoryItem;
}) {
  function handleOpenSession() {
    onOpenSession(session.id);
  }

  return (
    <article className="grid gap-4 border-b border-black/10 p-4 last:border-b-0 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-sm font-semibold text-[#20242b]">{session.projectName}</h2>
          <StatusBadge tone={session.status === 'FAILED' ? 'danger' : 'neutral'}>{session.status}</StatusBadge>
        </div>
        <p className="mt-1 truncate font-mono text-xs text-[#657080]">{session.repoFullName}</p>
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        <Button onClick={handleOpenSession} variant="secondary">
          Ouvrir la session
        </Button>
        {session.reviewRequest?.url ? (
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#8b5fb0] px-4 text-[13px] font-semibold text-[#fffaff] transition hover:bg-[#9d75c0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5fb0]/40"
            href={session.reviewRequest.url}
            rel="noreferrer"
            target="_blank"
          >
            PR #{session.reviewRequest.number ?? 'draft'}
          </a>
        ) : null}
      </div>
    </article>
  );
}
