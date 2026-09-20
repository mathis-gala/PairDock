import type { DesktopAgentSnapshot, DesktopAgentStatus, DesktopProject } from '@pairdock/local-agent/desktop-contracts';
import { type ChangeEvent, useState } from 'react';
import type { DesktopBridge } from '../shared/bridge.js';
import { ToolsPanel } from './tools-panel.js';
import type { DesktopActionRunner } from './use-desktop-agent.js';

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
  run,
  onChooseFolder,
  onEditProject,
  onReconnect,
}: AgentDashboardProps) {
  const [projectToRemove, setProjectToRemove] = useState<string | null>(null);
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
  const configurationDisabled = busy || running || snapshot.busy;
  let heading = 'Ton agent est prêt à démarrer.';
  let description = 'Démarre l’agent pour rendre tes projets disponibles dans PairDock.';
  if (!toolsReady) {
    heading = 'Encore une étape pour démarrer.';
    description = 'Vérifie les outils de cette machine, puis connecte ton compte Codex.';
  }
  if (snapshot.status === 'online') {
    heading = 'Ton Mac est connecté.';
    description = 'L’agent peut recevoir les sessions de tes projets. Retrouve-les dans PairDock pour les partager.';
  }
  if (snapshot.status === 'reconnecting') {
    heading = 'L’agent essaie de se reconnecter.';
    description = 'Vérifie ta connexion et la disponibilité du serveur. La reconnexion est automatique.';
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

  return (
    <div className="dashboard">
      <section className="connection-summary" aria-labelledby="dashboard-title">
        <p className="eyebrow">Cet ordinateur</p>
        <div className="status-label" role="status">
          <span className={`status-dot ${snapshot.status}`} />
          {statusLabels[snapshot.status]}
        </div>
        <h1 id="dashboard-title">{heading}</h1>
        <p className="intro">{description}</p>
        <div className="actions">
          {running ? (
            <button className="primary" disabled={busy} onClick={handleOpenProjects} type="button">
              Ouvrir mes projets<span aria-hidden="true">↗</span>
            </button>
          ) : (
            <button
              className="primary"
              disabled={busy || !toolsReady || snapshot.busy}
              onClick={handleStart}
              type="button"
            >
              Démarrer l’agent
            </button>
          )}
          {running && (
            <button className="secondary" disabled={busy || snapshot.busy} onClick={handleStop} type="button">
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

      <ToolsPanel
        bridge={bridge}
        busy={busy}
        dockerRequired={dockerRequired}
        modelsAvailable={modelsAvailable}
        run={run}
        tools={snapshot.tools}
      />

      <section className="projects-section" aria-labelledby="projects-title">
        <div className="section-heading">
          <h2 id="projects-title">Projets sur ce Mac</h2>
          <button className="text-button" disabled={configurationDisabled} onClick={onChooseFolder} type="button">
            Ajouter un projet
          </button>
        </div>
        <div className="project-list">
          {snapshot.projects.map((project) => {
            const readiness = snapshot.readiness[project.key];
            function handleEdit() {
              onEditProject(project);
            }
            function handleReadiness() {
              run(`Vérification de ${project.name}`, () => bridge.runReadiness(project.key));
            }
            function handleConfirmRemoval() {
              setProjectToRemove(project.key);
            }
            function handleCancelRemoval() {
              setProjectToRemove(null);
            }
            function handleRemove() {
              run(`Retrait de ${project.name}`, async () => {
                await bridge.removeProject(project.key);
                setProjectToRemove(null);
              });
            }
            let readinessLabel = 'À vérifier';
            if (readiness) readinessLabel = readiness.ok ? 'Vérifié' : 'À corriger';
            const failedChecks = readiness?.checks.filter((check) => check.status === 'failed') ?? [];
            return (
              <article className="project-item" key={project.key}>
                <div className="project-item-heading">
                  <div>
                    <h3>{project.name}</h3>
                    <p>{project.repoFullName}</p>
                  </div>
                  <span className={`project-readiness ${readiness?.ok ? 'passed' : ''}`}>{readinessLabel}</span>
                </div>
                <p className="folder-path">{project.path}</p>
                <div className="inline-actions">
                  <button className="secondary compact" disabled={busy} onClick={handleReadiness} type="button">
                    Vérifier le projet
                  </button>
                  <button className="text-button" disabled={configurationDisabled} onClick={handleEdit} type="button">
                    Configurer
                  </button>
                  <button
                    className="text-button"
                    disabled={configurationDisabled}
                    onClick={handleConfirmRemoval}
                    type="button"
                  >
                    Retirer
                  </button>
                </div>
                {projectToRemove === project.key && (
                  <div className="notice">
                    <p>Retirer {project.name} de cet agent ? Le dossier et ses fichiers restent sur ton Mac.</p>
                    <div className="inline-actions">
                      <button
                        className="secondary compact"
                        disabled={configurationDisabled}
                        onClick={handleRemove}
                        type="button"
                      >
                        Retirer de cet agent
                      </button>
                      <button className="text-button" disabled={busy} onClick={handleCancelRemoval} type="button">
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
                {failedChecks.length > 0 && (
                  <div className="notice warning">
                    <p>Des vérifications demandent ton attention :</p>
                    <ul>
                      {failedChecks.map((check) => (
                        <li key={check.key}>{check.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            );
          })}
        </div>
        {running && <p className="hint">Arrête l’agent pour ajouter un projet ou modifier sa configuration.</p>}
      </section>

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
    </div>
  );
}
