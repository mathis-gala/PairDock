import type { CreateDeveloperProjectInput } from '@pairdock/shared-contracts';
import { useForm } from '@tanstack/react-form';
import { Button } from '../button.js';
import { SectionCard } from '../section-card.js';
import { SelectInput } from '../select-input.js';
import { TextArea } from '../text-area.js';
import { TextInput } from '../text-input.js';

interface DeveloperProjectFormProps {
  developerSeed: string;
  isSubmitting: boolean;
  onSubmit: (input: CreateDeveloperProjectInput) => Promise<void>;
}

type ProjectTextFieldName = 'name' | 'repoFullName' | 'defaultBranch' | 'defaultModelId' | 'agentProjectKey';

const branchOptions = ['main', 'develop', 'dev', 'staging', 'master'];
const modelOptions = ['codex-cli/gpt-5.4', 'codex-cli/gpt-5.4-mini', 'codex-cli/gpt-5.5'];

export function DeveloperProjectForm({ developerSeed, isSubmitting, onSubmit }: DeveloperProjectFormProps) {
  const normalizedSeed = developerSeed.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const form = useForm({
    defaultValues: {
      name: 'PairDock local project',
      description: 'Local project controlled by the developer dashboard.',
      repoFullName: `mathis/${normalizedSeed || 'pairdock-local'}`,
      defaultBranch: 'main',
      defaultModelId: 'codex-cli/gpt-5.4-mini',
      agentProjectKey: `local-${normalizedSeed || 'developer'}`,
      pmCanStartSessions: true,
    },
    onSubmit: async ({ value }) => {
      await onSubmit({
        name: value.name,
        description: value.description,
        repoFullName: value.repoFullName,
        defaultBranch: value.defaultBranch,
        defaultModelId: value.defaultModelId,
        agentProjectKey: value.agentProjectKey,
        pmCanStartSessions: value.pmCanStartSessions,
      });
      form.reset();
    },
  });

  function renderTextField(name: ProjectTextFieldName, label: string) {
    const inputId = `developer-project-${name}`;

    return (
      <form.Field name={name}>
        {(field) => (
          <label className="space-y-2 text-sm text-slate-300" htmlFor={inputId}>
            <span className="block">{label}</span>
            <TextInput
              id={inputId}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              required
              value={field.state.value}
            />
          </label>
        )}
      </form.Field>
    );
  }

  function renderSelectField(name: ProjectTextFieldName, label: string, options: string[]) {
    const inputId = `developer-project-${name}`;

    return (
      <form.Field name={name}>
        {(field) => (
          <label className="space-y-2 text-sm text-slate-300" htmlFor={inputId}>
            <span className="block">{label}</span>
            <SelectInput
              id={inputId}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              required
              value={field.state.value}
            >
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectInput>
          </label>
        )}
      </form.Field>
    );
  }

  return (
    <SectionCard
      eyebrow="Project creation"
      title="Configurer une instance"
      description="Sélectionne le dépôt GitHub autorisé, la branche de base, le modèle et l'agent local qui exécutera les sessions."
    >
      <form
        className="grid gap-4 lg:grid-cols-[1.25fr_0.85fr_0.85fr]"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        {renderTextField('name', 'Nom du projet')}
        {renderTextField('repoFullName', 'Dépôt GitHub')}
        {renderSelectField('defaultBranch', 'Branche de base', branchOptions)}
        {renderSelectField('defaultModelId', 'Modèle par défaut', modelOptions)}
        {renderTextField('agentProjectKey', 'Clé agent local')}
        <form.Field name="pmCanStartSessions">
          {(field) => (
            <label className="flex min-h-10 items-center gap-2 self-end rounded-[9px] border border-white/10 bg-[#1f232b] px-3 py-2 text-sm text-slate-300">
              <input
                checked={field.state.value}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.checked)}
                type="checkbox"
              />
              Sessions PM autorisées
            </label>
          )}
        </form.Field>
        <form.Field name="description">
          {(field) => (
            <label className="space-y-2 text-sm text-slate-300 lg:col-span-3" htmlFor="developer-project-description">
              <span className="block">Description</span>
              <TextArea
                id="developer-project-description"
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                value={field.state.value}
              />
            </label>
          )}
        </form.Field>
        <div className="flex flex-wrap items-center gap-3 lg:col-span-3">
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Création...' : 'Créer le projet'}
          </Button>
          <p className="font-mono text-[11.5px] text-[#6f7686]">
            GitHub App fournit installation/account automatiquement.
          </p>
        </div>
      </form>
    </SectionCard>
  );
}
