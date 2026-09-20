import type { ToolReadinessCheck } from '@pairdock/shared-contracts';
import type { ReactNode } from 'react';
import type { DesktopBridge } from '../shared/bridge.js';
import type { DesktopActionRunner } from './use-desktop-agent.js';

const labels: Record<ToolReadinessCheck['key'], string> = {
  agent: 'Connexion à PairDock',
  git: 'Git',
  repository: 'Dossier du projet',
  'source-control': 'Dépôt GitHub',
  'agent-harness': 'Agent Codex',
  docker: 'Docker',
  'preview-tunnel': 'Partage des aperçus',
  'project-commands': 'Scripts et outils du projet',
};

const statuses: Record<ToolReadinessCheck['status'], string> = {
  passed: 'Validé',
  failed: 'À corriger',
  warning: 'À vérifier',
  skipped: 'Non requis',
};

interface ReadinessCheckProps {
  check: ToolReadinessCheck;
  checks: ToolReadinessCheck[];
  bridge: DesktopBridge;
  busy: boolean;
  configurationDisabled: boolean;
  run: DesktopActionRunner;
  onConfigure: () => void;
  onRemove: () => void;
  onReconnect: () => void;
}

export function ReadinessCheck({
  check,
  checks,
  bridge,
  busy,
  configurationDisabled,
  run,
  onConfigure,
  onRemove,
  onReconnect,
}: ReadinessCheckProps) {
  function handleGitHelp() {
    run('Ouverture de l’installation de Git', () => bridge.openToolHelp('git'));
  }
  function handleCodexHelp() {
    run('Ouverture de l’aide Codex', () => bridge.openToolHelp('codex'));
  }
  function handleDockerOpen() {
    run('Ouverture de Docker', () => bridge.openDocker());
  }
  function handleDockerHelp() {
    run('Ouverture de l’installation de Docker', () => bridge.openToolHelp('docker'));
  }

  const needsAttention =
    check.status === 'failed' || check.status === 'warning' || (check.required && check.status === 'skipped');
  const gitFailed = checks.some((candidate) => candidate.key === 'git' && candidate.status !== 'passed');
  const repositoryFailed = checks.some((candidate) => candidate.key === 'repository' && candidate.status !== 'passed');
  const statusLabel = check.required && check.status === 'skipped' ? 'Non vérifié' : statuses[check.status];
  let guidance: string | null = null;
  let action: ReactNode = null;
  let requiresConfiguration = false;
  if (needsAttention) {
    switch (check.key) {
      case 'agent':
        guidance = 'Associe à nouveau ce Mac à ton compte PairDock, puis relance la vérification.';
        action = (
          <button className="secondary compact" disabled={configurationDisabled} onClick={onReconnect} type="button">
            Associer à nouveau
          </button>
        );
        requiresConfiguration = true;
        break;
      case 'git':
        guidance = 'Vérifie que Git est installé sur ce Mac, puis relance la vérification.';
        action = (
          <button className="secondary compact" disabled={busy} onClick={handleGitHelp} type="button">
            Installer Git
          </button>
        );
        break;
      case 'repository':
        guidance =
          'Vérifie que le dossier existe et contient ton dépôt Git. S’il a été déplacé, retire cette configuration puis ajoute son nouvel emplacement.';
        if (gitFailed) guidance = 'Vérifie Git d’abord, puis relance la vérification de ce dossier.';
        else {
          action = (
            <button className="secondary compact" disabled={configurationDisabled} onClick={onRemove} type="button">
              Retirer cette configuration
            </button>
          );
          requiresConfiguration = true;
        }
        break;
      case 'source-control':
        guidance = 'Dans ton outil Git, rétablis le dépôt GitHub distant « origin », puis relance la vérification.';
        if (gitFailed) guidance = 'Vérifie Git d’abord pour pouvoir contrôler le dépôt distant.';
        else if (repositoryFailed)
          guidance = 'Rétablis l’accès au dossier du projet avant de vérifier son dépôt GitHub.';
        break;
      case 'agent-harness':
        guidance =
          'Mets à jour ou réinstalle PairDock pour disposer d’un Codex compatible, puis relance la vérification.';
        action = (
          <button className="secondary compact" disabled={busy} onClick={handleCodexHelp} type="button">
            Aide Codex
          </button>
        );
        break;
      case 'docker':
        guidance = 'Ouvre Docker Desktop et attends son démarrage, puis relance la vérification.';
        action = (
          <div className="inline-actions">
            <button className="secondary compact" disabled={busy} onClick={handleDockerOpen} type="button">
              Ouvrir Docker
            </button>
            <button className="text-button" disabled={busy} onClick={handleDockerHelp} type="button">
              Installer Docker
            </button>
          </div>
        );
        break;
      case 'preview-tunnel':
        guidance =
          'Pour rendre les aperçus accessibles à distance, configure leur partage dans les réglages PairDock du dépôt.';
        break;
      case 'project-commands':
        guidance =
          'Vérifie les scripts de compilation, de test et de vérification du code. Installe les outils manquants indiqués dans le diagnostic, puis rouvre PairDock.';
        action = (
          <button className="secondary compact" disabled={configurationDisabled} onClick={onConfigure} type="button">
            Configurer les scripts
          </button>
        );
        requiresConfiguration = true;
        break;
    }
  }

  return (
    <li className="readiness-check">
      <div className="readiness-check-heading">
        <strong>{labels[check.key]}</strong>
        <span className="hint">
          {statusLabel}
          {!check.required && ' · Facultatif'}
        </span>
      </div>
      {guidance && <p>{guidance}</p>}
      {action && <div className="readiness-remediation">{action}</div>}
      {requiresConfiguration && configurationDisabled && !busy && (
        <p className="hint">Arrête l’agent avant de modifier cette configuration.</p>
      )}
      {(check.message || check.remediation) && (
        <details className="check-diagnostic">
          <summary>Diagnostic détaillé</summary>
          {check.message && <p>{check.message}</p>}
          {check.remediation && <p>{check.remediation}</p>}
        </details>
      )}
    </li>
  );
}
