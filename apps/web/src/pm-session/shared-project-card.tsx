import type { SharedProjectSummary } from '@pairdock/shared-contracts';
import { classNames } from '../lib/class-names.js';
import { Button } from '../ui/button.js';
import { SectionCard } from '../ui/section-card.js';
import { StatusBadge } from '../ui/status-badge.js';

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
      <dl className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Owner</dt>
          <dd>{project.ownerDisplayName}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Repository</dt>
          <dd>{project.repoFullName}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Default branch</dt>
          <dd>{project.defaultBranch}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Default model</dt>
          <dd>{project.defaultModelId}</dd>
        </div>
      </dl>
      {project.unavailableReason ? <p className="mt-4 text-sm text-amber-300">{project.unavailableReason}</p> : null}
      <div className={classNames('mt-5 flex justify-end', project.canStartSession ? '' : 'opacity-90')}>
        <Button disabled={!project.canStartSession || startPending} onClick={() => onStart(project)}>
          {startPending ? 'Opening session…' : 'Start PM session'}
        </Button>
      </div>
    </SectionCard>
  );
}
