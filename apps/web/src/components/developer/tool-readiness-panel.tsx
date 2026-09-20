import type { DeveloperProjectReadiness, ToolReadinessCheck } from '@pairdock/shared-contracts';
import { Button } from '../button.js';
import { StatusBadge } from '../status-badge.js';

const checkLabels: Record<ToolReadinessCheck['key'], string> = {
  agent: 'Agent local',
  git: 'Git',
  repository: 'Dépôt Git',
  'source-control': 'Accès au dépôt distant',
  'agent-harness': 'Connexion Codex',
  docker: 'Docker',
  'preview-tunnel': 'Partage de l’aperçu',
  'project-commands': 'Commandes du projet',
};

const statusLabels: Record<ToolReadinessCheck['status'], string> = {
  passed: 'Validé',
  failed: 'À corriger',
  warning: 'À vérifier',
  skipped: 'Non vérifié',
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
  const checks = isRequesting ? [] : (readiness?.checks ?? []);
  let statusLabel = readiness ? (readiness.ok ? 'Prêt' : 'À corriger') : 'Non vérifié';
  if (isRequesting) statusLabel = 'En cours';

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Vérifications du projet</p>
          <p className="mt-1 text-sm text-slate-400">
            Validez les outils locaux pour que votre PM puisse démarrer une session.
          </p>
        </div>
        <div className="shrink-0 text-right">
          {!isRequesting && readiness ? <p className="mb-1 text-xs text-slate-500">Dernier résultat</p> : null}
          <StatusBadge tone={!isRequesting && readiness?.ok ? 'positive' : 'warning'}>{statusLabel}</StatusBadge>
        </div>
      </div>

      {agentAvailability === 'offline' ? (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-sm text-amber-200">
          L’agent est hors ligne. Ouvrez l’application PairDock sur votre Mac, démarrez l’agent, puis relancez les
          vérifications.
        </p>
      ) : null}

      <div className="mt-3 space-y-2">
        {isRequesting ? (
          <p className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-sm text-slate-400" role="status">
            Vérification en cours sur votre ordinateur… Le nouveau résultat s’affichera ici. Cela peut prendre jusqu’à
            90 secondes.
          </p>
        ) : null}
        {!isRequesting ? checks.map((check) => <ToolReadinessRow check={check} key={check.key} />) : null}
        {!isRequesting && checks.length === 0 ? (
          <p className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-sm text-slate-400">
            {readiness
              ? 'L’agent n’a fourni aucun détail pour ce résultat.'
              : 'Aucun résultat disponible. Connectez l’agent dans l’application PairDock, puis lancez les vérifications.'}
          </p>
        ) : null}
      </div>

      <Button className="mt-3" disabled={agentAvailability !== 'online' || isRequesting} onClick={onRequestReadiness}>
        {isRequesting ? 'Vérification en cours…' : 'Vérifier le projet'}
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
          {!check.required ? <span className="text-xs text-slate-500">Facultatif</span> : null}
          <StatusBadge tone={statusTone(check.status)}>{statusLabels[check.status]}</StatusBadge>
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
