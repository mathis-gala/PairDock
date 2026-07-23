import { useForm } from '@tanstack/react-form';
import { type ChangeEvent, type FormEvent, type KeyboardEvent, useState } from 'react';
import { Button } from '../button.js';
import { TextArea } from '../text-area.js';

interface PromptComposerProps {
  blockedReason: string | null;
  canCancel: boolean;
  canSubmit: boolean;
  isCancelling: boolean;
  isSubmitting: boolean;
  onCancel: () => Promise<void>;
  onSubmit: (content: string) => Promise<void>;
}

export function PromptComposer({
  blockedReason,
  canCancel,
  canSubmit,
  isCancelling,
  isSubmitting,
  onCancel,
  onSubmit,
}: PromptComposerProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useForm({
    defaultValues: {
      content: '',
    },
    onSubmit: async ({ value }) => {
      if (!canSubmit) {
        return;
      }

      setErrorMessage(null);
      await onSubmit(value.content);
      form.reset();
    },
  });

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void form.handleSubmit().catch((error: Error) => setErrorMessage(error.message));
  }

  function handleCancel() {
    void onCancel().catch((error: Error) => setErrorMessage(error.message));
  }

  return (
    <div className="rounded-[13px] border border-black/10 bg-[#ffffff] p-3">
      <form className="space-y-3" onSubmit={handleFormSubmit}>
        <form.Field name="content">
          {(field) => {
            const inputId = 'pm-session-prompt';

            function handleContentChange(event: ChangeEvent<HTMLTextAreaElement>) {
              setErrorMessage(null);
              field.handleChange(event.target.value);
            }

            function handleContentKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                void form.handleSubmit().catch((error: Error) => setErrorMessage(error.message));
              }
            }

            return (
              <div className="space-y-2 text-sm text-[#46505f]">
                <label className="sr-only" htmlFor={inputId}>
                  Prompt
                </label>
                <TextArea
                  className="min-h-[72px] resize-none border-transparent bg-transparent px-0 py-0 focus:border-transparent"
                  aria-describedby={blockedReason ? 'pm-session-prompt-status' : undefined}
                  id={inputId}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={handleContentChange}
                  onKeyDown={handleContentKeyDown}
                  placeholder="Écris un message à l’agent…"
                  value={field.state.value}
                />
              </div>
            );
          }}
        </form.Field>
        {blockedReason ? (
          <p aria-live="polite" className="text-xs leading-5 text-[#5e6878]" id="pm-session-prompt-status">
            {blockedReason}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="text-sm text-[#b4233b]" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[11px] text-[#7a8494]">⌘↵ pour envoyer</span>
          <Button
            className="min-h-[34px] px-3.5 py-1.5"
            disabled={!canCancel || isCancelling}
            onClick={handleCancel}
            type="button"
            variant="secondary"
          >
            {isCancelling ? 'Arrêt…' : 'Arrêter'}
          </Button>
          <Button className="min-h-[34px] px-4 py-1.5" disabled={!canSubmit || isSubmitting} type="submit">
            {isSubmitting ? 'Envoi…' : 'Envoyer'}
          </Button>
        </div>
      </form>
    </div>
  );
}
