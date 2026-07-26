import type { UpdateDeveloperProjectInput } from '@pairdock/shared-contracts';
import { type ChangeEvent, type FormEvent, useId, useState } from 'react';
import { Button } from '../button.js';
import { TextArea } from '../text-area.js';
import { TextInput } from '../text-input.js';

interface ProjectMetadataFormProps {
  description: string | null;
  error: string | null;
  isSubmitting: boolean;
  name: string;
  onCancel: () => void;
  onSubmit: (input: UpdateDeveloperProjectInput) => Promise<void>;
}

interface ProjectMetadataValues {
  description: string | null;
  name: string;
}

export function buildProjectMetadataUpdate(
  initial: ProjectMetadataValues,
  current: ProjectMetadataValues,
): UpdateDeveloperProjectInput {
  const initialDescription = initial.description?.trim() || null;
  const currentDescription = current.description?.trim() || null;
  const initialName = initial.name.trim();
  const currentName = current.name.trim();

  return {
    ...(currentName !== initialName ? { name: currentName } : {}),
    ...(currentDescription !== initialDescription ? { description: currentDescription } : {}),
  };
}

export function ProjectMetadataForm({
  description: initialDescription,
  error,
  isSubmitting,
  name: initialName,
  onCancel,
  onSubmit,
}: ProjectMetadataFormProps) {
  const descriptionId = useId();
  const nameId = useId();
  const [description, setDescription] = useState(initialDescription ?? '');
  const [name, setName] = useState(initialName);
  const update = buildProjectMetadataUpdate(
    { name: initialName, description: initialDescription },
    { name, description },
  );
  const hasChanges = Object.keys(update).length > 0;

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
  }

  function handleDescriptionChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setDescription(event.target.value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasChanges) {
      return;
    }

    void onSubmit(update).catch(() => undefined);
  }

  return (
    <form
      className="mb-4 rounded-xl border border-white/10 bg-[#15181e] p-4"
      onSubmit={handleSubmit}
      aria-label="Modifier le projet"
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <label className="space-y-2 text-sm font-medium text-[#cdd2dc]" htmlFor={nameId}>
          Nom du projet
          <TextInput
            autoFocus
            disabled={isSubmitting}
            id={nameId}
            maxLength={120}
            onChange={handleNameChange}
            required
            value={name}
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-[#cdd2dc]" htmlFor={descriptionId}>
          Description
          <TextArea
            className="min-h-20"
            disabled={isSubmitting}
            id={descriptionId}
            maxLength={2_000}
            onChange={handleDescriptionChange}
            placeholder="Contexte utile pour les PM invités"
            value={description}
          />
        </label>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button disabled={isSubmitting} onClick={onCancel} variant="ghost">
          Annuler
        </Button>
        <Button disabled={isSubmitting || name.trim().length === 0 || !hasChanges} type="submit">
          {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}
