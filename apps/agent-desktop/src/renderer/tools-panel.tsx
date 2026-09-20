import type { DesktopTools } from '@pairdock/local-agent/desktop-contracts';
import type { ReactNode } from 'react';
import type { DesktopBridge } from '../shared/bridge.js';
import type { DesktopActionRunner } from './use-desktop-agent.js';

interface ToolsPanelProps {
  tools: DesktopTools | null;
  dockerRequired: boolean;
  modelsAvailable: boolean;
  bridge: DesktopBridge;
  busy: boolean;
  configurationDisabled: boolean;
  run: DesktopActionRunner;
}

export function ToolsPanel({
  tools,
  dockerRequired,
  modelsAvailable,
  bridge,
  busy,
  configurationDisabled,
  run,
}: ToolsPanelProps) {
  function handleRefresh() {
    run('Vérification des outils', () => bridge.checkTools());
  }
  function handleGitHelp() {
    run('Ouverture de l’installation de Git', () => bridge.openToolHelp('git'));
  }
  function handleDockerHelp() {
    run('Ouverture de l’installation de Docker', () => bridge.openToolHelp('docker'));
  }
  function handleDockerOpen() {
    run('Ouverture de Docker', () => bridge.openDocker());
  }
  function handleCodexHelp() {
    run('Ouverture de l’aide Codex', () => bridge.openToolHelp('codex'));
  }
  function handleCodexLogin() {
    run('Termine la connexion Codex dans ton navigateur', () => bridge.loginCodex());
  }

  if (!tools) {
    return (
      <section className="tools-section" aria-busy="true">
        <h2>Outils de cette machine</h2>
        <p className="hint">Vérification de Git, Codex et Docker…</p>
      </section>
    );
  }

  const codexReady = tools.codex.available && tools.codex.authenticated && modelsAvailable;
  const dockerReady = tools.docker.available || !dockerRequired;
  let codexLabel = 'Non détecté';
  if (tools.codex.authenticated) codexLabel = 'Connecté';
  else if (tools.codex.available) codexLabel = 'Connexion nécessaire';
  if (tools.codex.authenticated && !modelsAvailable) codexLabel = 'Modèles indisponibles';
  let dockerLabel = 'À démarrer';
  if (tools.docker.available) dockerLabel = 'Disponible';
  else if (!dockerRequired) dockerLabel = 'Non requis';

  const gitRow = (
    <ToolRow
      key="git"
      name="Git"
      ready={tools.git.available}
      description="Accès aux dépôts et aux branches"
      status={tools.git.available ? 'Disponible' : 'Non détecté'}
    >
      {!tools.git.available && (
        <button className="secondary compact" disabled={busy} onClick={handleGitHelp} type="button">
          Installer Git
        </button>
      )}
    </ToolRow>
  );
  const codexRow = (
    <ToolRow
      key="codex"
      name="Codex"
      ready={codexReady}
      description="Réalisation des modifications"
      status={codexLabel}
    >
      {tools.codex.available && !tools.codex.authenticated && (
        <button className="secondary compact" disabled={configurationDisabled} onClick={handleCodexLogin} type="button">
          Connecter Codex
        </button>
      )}
      {!tools.codex.available && (
        <button className="secondary compact" disabled={busy} onClick={handleCodexHelp} type="button">
          Aide Codex
        </button>
      )}
    </ToolRow>
  );
  const dockerRow = (
    <ToolRow
      key="docker"
      name="Docker"
      ready={dockerReady}
      description={dockerRequired ? 'Partage des aperçus des sessions' : 'Facultatif pour ces projets'}
      status={dockerLabel}
    >
      {!dockerReady && (
        <div className="inline-actions">
          <button className="secondary compact" disabled={busy} onClick={handleDockerOpen} type="button">
            Ouvrir Docker
          </button>
          <button className="text-button" disabled={busy} onClick={handleDockerHelp} type="button">
            Installer
          </button>
        </div>
      )}
    </ToolRow>
  );
  const attentionRows: ReactNode[] = [];
  const readyRows: ReactNode[] = [];
  if (tools.git.available) readyRows.push(gitRow);
  else attentionRows.push(gitRow);
  if (codexReady) readyRows.push(codexRow);
  else attentionRows.push(codexRow);
  if (dockerReady) readyRows.push(dockerRow);
  else attentionRows.push(dockerRow);

  return (
    <section className="tools-section" aria-label="Outils de cette machine">
      {attentionRows.length > 0 && (
        <div className="tools-attention">
          <div className="section-heading">
            <h2>Outils à préparer</h2>
            <button className="text-button" disabled={busy} onClick={handleRefresh} type="button">
              Vérifier à nouveau
            </button>
          </div>
          <ul className="tool-list">{attentionRows}</ul>
          {tools.codex.authenticated && !modelsAvailable && (
            <p className="notice warning" role="alert">
              {tools.codex.message}
            </p>
          )}
          {tools.codex.available && !tools.codex.authenticated && configurationDisabled && !busy && (
            <p className="hint">Arrête l’agent avant de connecter Codex.</p>
          )}
          <p className="hint">Après une installation ou une connexion, vérifie à nouveau les outils.</p>
        </div>
      )}
      {readyRows.length > 0 && (
        <details className="tools-disclosure">
          <summary>
            <span>{attentionRows.length === 0 ? 'Outils prêts' : 'Autres outils'}</span>
          </summary>
          <ul className="tool-list">{readyRows}</ul>
          <button className="text-button" disabled={busy} onClick={handleRefresh} type="button">
            Vérifier les outils
          </button>
        </details>
      )}
    </section>
  );
}

interface ToolRowProps {
  name: string;
  description: string;
  status: string;
  ready: boolean;
  children?: ReactNode;
}

function ToolRow({ name, description, status, ready, children }: ToolRowProps) {
  return (
    <li>
      <span className={`check-icon ${ready ? 'passed' : ''}`} aria-hidden="true">
        {ready ? '✓' : '·'}
      </span>
      <div className="tool-copy">
        <strong>{name}</strong>
        <span>{description}</span>
      </div>
      <span className="tool-state">{status}</span>
      {children}
    </li>
  );
}
