import type { DesktopProjectDraft } from '@pairdock/local-agent/desktop-contracts';
import { useForm } from '@tanstack/react-form';
import type { ChangeEvent, FormEvent } from 'react';
import type { DesktopBridge } from '../shared/bridge.js';
import type { DesktopActionRunner } from './use-desktop-agent.js';

interface ProjectFormProps {
  draft: DesktopProjectDraft;
  bridge: DesktopBridge;
  busy: boolean;
  run: DesktopActionRunner;
  onClose: () => void;
}

const scriptFields = [
  { name: 'previewCommand', label: 'Aperçu de l’application' },
  { name: 'buildCommand', label: 'Compilation' },
  { name: 'testCommand', label: 'Tests' },
  { name: 'lintCommand', label: 'Vérification du code' },
] as const;

const advancedFields = [
  { name: 'defaultBranch', label: 'Branche de base', hint: 'Les sessions partent de cette branche.' },
  {
    name: 'setupCommand',
    label: 'Installation des dépendances',
    hint: 'Commande exécutée dans chaque nouvel espace de session.',
  },
  {
    name: 'healthcheckUrl',
    label: 'Adresse de vérification de l’aperçu',
    hint: 'Adresse locale permettant de vérifier que l’application répond.',
  },
] as const;

export function ProjectForm({ draft, bridge, busy, run, onClose }: ProjectFormProps) {
  const defaultValues = draft;
  const needsAdvanced = !draft.healthcheckUrl || !draft.defaultBranch || draft.scripts.length === 0;
  const form = useForm({
    defaultValues,
    onSubmit: ({ value }) => {
      run('Enregistrement du projet', async () => {
        await bridge.saveProject({
          ...draft,
          name: value.name.trim(),
          repoFullName: value.repoFullName.trim(),
          defaultBranch: value.defaultBranch.trim(),
          runtime: value.runtime,
          setupCommand: value.setupCommand.trim(),
          previewCommand: value.previewCommand.trim(),
          buildCommand: value.buildCommand.trim(),
          testCommand: value.testCommand.trim(),
          lintCommand: value.lintCommand.trim(),
          healthcheckUrl: value.healthcheckUrl.trim(),
        });
        onClose();
      });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void form.handleSubmit();
  }

  return (
    <section className="setup-content wide" aria-labelledby="project-title">
      <p className="eyebrow">Projet local</p>
      <h1 id="project-title">Configurer {draft.name}</h1>
      <p className="intro">
        Les réglages sont préremplis depuis ton dépôt. Choisis les scripts que l’agent utilisera pour préparer et
        vérifier les sessions.
      </p>
      <p className="folder-path">{draft.path}</p>
      <p className="hint project-tools-hint">
        Les outils du projet doivent être installés sur ce Mac. La vérification du projet signalera ceux qui manquent.
      </p>
      {draft.warnings.length > 0 && (
        <div className="notice warning">
          <ul>
            {draft.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      <form className="form-stack" onSubmit={handleSubmit}>
        <form.Field name="name">
          {(field) => {
            function handleChange(event: ChangeEvent<HTMLInputElement>) {
              field.handleChange(event.target.value);
            }
            return (
              <label className="field" htmlFor="project-name">
                <span>Nom du projet</span>
                <input disabled={busy} id="project-name" onChange={handleChange} required value={field.state.value} />
              </label>
            );
          }}
        </form.Field>
        <div className="form-grid">
          {scriptFields.map((definition) => (
            <form.Field key={definition.name} name={definition.name}>
              {(field) => (
                <ScriptSelect
                  busy={busy}
                  draft={draft}
                  label={definition.label}
                  name={definition.name}
                  onChange={field.handleChange}
                  value={field.state.value}
                />
              )}
            </form.Field>
          ))}
        </div>
        <p className="hint">
          {draft.healthcheckUrl.includes('{{hostPort}}')
            ? 'Un port disponible est attribué automatiquement à chaque session.'
            : 'L’adresse et le port de l’aperçu se règlent dans les paramètres avancés.'}
        </p>
        <details className="advanced-settings" open={needsAdvanced}>
          <summary>Réglages avancés</summary>
          <div className="form-stack">
            <p className="hint">
              {draft.runtime === 'docker'
                ? 'Aperçu dans Docker, selon la configuration du dépôt.'
                : 'Aperçu exécuté sur ce Mac, dans un dossier propre à chaque session.'}
            </p>
            {advancedFields.map((definition) => (
              <form.Field key={definition.name} name={definition.name}>
                {(field) => {
                  function handleChange(event: ChangeEvent<HTMLInputElement>) {
                    field.handleChange(event.target.value);
                  }
                  return (
                    <label className="field" htmlFor={definition.name}>
                      <span>{definition.label}</span>
                      <input
                        disabled={busy}
                        id={definition.name}
                        onChange={handleChange}
                        required={definition.name !== 'setupCommand'}
                        spellCheck={false}
                        value={field.state.value}
                      />
                      <span className="hint">{definition.hint}</span>
                    </label>
                  );
                }}
              </form.Field>
            ))}
            <p className="hint">Pour un monorepo ou un script particulier, ajuste les commandes ci-dessous.</p>
            {scriptFields.map((definition) => (
              <form.Field key={definition.name} name={definition.name}>
                {(field) => {
                  function handleChange(event: ChangeEvent<HTMLInputElement>) {
                    field.handleChange(event.target.value);
                  }
                  const id = `custom-${definition.name}`;
                  return (
                    <label className="field" htmlFor={id}>
                      <span>Commande : {definition.label.toLowerCase()}</span>
                      <input
                        disabled={busy}
                        id={id}
                        onChange={handleChange}
                        spellCheck={false}
                        value={field.state.value}
                      />
                    </label>
                  );
                }}
              </form.Field>
            ))}
          </div>
        </details>
        <p className="hint">L’enregistrement conserve ces réglages sur ce Mac pour les prochaines sessions.</p>
        <div className="actions">
          <button className="primary" disabled={busy} type="submit">
            {busy ? 'Enregistrement…' : 'Enregistrer le projet'}
          </button>
          <button className="quiet" disabled={busy} onClick={onClose} type="button">
            Annuler
          </button>
        </div>
      </form>
    </section>
  );
}

interface ScriptSelectProps {
  draft: DesktopProjectDraft;
  name: string;
  label: string;
  value: string;
  busy: boolean;
  onChange: (value: string) => void;
}

function ScriptSelect({ draft, name, label, value, busy, onChange }: ScriptSelectProps) {
  const isCustom = Boolean(value) && !draft.scripts.some((script) => script.command === value);
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange(event.target.value);
  }
  return (
    <label className="field" htmlFor={name}>
      <span>{label}</span>
      <select disabled={busy} id={name} onChange={handleChange} required value={value}>
        <option value="">Choisir un script</option>
        {draft.scripts.map((script) => (
          <option key={script.name} value={script.command}>
            {script.name}
          </option>
        ))}
        {isCustom && <option value={value}>Commande personnalisée</option>}
      </select>
      {draft.scripts.length === 0 && (
        <span className="hint">Aucun script détecté. Renseigne une commande dans les réglages avancés.</span>
      )}
    </label>
  );
}
