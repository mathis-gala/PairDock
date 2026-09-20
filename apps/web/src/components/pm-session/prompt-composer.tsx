import {
  MAX_AGENT_PROMPT_LENGTH,
  PREVIEW_SELECTION_LIMITS,
  type PreviewElementSelection,
} from '@pairdock/shared-contracts';
import { useForm } from '@tanstack/react-form';
import {
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  useState,
} from 'react';
import { buildPreviewSelectionPrompt } from '../../lib/preview-selection-prompt.js';
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
  onSelectionsChange: (selections: PreviewElementSelection[]) => void;
  selections: PreviewElementSelection[];
}

const defaultValues = { content: '' };

export function PromptComposer({
  blockedReason,
  canCancel,
  canSubmit,
  isCancelling,
  isSubmitting,
  onCancel,
  onSubmit,
  onSelectionsChange,
  selections,
}: PromptComposerProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<SelectedScreenshot[]>([]);
  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      if (!canSubmit || isSubmitting) {
        return;
      }

      if (!value.content.trim() && screenshots.length === 0 && selections.length === 0) {
        setErrorMessage('Ajoute un message, une capture ou un élément de la preview.');
        return;
      }

      setErrorMessage(null);
      const content = buildPreviewSelectionPrompt(value.content, selections);
      await onSubmit(
        content,
        screenshots.map((screenshot) => screenshot.file),
      );
      releaseScreenshotPreviews(screenshots);
      setScreenshots([]);
      onSelectionsChange([]);
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

  function handleRemoveSelection(event: MouseEvent<HTMLButtonElement>) {
    if (isSubmitting) {
      return;
    }
    const index = Number(event.currentTarget.dataset.selectionIndex);
    onSelectionsChange(selections.filter((_, selectionIndex) => selectionIndex !== index));
    setErrorMessage(null);
  }

  return (
    <div className="rounded-[13px] border border-white/10 bg-[#1c1f27] p-3">
      <form className="space-y-3" onSubmit={handleFormSubmit}>
        {selections.length > 0 ? (
          <fieldset className="min-w-0 space-y-2">
            <legend className="mb-2 text-xs font-medium text-[#a9efc9]">
              Éléments joints · {selections.length}/{PREVIEW_SELECTION_LIMITS.selections}
            </legend>
            <div className="max-h-40 space-y-2 overflow-y-auto">
              {selections.map((selection, index) => (
                <div
                  className="flex min-w-0 items-center gap-2 rounded-[9px] border border-[#5fdf9b]/20 bg-[#5fdf9b]/5 pl-3"
                  key={`${selection.url}:${selection.selector}`}
                >
                  <div className="min-w-0 flex-1 py-2">
                    <p className="truncate font-mono text-xs text-[#a9efc9]" title={selection.selector}>
                      {selection.selector}
                    </p>
                    <p className="mt-1 truncate text-xs text-[#cdd2dc]" title={selection.text || selection.tagName}>
                      {selection.text || `<${selection.tagName}>`}
                    </p>
                  </div>
                  <button
                    aria-label={`Retirer l’élément ${index + 1} : ${selection.selector}`}
                    className="flex size-11 flex-none items-center justify-center rounded-[8px] text-[#a3aab8] hover:bg-white/5 hover:text-[#eef0f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fdf9b]/60 disabled:cursor-not-allowed disabled:opacity-50"
                    data-selection-index={index}
                    disabled={isSubmitting}
                    onClick={handleRemoveSelection}
                    type="button"
                  >
                    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
                      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </fieldset>
        ) : null}
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
                  disabled={isSubmitting}
                  maxLength={MAX_AGENT_PROMPT_LENGTH}
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
