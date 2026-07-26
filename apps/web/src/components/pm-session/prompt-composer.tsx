import { useForm } from '@tanstack/react-form';
import { type ChangeEvent, type ClipboardEvent, type FormEvent, type KeyboardEvent, useState } from 'react';
import { Button } from '../button.js';
import {
  appendScreenshotFiles,
  getPastedImageFiles,
  releaseScreenshotPreviews,
  ScreenshotPicker,
  type SelectedScreenshot,
} from '../screenshot-picker.js';
import { TextArea } from '../text-area.js';

interface PromptComposerProps {
  blockedReason: string | null;
  canCancel: boolean;
  canSubmit: boolean;
  isCancelling: boolean;
  isSubmitting: boolean;
  onCancel: () => Promise<void>;
  onSubmit: (content: string, screenshots: File[]) => Promise<void>;
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
  const [screenshots, setScreenshots] = useState<SelectedScreenshot[]>([]);
  const form = useForm({
    defaultValues: {
      content: '',
    },
    onSubmit: async ({ value }) => {
      if (!canSubmit) {
        return;
      }

      if (!value.content.trim() && screenshots.length === 0) {
        setErrorMessage('Ajoute un message ou au moins une capture.');
        return;
      }

      setErrorMessage(null);
      await onSubmit(
        value.content,
        screenshots.map((screenshot) => screenshot.file),
      );
      releaseScreenshotPreviews(screenshots);
      setScreenshots([]);
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

  function handleScreenshotsChange(nextScreenshots: SelectedScreenshot[]) {
    setErrorMessage(null);
    setScreenshots(nextScreenshots);
  }

  function handleScreenshotError(message: string | null) {
    setErrorMessage(message);
  }

  function handleContentPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    if (isSubmitting) {
      return;
    }

    appendScreenshotFiles({
      files: getPastedImageFiles(event.clipboardData),
      onChange: handleScreenshotsChange,
      onError: handleScreenshotError,
      screenshots,
    });
  }

  return (
    <div className="rounded-[13px] border border-white/10 bg-[#1c1f27] p-3">
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
              <div className="space-y-2 text-sm text-[#cdd2dc]">
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
                  onPaste={handleContentPaste}
                  placeholder="Écris un message à l’agent…"
                  value={field.state.value}
                />
              </div>
            );
          }}
        </form.Field>
        <ScreenshotPicker
          disabled={isSubmitting}
          onChange={handleScreenshotsChange}
          onError={handleScreenshotError}
          screenshots={screenshots}
        />
        {blockedReason ? (
          <p aria-live="polite" className="text-xs leading-5 text-[#8b92a1]" id="pm-session-prompt-status">
            {blockedReason}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="text-sm text-rose-300" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[11px] text-[#565d6b]">⌘↵ pour envoyer</span>
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
