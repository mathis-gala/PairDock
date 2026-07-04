import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import { Button } from '../button.js';
import { SectionCard } from '../section-card.js';
import { TextArea } from '../text-area.js';

interface PromptComposerProps {
  canCancel: boolean;
  isCancelling: boolean;
  isSubmitting: boolean;
  onCancel: () => Promise<void>;
  onSubmit: (content: string) => Promise<void>;
}

export function PromptComposer({ canCancel, isCancelling, isSubmitting, onCancel, onSubmit }: PromptComposerProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useForm({
    defaultValues: {
      content: '',
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null);
      await onSubmit(value.content);
      form.reset();
    },
  });

  return (
    <SectionCard
      title="Prompt composer"
      description="PM prompts append to the persisted prompt history and route to the session agent command bridge."
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit().catch((error: Error) => setErrorMessage(error.message));
        }}
      >
        <form.Field name="content">
          {(field) => {
            const inputId = 'pm-session-prompt';

            return (
              <div className="space-y-2 text-sm text-slate-300">
                <label className="block" htmlFor={inputId}>
                  Prompt
                </label>
                <TextArea
                  id={inputId}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Describe what the PM wants changed in this session."
                  value={field.state.value}
                />
              </div>
            );
          }}
        </form.Field>
        {errorMessage ? <p className="text-sm text-rose-300">{errorMessage}</p> : null}
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            disabled={!canCancel || isCancelling}
            onClick={() => {
              void onCancel().catch((error: Error) => setErrorMessage(error.message));
            }}
            variant="secondary"
          >
            {isCancelling ? 'Cancelling…' : 'Cancel current agent run'}
          </Button>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Sending prompt…' : 'Send prompt'}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
