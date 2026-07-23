import type { SharedProjectSummary } from '@pairdock/shared-contracts';
import { Button } from '../button.js';
import { SectionCard } from '../section-card.js';
import { StatusBadge } from '../status-badge.js';

interface SharedProjectCardProps {
  onStart: (project: SharedProjectSummary) => void;
  project: SharedProjectSummary;
  startPending: boolean;
}

export function SharedProjectCard({ onStart, project, startPending }: SharedProjectCardProps) {
  const availabilityTone = project.canStartSession
    ? 'positive'
    : project.agentAvailability === 'offline'
      ? 'danger'
      : 'warning';

  return (
    <SectionCard
      title={project.name}
      description={project.description ?? project.repoFullName}
      actions={
        <StatusBadge tone={availabilityTone}>
          {project.canStartSession ? 'Ready' : project.agentAvailability}
        </StatusBadge>
      }
    >
      <dl className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
        <div>
          <dt className="text-slate-600">Owner</dt>
          <dd>{project.ownerDisplayName}</dd>
        </div>
        <div>
          <dt className="text-slate-600">Repository</dt>
          <dd>{project.repoFullName}</dd>
        </div>
        <div>
          <dt className="text-slate-600">Default branch</dt>
          <dd>{project.defaultBranch}</dd>
        </div>
      </dl>
      {project.unavailableReason ? <p className="mt-4 text-sm text-amber-300">{project.unavailableReason}</p> : null}
      <div className="mt-5">
        <Button disabled={!project.canStartSession || startPending} onClick={() => onStart(project)}>
          {startPending ? 'Démarrage…' : 'Nouvelle demande'}
        </Button>
      </div>
    </SectionCard>
  );
}
