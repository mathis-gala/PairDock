import type { DesktopAgentSnapshot, DesktopAgentStatus, DesktopProject } from '@pairdock/local-agent/desktop-contracts';
import type { ChangeEvent } from 'react';
import type { DesktopBridge } from '../shared/bridge.js';
import { DesktopProjectItem } from './desktop-project-item.js';
import { ToolsPanel } from './tools-panel.js';
import type { DesktopActionRunner, DesktopReadinessOperation } from './use-desktop-agent.js';

const statusLabels: Record<DesktopAgentStatus, string> = {
  stopped: 'À l’arrêt',
  starting: 'Démarrage en cours',
  online: 'En ligne',
  reconnecting: 'Reconnexion en cours',
  error: 'Connexion interrompue',
};

interface AgentDashboardProps {
  snapshot: DesktopAgentSnapshot;
  bridge: DesktopBridge;
  busy: boolean;
  launchAtLogin: boolean;
  canLaunchAtLogin: boolean;
  readinessOperations: Record<string, DesktopReadinessOperation>;
  run: DesktopActionRunner;
  onChooseFolder: () => void;
  onEditProject: (project: DesktopProject) => void;
  onReconnect: () => void;
}

export function AgentDashboard({
  snapshot,
  bridge,
  busy,
  launchAtLogin,
  canLaunchAtLogin,
  readinessOperations,
  run,
  onChooseFolder,
  onEditProject,
  onReconnect,
}: AgentDashboardProps) {
  const dockerRequired = snapshot.dockerRequired;
  const modelsAvailable = snapshot.models.length > 0;
  const toolsReady = Boolean(
    snapshot.tools?.git.available &&
      snapshot.tools.codex.available &&
      snapshot.tools.codex.authenticated &&
      modelsAvailable &&
      (!dockerRequired || snapshot.tools.docker.available),
  );
  const running = snapshot.running;
  const configurationDisabled = busy || running || snapshot.busy || snapshot.status === 'starting';
  let heading = 'Ton agent est à l’arrêt.';
  let description = 'Démarre l’agent pour rendre cette machine disponible, puis vérifie les projets à partager.';
  if (!toolsReady) {
    heading = 'Préparer cette machine';
    description = 'Les outils signalés ci-dessous doivent être prêts avant de démarrer l’agent.';
  }
  if (snapshot.status === 'starting') {
    heading = 'Connexion à PairDock…';
    description = 'L’agent démarre. Les projets seront disponibles une fois la connexion établie.';
  }
  if (snapshot.status === 'online') {
    heading = 'Ton Mac est connecté.';
    description = 'Vérifie un projet, puis configure son partage dans PairDock.';
  }
  if (snapshot.status === 'reconnecting') {
    heading = 'Reconnexion en cours';
    description = 'Vérifie ta connexion et la disponibilité du serveur. L’agent réessaie automatiquement.';
  }
  if (snapshot.status === 'error') {
    heading = 'L’agent demande ton attention.';
    description = 'Vérifie le message d’erreur et les outils de cette machine avant de relancer l’agent.';
  }

  function handleStart() {
    run('Démarrage de l’agent', () => bridge.start());
  }
  function handleStop() {
    run('Arrêt de l’agent', () => bridge.stop());
  }
  function handleOpenProjects() {
    run('Ouverture de PairDock', () => bridge.openProjects());
  }
  function handleLaunchAtLogin(event: ChangeEvent<HTMLInputElement>) {
    const checked = event.target.checked;
    run('Enregistrement des préférences', () => bridge.setLaunchAtLogin(checked));
  }
  const toolsPanel = (
    <ToolsPanel
      bridge={bridge}
      busy={busy}
      configurationDisabled={configurationDisabled}
      dockerRequired={dockerRequired}
      modelsAvailable={modelsAvailable}
      run={run}
      tools={snapshot.tools}
    />
  );

  return (
    <div className="dashboard">
      <section className="connection-summary" aria-labelledby="dashboard-title">
        <div className="connection-heading">
          <p className="eyebrow">Cet ordinateur</p>
          <div className="status-label" role="status">
            <span className={`status-dot ${snapshot.status}`} />
            {statusLabels[snapshot.status]}
          </div>
        </div>
        <h1 id="dashboard-title">{heading}</h1>
        <p className="intro">{description}</p>
        <div className="actions">
          {running ? (
            <button className="primary" disabled={busy} onClick={handleOpenProjects} type="button">
              Ouvrir PairDock<span aria-hidden="true">↗</span>
            </button>
          ) : (
            <button
              className="primary"
              disabled={busy || !toolsReady || snapshot.busy || snapshot.status === 'starting'}
              onClick={handleStart}
              type="button"
            >
              Démarrer l’agent
            </button>
          )}
          {running && (
            <button className="quiet" disabled={busy || snapshot.busy} onClick={handleStop} type="button">
              Arrêter l’agent
            </button>
          )}
          {!running && (
            <button className="quiet" disabled={busy} onClick={handleOpenProjects} type="button">
              Ouvrir PairDock<span aria-hidden="true">↗</span>
            </button>
          )}
        </div>
        {snapshot.busy && (
          <p className="hint" role="status">
            Une session est en cours. L’agent pourra être arrêté une fois le travail terminé.
          </p>
        )}
      </section>

      {!toolsReady && toolsPanel}
      <section className="projects-section" aria-labelledby="projects-title">
        <div className="section-heading">
          <h2 id="projects-title">Projets sur ce Mac</h2>
          <button className="text-button" disabled={configurationDisabled} onClick={onChooseFolder} type="button">
            Ajouter un projet
          </button>
        </div>
        <div className="project-list">
          {snapshot.projects.map((project) => (
            <DesktopProjectItem
              bridge={bridge}
              busy={busy}
              configurationDisabled={configurationDisabled}
              key={project.key}
              onEditProject={onEditProject}
              onReconnect={onReconnect}
              project={project}
              readinessOperation={readinessOperations[project.key] ?? null}
              run={run}
              snapshot={snapshot}
            />
          ))}
        </div>
        {running && <p className="hint">Arrête l’agent pour ajouter un projet ou modifier sa configuration.</p>}
      </section>
      {toolsReady && toolsPanel}

      <details className="machine-settings">
        <summary>Réglages de cette machine</summary>
        <label className="preference" htmlFor="launch-at-login">
          <input
            checked={launchAtLogin}
            disabled={busy || !canLaunchAtLogin}
            id="launch-at-login"
            onChange={handleLaunchAtLogin}
            type="checkbox"
          />
          <span>Ouvrir PairDock à la connexion au Mac</span>
        </label>
        {!canLaunchAtLogin && <p className="hint">Cette option est disponible dans l’application installée.</p>}
        <div className="connection-settings">
          <button className="text-button" disabled={configurationDisabled} onClick={onReconnect} type="button">
            Associer à nouveau
          </button>
          <p className="hint">
            Reconnecte ce Mac à ton compte ou à un autre serveur. Les réglages de tes projets sont conservés.
          </p>
          {running && <p className="hint">Arrête l’agent avant de modifier la connexion.</p>}
        </div>
      </details>
    </div>
  );
}
