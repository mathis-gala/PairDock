import type { DesktopAgentSnapshot } from '@pairdock/local-agent/desktop-contracts';
import { useForm } from '@tanstack/react-form';
import type { ChangeEvent, FormEvent } from 'react';
import type { DesktopBridge } from '../shared/bridge.js';
import type { DesktopActionRunner } from './use-desktop-agent.js';

interface ConnectStepProps {
  bridge: DesktopBridge;
  snapshot: DesktopAgentSnapshot;
  deviceName: string;
  backendUrl?: string;
  onCancel?: () => void;
  busy: boolean;
  run: DesktopActionRunner;
}

export function ConnectStep({ bridge, snapshot, deviceName, backendUrl = '', busy, run, onCancel }: ConnectStepProps) {
  const defaultValues = { backendUrl, deviceName };
  const form = useForm({
    defaultValues,
    onSubmit: ({ value }) => {
      run('Connexion à PairDock', async () => {
        await bridge.beginPairing(value);
        await bridge.openPairing();
      });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void form.handleSubmit();
  }

  function handleOpenBrowser() {
    run('Ouverture du navigateur', () => bridge.openPairing());
  }

  function handleCancel() {
    run('Annulation de la connexion', async () => {
      await bridge.cancelPairing();
      onCancel?.();
    });
  }

  if (snapshot.pairing) {
    const expiresAt = new Date(snapshot.pairing.expiresAt).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return (
      <section className="setup-content" aria-labelledby="connect-title">
        <p className="eyebrow">Connexion sécurisée</p>
        <h1 id="connect-title">Autorise ce Mac dans ton navigateur.</h1>
        <p className="intro">Connecte-toi à PairDock, puis vérifie que ce code correspond avant de confirmer.</p>
        <output className="pairing-code" aria-label="Code de vérification">
          {snapshot.pairing.userCode}
        </output>
        <p className="waiting" role="status">
          <span className="status-dot pending" />
          En attente de ton autorisation
        </p>
        <p className="hint">Ce code expire à {expiresAt}. L’application continue automatiquement après confirmation.</p>
        <div className="actions">
          <button className="primary" disabled={busy} onClick={handleOpenBrowser} type="button">
            Ouvrir le navigateur
          </button>
          <button className="quiet" disabled={busy} onClick={handleCancel} type="button">
            Revenir
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="setup-content" aria-labelledby="connect-title">
      <p className="eyebrow">Ton espace, sur ce Mac</p>
      <h1 id="connect-title">Connecter l’agent local</h1>
      <p className="intro">
        L’agent exécute les sessions de tes projets sur cette machine. Relie-le à ton compte PairDock pour commencer.
      </p>
      <form className="form-stack" onSubmit={handleSubmit}>
        <form.Field name="backendUrl">
          {(field) => {
            function handleChange(event: ChangeEvent<HTMLInputElement>) {
              field.handleChange(event.target.value);
            }
            return (
              <label className="field" htmlFor="backend-url">
                <span>Adresse du serveur PairDock</span>
                <input
                  autoCapitalize="none"
                  autoComplete="url"
                  disabled={busy}
                  id="backend-url"
                  onBlur={field.handleBlur}
                  onChange={handleChange}
                  placeholder="https://pairdock.example.com"
                  required
                  spellCheck={false}
                  type="url"
                  value={field.state.value}
                />
                <span className="hint">Utilise l’adresse du serveur fournie par ton équipe.</span>
              </label>
            );
          }}
        </form.Field>
        <form.Field name="deviceName">
          {(field) => {
            function handleChange(event: ChangeEvent<HTMLInputElement>) {
              field.handleChange(event.target.value);
            }
            return (
              <label className="field" htmlFor="device-name">
                <span>Nom de cette machine</span>
                <input
                  autoComplete="off"
                  disabled={busy}
                  id="device-name"
                  maxLength={100}
                  onBlur={field.handleBlur}
                  onChange={handleChange}
                  required
                  value={field.state.value}
                />
                <span className="hint">Pour reconnaître cet agent dans PairDock.</span>
              </label>
            );
          }}
        </form.Field>
        <div className="actions">
          <button className="primary" disabled={busy} type="submit">
            {busy ? 'Connexion…' : 'Continuer dans le navigateur'}
            <span aria-hidden="true">↗</span>
          </button>
          {onCancel && (
            <button className="quiet" disabled={busy} onClick={onCancel} type="button">
              Annuler
            </button>
          )}
        </div>
      </form>
      <p className="footnote">Tes dépôts restent sur ton Mac. Tu choisis les projets accessibles à l’agent.</p>
    </section>
  );
}
