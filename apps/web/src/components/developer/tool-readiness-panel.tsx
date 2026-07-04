import type { DeveloperProjectReadiness, ToolReadinessCheck } from '@pairdock/shared-contracts';
import { Button } from '../button.js';
import { StatusBadge } from '../status-badge.js';

const checkLabels: Record<ToolReadinessCheck['key'], string> = {
  agent: 'Local agent',
  git: 'Git CLI',
  repository: 'Git repository',
  'source-control': 'Source-control access',
  'agent-harness': 'Agent harness',
  docker: 'Docker',
  'preview-tunnel': 'Preview tunnel',
  'project-commands': 'Project commands',
};

interface ToolReadinessPanelProps {
  agentAvailability: 'online' | 'offline';
  isRequesting: boolean;
  onRequestReadiness: () => Promise<void>;
  readiness: DeveloperProjectReadiness | null;
}

export function ToolReadinessPanel({
  agentAvailability,
  isRequesting,
  onRequestReadiness,
  readiness,
}: ToolReadinessPanelProps) {
  const checks = readiness?.checks ?? [];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Developer readiness</p>
          <p className="mt-1 text-sm text-slate-400">
            Required local checks must pass before starting a developer session.
          </p>
        </div>
        <StatusBadge tone={readiness?.ok ? 'positive' : 'warning'}>
          {readiness ? (readiness.ok ? 'Ready' : 'Blocked') : 'Not checked'}
        </StatusBadge>
      </div>

      {agentAvailability === 'offline' ? (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-sm text-amber-200">
          Local agent is offline. Start pairdock-agent, then rerun readiness checks.
        </p>
      ) : null}

      <div className="mt-3 space-y-2">
        {checks.length > 0 ? (
          checks.map((check) => <ToolReadinessRow check={check} key={check.key} />)
        ) : (
          <p className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-sm text-slate-400">
            No readiness result has been reported yet. Run checks from the connected local agent.
          </p>
        )}
      </div>

      <Button className="mt-3" disabled={agentAvailability !== 'online' || isRequesting} onClick={onRequestReadiness}>
        {isRequesting ? 'Requesting checks…' : 'Run readiness checks'}
      </Button>
    </div>
  );
}

function ToolReadinessRow({ check }: { check: ToolReadinessCheck }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-slate-200">{checkLabels[check.key]}</p>
        <div className="flex items-center gap-2">
          {!check.required ? <span className="text-xs text-slate-500">Optional</span> : null}
          <StatusBadge tone={statusTone(check.status)}>{check.status}</StatusBadge>
        </div>
      </div>
      {check.message ? <p className="mt-1 text-sm text-slate-400">{check.message}</p> : null}
      {check.remediation ? <p className="mt-1 text-sm text-amber-300">{check.remediation}</p> : null}
    </div>
  );
}

function statusTone(status: ToolReadinessCheck['status']) {
  if (status === 'passed') {
    return 'positive';
  }

  if (status === 'failed') {
    return 'danger';
  }

  return 'warning';
}
