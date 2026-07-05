import type { CreateDeveloperProjectInput } from '@pairdock/shared-contracts';
import { useForm } from '@tanstack/react-form';
import { Button } from '../button.js';
import { SectionCard } from '../section-card.js';
import { TextArea } from '../text-area.js';
import { TextInput } from '../text-input.js';

interface DeveloperProjectFormProps {
  developerSeed: string;
  isSubmitting: boolean;
  onSubmit: (input: CreateDeveloperProjectInput) => Promise<void>;
}

type ProjectTextFieldName = 'name' | 'repoFullName' | 'defaultBranch' | 'defaultModelId' | 'agentProjectKey';

export function DeveloperProjectForm({ developerSeed, isSubmitting, onSubmit }: DeveloperProjectFormProps) {
  const normalizedSeed = developerSeed.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const form = useForm({
    defaultValues: {
      name: 'PairDock local project',
      description: 'Local project controlled by the developer dashboard.',
      repoFullName: `mathis/${normalizedSeed || 'pairdock-local'}`,
      defaultBranch: 'main',
      defaultModelId: 'codex-cli/gpt-5.4',
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

  return (
    <SectionCard
      eyebrow="Project creation"
      title="Create a developer-controlled project"
      description="Register the repository, owning local-agent project key, and default model used when sessions start."
    >
      <form
        className="grid gap-4 lg:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        {renderTextField('name', 'Project name')}
        {renderTextField('repoFullName', 'Repository')}
        {renderTextField('defaultBranch', 'Default branch')}
        {renderTextField('defaultModelId', 'Default model')}
        {renderTextField('agentProjectKey', 'Agent project key')}
        <form.Field name="pmCanStartSessions">
          {(field) => (
            <label className="flex items-center gap-2 self-end rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300">
              <input
                checked={field.state.value}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.checked)}
                type="checkbox"
              />
              Allow PM-started sessions
            </label>
          )}
        </form.Field>
        <form.Field name="description">
          {(field) => (
            <label className="space-y-2 text-sm text-slate-300 lg:col-span-2" htmlFor="developer-project-description">
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
        <div className="lg:col-span-2">
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Creating…' : 'Create project'}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
