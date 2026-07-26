import type { SharedSessionHistoryItem } from '@pairdock/shared-contracts';
import { type ChangeEvent, useState } from 'react';
import { Button } from '../components/button.js';
import { ProductShell } from '../components/product-shell.js';
import { PullRequestStatusLink } from '../components/pull-request-status-link.js';
import { SectionCard } from '../components/section-card.js';
import { SelectInput } from '../components/select-input.js';
import { StatusBadge } from '../components/status-badge.js';
import { useAuthSession } from '../hooks/use-auth-session.js';
import { useSharedSessionHistory } from '../hooks/use-shared-session-history.js';
import { filterSharedSessionHistory, type SessionHistoryStatusFilter } from '../lib/session-history-filters.js';

interface PmActivityPageProps {
  accessToken: string;
  mode: 'sessions' | 'review-requests';
  onOpenSession: (sessionId: string) => void;
  onSignOut: () => void;
}

export function PmActivityPage({ accessToken, mode, onOpenSession, onSignOut }: PmActivityPageProps) {
  const authSession = useAuthSession();
  const historyQuery = useSharedSessionHistory(accessToken);
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<SessionHistoryStatusFilter>('all');

  if (!authSession) {
    return null;
  }

  const allSessions = historyQuery.data ?? [];
  const sessionsForView =
    mode === 'review-requests' ? allSessions.filter((session) => session.reviewRequest !== null) : allSessions;
  const projectOptions = Array.from(
    new Map(sessionsForView.map((session) => [session.projectId, session.projectName])).entries(),
  );
  const sessions =
    mode === 'sessions'
      ? filterSharedSessionHistory(sessionsForView, { projectId: projectFilter, status: statusFilter })
      : sessionsForView;
  const isReviewRequestView = mode === 'review-requests';
  const title = isReviewRequestView ? 'Pull requests' : 'Sessions';

  function handleProjectFilterChange(event: ChangeEvent<HTMLSelectElement>) {
    setProjectFilter(event.target.value);
  }

  function handleStatusFilterChange(event: ChangeEvent<HTMLSelectElement>) {
    setStatusFilter(event.target.value as SessionHistoryStatusFilter);
  }

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
          <p className="mt-1 text-[13.5px] text-[#8b92a1]">
            {isReviewRequestView
              ? 'Retrouve les pull requests créées après validation PM et suis leur statut GitHub.'
              : 'Reprends une session passée ou vérifie son état courant.'}
          </p>
        </div>

        {mode === 'sessions' ? (
          <div className="mb-5 grid max-w-[980px] gap-3 rounded-xl border border-white/10 bg-[#171a20] p-4 sm:grid-cols-2">
            <label
              className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8b92a1]"
              htmlFor="session-project-filter"
            >
              Projet
              <SelectInput
                aria-label="Filtrer par projet"
                id="session-project-filter"
                value={projectFilter}
                onChange={handleProjectFilterChange}
              >
                <option value="all">Tous les projets</option>
                {projectOptions.map(([projectId, projectName]) => (
                  <option key={projectId} value={projectId}>
                    {projectName}
                  </option>
                ))}
              </SelectInput>
            </label>
            <label
              className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8b92a1]"
              htmlFor="session-status-filter"
            >
              Statut
              <SelectInput
                aria-label="Filtrer par statut"
                id="session-status-filter"
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <option value="all">Toutes les sessions</option>
                <option value="opened">Ouvertes</option>
                <option value="closed">Fermées</option>
              </SelectInput>
            </label>
            <p aria-live="polite" className="text-xs text-[#8b92a1] sm:col-span-2">
              {sessions.length} session{sessions.length === 1 ? '' : 's'} affichée{sessions.length === 1 ? '' : 's'}
            </p>
          </div>
        ) : null}

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
            title={
              isReviewRequestView
                ? 'Aucune pull request'
                : allSessions.length === 0
                  ? 'Aucune session'
                  : 'Aucun résultat'
            }
            description={
              isReviewRequestView
                ? 'Une draft pull request apparaîtra ici après validation des checks et soumission par le PM.'
                : allSessions.length === 0
                  ? 'Démarre une session depuis un projet partagé pour la retrouver ici.'
                  : 'Aucune session ne correspond à ces filtres.'
            }
          />
        ) : null}
        {sessions.length > 0 ? (
          <div className="max-w-[980px] overflow-hidden rounded-xl border border-white/10 bg-[#171a20]">
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
    <article className="grid gap-4 border-b border-white/10 p-4 last:border-b-0 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-sm font-semibold text-[#eef0f4]">{session.projectName}</h2>
          <StatusBadge tone={session.status === 'FAILED' ? 'danger' : 'neutral'}>{session.status}</StatusBadge>
        </div>
        <p className="mt-1 truncate font-mono text-xs text-[#7d8493]">{session.repoFullName}</p>
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        <Button onClick={handleOpenSession} variant="secondary">
          Ouvrir la session
        </Button>
        {session.reviewRequest?.url ? <PullRequestStatusLink reviewRequest={session.reviewRequest} /> : null}
      </div>
    </article>
  );
}
