import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import { Button } from '../button.js';
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
    <div className="rounded-[13px] border border-white/10 bg-[#1c1f27] p-3">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit().catch((error: Error) => setErrorMessage(error.message));
        }}
      >
        <form.Field name="content">
          {(field) => {
            const inputId = 'pm-session-prompt';

            return (
              <div className="space-y-2 text-sm text-[#cdd2dc]">
                <label className="sr-only" htmlFor={inputId}>
                  Prompt
                </label>
                <TextArea
                  className="min-h-[72px] resize-none border-transparent bg-transparent px-0 py-0 focus:border-transparent"
                  id={inputId}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Décris le correctif..."
                  value={field.state.value}
                />
              </div>
            );
          }}
        </form.Field>
        {errorMessage ? <p className="text-sm text-rose-300">{errorMessage}</p> : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[11px] text-[#565d6b]">⌘↵ pour envoyer</span>
          <Button
            className="min-h-[34px] px-3.5 py-1.5"
            disabled={!canCancel || isCancelling}
            onClick={() => {
              void onCancel().catch((error: Error) => setErrorMessage(error.message));
            }}
            variant="secondary"
          >
            {isCancelling ? 'Cancelling…' : 'Cancel current agent run'}
          </Button>
          <Button className="min-h-[34px] px-4 py-1.5" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Envoi…' : 'Envoyer'}
          </Button>
        </div>
      </form>
    </div>
  );
}
