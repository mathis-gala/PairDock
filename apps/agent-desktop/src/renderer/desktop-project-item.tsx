import type { DesktopAgentSnapshot, DesktopProject } from '@pairdock/local-agent/desktop-contracts';
import { useState } from 'react';
import type { DesktopBridge } from '../shared/bridge.js';
import { formatDesktopError } from './display-error.js';
import { ReadinessCheck } from './readiness-check.js';
import { checkDesktopProject, type DesktopActionRunner, type DesktopReadinessOperation } from './use-desktop-agent.js';

interface DesktopProjectItemProps {
  project: DesktopProject;
  snapshot: DesktopAgentSnapshot;
  bridge: DesktopBridge;
  busy: boolean;
  configurationDisabled: boolean;
  readinessOperation: DesktopReadinessOperation | null;
  run: DesktopActionRunner;
  onEditProject: (project: DesktopProject) => void;
  onReconnect: () => void;
}

export function DesktopProjectItem({
  project,
  snapshot,
  bridge,
  busy,
  configurationDisabled,
  readinessOperation,
  run,
  onEditProject,
  onReconnect,
}: DesktopProjectItemProps) {
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  const readiness = snapshot.readiness[project.key];
  const operation = readinessOperation?.projectKey === project.key ? readinessOperation : null;
  let status = 'unchecked';
  let readinessLabel = 'Non vérifié';
  if (readiness) {
    status = readiness.ok ? 'passed' : 'failed';
    readinessLabel = readiness.ok ? 'Prêt' : 'À corriger';
  }
  if (operation?.status === 'checking') {
    status = 'checking';
    readinessLabel = 'Vérification en cours';
  }
  if (operation?.status === 'failed') {
    status = 'failed';
    readinessLabel = 'Vérification échouée';
  }
  const canShare = snapshot.status === 'online' && status === 'passed';
  const checks = readiness?.checks ?? [];
  const requiredIssues = checks.filter((check) => check.required && check.status !== 'passed');
  const otherChecks = checks.filter((check) => !check.required || check.status === 'passed');
  const optionalIssues = checks.filter(
    (check) => !check.required && (check.status === 'warning' || check.status === 'failed'),
  );
  let nextStep = 'Vérifie les outils et les réglages de ce projet avant de le partager.';
  if (status === 'checking') nextStep = 'Contrôle des outils, du dépôt et des réglages de ce projet…';
  else if (status === 'failed') nextStep = 'Corrige les points signalés, puis relance la vérification.';
  else if (status === 'passed') {
    nextStep = canShare
      ? 'Continue dans PairDock pour configurer les accès et inviter ton équipe.'
      : 'Démarre l’agent pour configurer le partage dans PairDock.';
  }
  const verificationLabel = status === 'checking' ? 'Vérification…' : 'Vérifier le projet';

  function handleEdit() {
    onEditProject(project);
  }
  function handleReadiness() {
    const context = { readinessProjectKey: project.key };
    run(`Vérification de ${project.name}`, () => checkDesktopProject(bridge, project.key), context);
  }
  function handleShare() {
    run(`Partage de ${project.name}`, () => bridge.openProjects(project.key));
  }
  function handleConfirmRemoval() {
    setConfirmRemoval(true);
  }
  function handleCancelRemoval() {
    setConfirmRemoval(false);
  }
  function handleRemove() {
    run(`Retrait de ${project.name}`, async () => {
      await bridge.removeProject(project.key);
      setConfirmRemoval(false);
    });
  }

  return (
    <article className="project-item">
      <div className="project-item-heading">
        <div>
          <h3>{project.name}</h3>
          <p>{project.repoFullName}</p>
        </div>
        <span className={`project-readiness ${status}`} aria-live="polite">
          {readinessLabel}
        </span>
      </div>
      <p className="project-next-step" role="status">
        {nextStep}
      </p>
      <div className="inline-actions project-actions">
        {canShare && (
          <button className="secondary compact" disabled={busy} onClick={handleShare} type="button">
            Configurer le partage<span aria-hidden="true">↗</span>
          </button>
        )}
        <button
          className={canShare ? 'text-button' : 'secondary compact'}
          disabled={busy}
          onClick={handleReadiness}
          type="button"
        >
          {verificationLabel}
        </button>
        <button className="text-button" disabled={configurationDisabled} onClick={handleEdit} type="button">
          Configurer
        </button>
      </div>
      {operation?.status === 'failed' && (
        <div className="notice warning" role="alert">
          <p>{formatDesktopError(operation.error)}</p>
          <p className="hint">Vérifie les dossiers et les outils des projets configurés, puis réessaie.</p>
        </div>
      )}
      {!operation && requiredIssues.length > 0 && (
        <ul className="readiness-issues">
          {requiredIssues.map((check) => (
            <ReadinessCheck
              bridge={bridge}
              busy={busy}
              check={check}
              checks={checks}
              configurationDisabled={configurationDisabled}
              key={check.key}
              onConfigure={handleEdit}
              onReconnect={onReconnect}
              onRemove={handleConfirmRemoval}
              run={run}
            />
          ))}
        </ul>
      )}
      {!operation && otherChecks.length > 0 && (
        <details className="readiness-details">
          <summary>
            {optionalIssues.length > 0 ? 'Résultats et points facultatifs' : 'Détails des vérifications'}
          </summary>
          <ul>
            {otherChecks.map((check) => (
              <ReadinessCheck
                bridge={bridge}
                busy={busy}
                check={check}
                checks={checks}
                configurationDisabled={configurationDisabled}
                key={check.key}
                onConfigure={handleEdit}
                onReconnect={onReconnect}
                onRemove={handleConfirmRemoval}
                run={run}
              />
            ))}
          </ul>
        </details>
      )}
      <details className="project-settings">
        <summary>Dossier et options du projet</summary>
        <p className="folder-path">{project.path}</p>
        <button className="text-button" disabled={configurationDisabled} onClick={handleConfirmRemoval} type="button">
          Retirer de cet agent
        </button>
      </details>
      {confirmRemoval && (
        <div className="notice">
          <p>Retirer {project.name} de cet agent ? Le dossier et ses fichiers restent sur ton Mac.</p>
          <div className="inline-actions">
            <button className="secondary compact" disabled={configurationDisabled} onClick={handleRemove} type="button">
              Confirmer le retrait
            </button>
            <button className="text-button" disabled={busy} onClick={handleCancelRemoval} type="button">
              Annuler
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
