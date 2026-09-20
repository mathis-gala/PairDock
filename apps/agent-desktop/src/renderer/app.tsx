import type { DesktopProject, DesktopProjectDraft } from '@pairdock/local-agent/desktop-contracts';
import { type ReactNode, useState } from 'react';
import type { DesktopBridge } from '../shared/bridge.js';
import { AgentDashboard } from './agent-dashboard.js';
import { ConnectStep } from './connect-step.js';
import { formatDesktopError } from './display-error.js';
import { ProjectForm } from './project-form.js';
import { useDesktopAgent } from './use-desktop-agent.js';

interface DesktopAppProps {
  bridge: DesktopBridge;
}

const steps = ['Connecter', 'Choisir un projet', 'Démarrer'];

export function DesktopApp({ bridge }: DesktopAppProps) {
  const agent = useDesktopAgent(bridge);
  const [draft, setDraft] = useState<DesktopProjectDraft | null>(null);
  const [reconnectFromAgentId, setReconnectFromAgentId] = useState<string | null>(null);
  const snapshot = agent.snapshot.data;
  const preferences = agent.preferences.data;
  const busy = agent.action.isPending;
  const showConnection =
    !snapshot?.connection || Boolean(snapshot.pairing) || snapshot.connection.agentId === reconnectFromAgentId;
  let currentStep = 0;
  if (snapshot?.connection) currentStep = 1;
  if (snapshot?.projects.length && !draft) currentStep = 2;
  if (showConnection) currentStep = 0;
  const showSteps = Boolean(snapshot?.initialized) && (showConnection || snapshot?.projects.length === 0);
  const actionError = agent.readinessOperation ? null : agent.action.error?.message;
  const readinessError = formatDesktopError(agent.readinessOperation?.error);
  const snapshotError = formatDesktopError(snapshot?.error);
  const error = formatDesktopError(
    actionError ??
      agent.snapshot.error?.message ??
      agent.preferences.error?.message ??
      (snapshotError === readinessError ? null : snapshotError),
  );

  function handleChooseFolder() {
    agent.run('Choix du dossier', async () => {
      const selected = await bridge.chooseFolder();
      if (selected) setDraft(selected);
    });
  }
  function handleCloseProject() {
    setDraft(null);
  }
  function handleEditProject(project: DesktopProject) {
    setDraft(project);
  }
  function handleReconnect() {
    setReconnectFromAgentId(snapshot?.connection?.agentId ?? null);
  }
  function handleCancelReconnect() {
    setReconnectFromAgentId(null);
  }
  function handleInstallGit() {
    agent.run('Ouverture de l’installation de Git', () => bridge.openToolHelp('git'));
  }
  function handleVerifyTools() {
    agent.run('Vérification des outils', () => bridge.checkTools());
  }
  function handleRetry() {
    agent.run('Chargement de l’agent', () =>
      Promise.all([agent.snapshot.refetch({ throwOnError: true }), agent.preferences.refetch({ throwOnError: true })]),
    );
  }

  let content: ReactNode;
  if (!snapshot || !preferences) {
    content = (
      <section className="setup-content loading-view" aria-busy="true">
        <h1>Ouverture de PairDock</h1>
        <p className="intro">Chargement de la configuration de ce Mac…</p>
        {error && (
          <button className="secondary" onClick={handleRetry} type="button">
            Réessayer
          </button>
        )}
      </section>
    );
  } else if (!snapshot.initialized) {
    content = (
      <section className="setup-content" aria-labelledby="profile-recovery-title">
        <h1 id="profile-recovery-title">Profil local indisponible</h1>
        <p className="intro">
          PairDock doit charger la configuration enregistrée avant de continuer. Rétablis l’accès au profil ou au
          trousseau de ce Mac, puis réessaie.
        </p>
        <div className="actions">
          <button className="primary" disabled={busy} onClick={agent.retryInitialization} type="button">
            {busy ? 'Chargement…' : 'Réessayer'}
          </button>
        </div>
      </section>
    );
  } else if (showConnection) {
    content = (
      <ConnectStep
        bridge={bridge}
        backendUrl={snapshot.connection?.backendUrl}
        busy={busy}
        deviceName={preferences.deviceName}
        run={agent.run}
        onCancel={snapshot.connection ? handleCancelReconnect : undefined}
        snapshot={snapshot}
      />
    );
  } else if (draft) {
    content = (
      <ProjectForm
        bridge={bridge}
        busy={busy}
        draft={draft}
        key={draft.path}
        onClose={handleCloseProject}
        run={agent.run}
      />
    );
  } else if (snapshot.projects.length === 0) {
    content = (
      <section className="setup-content" aria-labelledby="folder-title">
        <p className="eyebrow">Compte connecté</p>
        <h1 id="folder-title">Quel projet veux-tu utiliser ?</h1>
        <p className="intro">
          Choisis un dépôt Git déjà présent sur ce Mac. PairDock prépare les réglages à partir de ses scripts.
        </p>
        <div className="folder-illustration" aria-hidden="true">
          <svg aria-hidden="true" fill="none" viewBox="0 0 64 52">
            <path
              d="M5 43V12a5 5 0 0 1 5-5h16l7 8h21a5 5 0 0 1 5 5v23a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M5 23h54" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <button
          className="primary"
          disabled={busy || !snapshot.tools?.git.available}
          onClick={handleChooseFolder}
          type="button"
        >
          Choisir un dossier
        </button>
        <button className="quiet" disabled={busy} onClick={handleReconnect} type="button">
          Associer à nouveau
        </button>
        {!snapshot.tools && (
          <p className="hint" role="status">
            Vérification de Git sur ce Mac…
          </p>
        )}
        {snapshot.tools && !snapshot.tools.git.available && (
          <div className="notice warning">
            <p>Git est nécessaire pour ouvrir un dépôt sur ce Mac.</p>
            <div className="inline-actions">
              <button className="secondary compact" disabled={busy} onClick={handleInstallGit} type="button">
                Installer Git
              </button>
              <button className="text-button" disabled={busy} onClick={handleVerifyTools} type="button">
                Vérifier Git
              </button>
            </div>
          </div>
        )}
        <p className="hint project-tools-hint">
          Les outils habituels du projet, comme Node.js et son gestionnaire de paquets, doivent déjà être installés.
        </p>
        <p className="footnote">Les sessions travailleront dans leurs propres dossiers, à partir de ce dépôt.</p>
      </section>
    );
  } else {
    content = (
      <AgentDashboard
        bridge={bridge}
        busy={busy}
        canLaunchAtLogin={preferences.canLaunchAtLogin}
        launchAtLogin={preferences.launchAtLogin}
        onChooseFolder={handleChooseFolder}
        onEditProject={handleEditProject}
        onReconnect={handleReconnect}
        readinessOperations={agent.readinessOperations}
        run={agent.run}
        snapshot={snapshot}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="skip-link" href="#main">
          Aller au contenu
        </a>
        <div className="wordmark">
          <svg aria-hidden="true" fill="none" viewBox="0 0 28 28">
            <rect height="18" rx="4" stroke="currentColor" strokeWidth="1.8" width="14" x="3" y="4" />
            <rect fill="currentColor" height="18" rx="4" width="14" x="11" y="7" />
          </svg>
          <span>PairDock</span>
          <span className="app-label">Agent local</span>
        </div>
        <span className="platform-label">macOS</span>
      </header>
      {showSteps && (
        <nav aria-label="Étapes de configuration" className="setup-progress">
          <ol>
            {steps.map((step, index) => (
              <li
                aria-current={index === currentStep ? 'step' : undefined}
                className={index < currentStep ? 'complete' : ''}
                key={step}
              >
                <span className="step-number">{index < currentStep ? '✓' : index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <main id="main">
        {error && (
          <div className="notice error" role="alert">
            {error}
          </div>
        )}
        {busy && !agent.readinessOperation && (
          <p className="operation-status" role="status">
            {agent.action.variables?.label}…
          </p>
        )}
        {content}
      </main>
      <footer className="app-footer">
        <span>{snapshot?.connection?.ownerName ?? 'PairDock sur ton Mac'}</span>
        {snapshot?.connection && <span className="server-address">{snapshot.connection.backendUrl}</span>}
      </footer>
    </div>
  );
}
