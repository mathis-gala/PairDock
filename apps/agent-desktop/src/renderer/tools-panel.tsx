import type { DesktopTools } from '@pairdock/local-agent/desktop-contracts';
import type { DesktopBridge } from '../shared/bridge.js';
import type { DesktopActionRunner } from './use-desktop-agent.js';

interface ToolsPanelProps {
  tools: DesktopTools | null;
  dockerRequired: boolean;
  modelsAvailable: boolean;
  bridge: DesktopBridge;
  busy: boolean;
  run: DesktopActionRunner;
}

export function ToolsPanel({ tools, dockerRequired, modelsAvailable, bridge, busy, run }: ToolsPanelProps) {
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

  let codexLabel = 'Non détecté';
  if (tools?.codex.authenticated) codexLabel = 'Connecté';
  else if (tools?.codex.available) codexLabel = 'Connexion nécessaire';
  if (tools?.codex.authenticated && !modelsAvailable) codexLabel = 'Modèles indisponibles';

  return (
    <section className="tools-section" aria-labelledby="tools-title">
      <div className="section-heading">
        <h2 id="tools-title">Outils de cette machine</h2>
        <button className="text-button" disabled={busy} onClick={handleRefresh} type="button">
          Vérifier à nouveau
        </button>
      </div>
      <ul className="tool-list">
        <li>
          <span className={`check-icon ${tools?.git.available ? 'passed' : ''}`} aria-hidden="true">
            {tools?.git.available ? '✓' : '·'}
          </span>
          <div className="tool-copy">
            <strong>Git</strong>
            <span>Accès aux dépôts et aux branches</span>
          </div>
          <span className="tool-state">{tools?.git.available ? 'Disponible' : 'Non détecté'}</span>
          {!tools?.git.available && (
            <button className="secondary compact" disabled={busy} onClick={handleGitHelp} type="button">
              Installer Git
            </button>
          )}
        </li>
        <li>
          <span className={`check-icon ${tools?.codex.authenticated ? 'passed' : ''}`} aria-hidden="true">
            {tools?.codex.authenticated ? '✓' : '·'}
          </span>
          <div className="tool-copy">
            <strong>Codex</strong>
            <span>L’agent qui réalise les modifications</span>
          </div>
          <span className="tool-state">{codexLabel}</span>
          {tools?.codex.available && !tools.codex.authenticated && (
            <button className="secondary compact" disabled={busy} onClick={handleCodexLogin} type="button">
              Connecter Codex
            </button>
          )}
          {!tools?.codex.available && (
            <button className="secondary compact" disabled={busy} onClick={handleCodexHelp} type="button">
              Configurer Codex
            </button>
          )}
        </li>
        <li>
          <span className={`check-icon ${tools?.docker.available ? 'passed' : ''}`} aria-hidden="true">
            {tools?.docker.available ? '✓' : '·'}
          </span>
          <div className="tool-copy">
            <strong>Docker</strong>
            <span>
              {dockerRequired
                ? 'Requis pour partager les aperçus des sessions'
                : 'Facultatif pour les projets sur ce Mac'}
            </span>
          </div>
          <span className="tool-state">{tools?.docker.available ? 'Disponible' : 'Inactif'}</span>
          {!tools?.docker.available && (
            <div className="inline-actions">
              <button className="secondary compact" disabled={busy} onClick={handleDockerOpen} type="button">
                Ouvrir
              </button>
              <button className="text-button" disabled={busy} onClick={handleDockerHelp} type="button">
                Installer
              </button>
            </div>
          )}
        </li>
      </ul>
      {tools?.codex.authenticated && !modelsAvailable && (
        <p className="notice warning" role="alert">
          {tools.codex.message}
        </p>
      )}
      <p className="hint">Après une installation ou une connexion, vérifie à nouveau les outils.</p>
    </section>
  );
}
