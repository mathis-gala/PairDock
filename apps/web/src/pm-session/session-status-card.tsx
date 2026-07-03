import { SectionCard } from '../ui/section-card.js';
import { StatusBadge } from '../ui/status-badge.js';
import type { SessionEventFeedSnapshot } from './session-event-feed-store.js';
import type { SessionView } from './session-schemas.js';

interface SessionStatusCardProps {
  feed: SessionEventFeedSnapshot;
  session: SessionView;
}

export function SessionStatusCard({ feed, session }: SessionStatusCardProps) {
  const validationTone =
    session.latestValidation?.status === 'passed'
      ? 'positive'
      : session.latestValidation?.status === 'failed'
        ? 'danger'
        : 'warning';
  const feedTone =
    feed.connectionState === 'subscribed' ? 'positive' : feed.connectionState === 'error' ? 'danger' : 'warning';
  const agentTone = session.project.agentAvailability === 'online' ? 'positive' : 'danger';
  const branchLabel = session.branchName ?? session.project.defaultBranch;
  const participantSummary = session.participants
    .map((participant) => `${participant.displayName} (${participant.role})`)
    .join(' · ');

  return (
    <SectionCard
      title="Session overview"
      description="The workspace top bar keeps the shared project, branch, model, participants, and owning-agent status visible while the PM reviews progress."
      actions={<StatusBadge tone={feedTone}>{feed.connectionState}</StatusBadge>}
    >
      <dl className="grid gap-3 text-sm text-slate-300 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <dt className="text-slate-500">Project</dt>
          <dd>{session.project.name}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Branch</dt>
          <dd>{branchLabel}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Model</dt>
          <dd>{session.modelId}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Backend status</dt>
          <dd>{session.status}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Project owner</dt>
          <dd>{session.project.ownerDisplayName}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Owning agent</dt>
          <dd className="break-all">{session.project.owningAgentId}</dd>
        </div>
        <div className="md:col-span-2 xl:col-span-2">
          <dt className="text-slate-500">Participants</dt>
          <dd>{participantSummary}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <StatusBadge tone={agentTone}>Agent {session.project.agentAvailability}</StatusBadge>
        <StatusBadge tone={validationTone}>Validation {session.latestValidation?.status ?? 'pending'}</StatusBadge>
        {session.lastError ? <span className="text-sm text-rose-300">{session.lastError}</span> : null}
      </div>
    </SectionCard>
  );
}
