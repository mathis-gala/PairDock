import type { CreateDraftReviewRequestInput } from '@pairdock/shared-contracts';
import { type ChangeEvent, type FormEvent, type KeyboardEvent, useCallback, useId, useState } from 'react';
import { Button } from '../button.js';

interface ReviewRequestDialogProps {
  error: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: CreateDraftReviewRequestInput) => void;
}

export function ReviewRequestDialog({ error, isSubmitting, onClose, onSubmit }: ReviewRequestDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const [type, setType] = useState<CreateDraftReviewRequestInput['type']>('feat');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const displayedError = validationError ?? error;

  function handleTypeChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.value === 'feat' || event.target.value === 'fix' || event.target.value === 'style') {
      setType(event.target.value);
    }
  }

  function handleTitleChange(event: ChangeEvent<HTMLInputElement>) {
    setTitle(event.target.value);
    setValidationError(null);
  }

  function handleDescriptionChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setDescription(event.target.value);
    setValidationError(null);
  }

  function handleClose() {
    if (!isSubmitting) {
      onClose();
    }
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      handleClose();
      return;
    }

    if (event.key === 'Tab') {
      const focusableElements = event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      const firstElement = focusableElements.item(0);
      const lastElement = focusableElements.item(focusableElements.length - 1);

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  }

  const handleInitialFocus = useCallback((element: HTMLInputElement | null) => {
    element?.focus();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();

    if (!normalizedTitle || !normalizedDescription) {
      setValidationError('Le titre et la description sont obligatoires.');
      return;
    }

    setValidationError(null);
    onSubmit({ type, title: normalizedTitle, description: normalizedDescription });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-8">
      <button
        aria-label="Fermer la modale"
        className="absolute inset-0 size-full cursor-pointer bg-slate-950/75"
        disabled={isSubmitting}
        onClick={handleClose}
        type="button"
      />
      <div
        aria-describedby={displayedError ? errorId : undefined}
        aria-labelledby={`${titleId}-heading`}
        aria-modal="true"
        className="relative w-full max-w-lg rounded-[16px] border border-white/10 bg-[#191c23] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-6"
        onKeyDown={handleDialogKeyDown}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-['Space_Grotesk'] text-lg font-semibold text-[#eef0f4]" id={`${titleId}-heading`}>
              Soumettre une draft PR
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#8b92a1]">
              Ces informations seront visibles par le développeur sur GitHub.
            </p>
          </div>
          <button
            aria-label="Fermer"
            className="flex size-11 flex-none cursor-pointer items-center justify-center rounded-[10px] text-[#8b92a1] transition hover:bg-white/5 hover:text-[#eef0f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fdf9b]/40 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
            onClick={handleClose}
            type="button"
          >
            <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
              <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
            </svg>
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#6f7686]">
              Type de changement
            </legend>
            <div className="grid grid-cols-3 gap-2">
              <label className="cursor-pointer">
                <input
                  checked={type === 'feat'}
                  className="peer sr-only"
                  name="review-request-type"
                  onChange={handleTypeChange}
                  type="radio"
                  value="feat"
                />
                <span className="flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-white/10 bg-[#15171c] px-3 text-sm text-[#8b92a1] transition peer-checked:border-[#5fdf9b]/50 peer-checked:bg-[#5fdf9b]/10 peer-checked:text-[#eafff3] peer-focus-visible:ring-2 peer-focus-visible:ring-[#5fdf9b]/40">
                  Feature
                </span>
              </label>
              <label className="cursor-pointer">
                <input
                  checked={type === 'fix'}
                  className="peer sr-only"
                  name="review-request-type"
                  onChange={handleTypeChange}
                  type="radio"
                  value="fix"
                />
                <span className="flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-white/10 bg-[#15171c] px-3 text-sm text-[#8b92a1] transition peer-checked:border-[#5fdf9b]/50 peer-checked:bg-[#5fdf9b]/10 peer-checked:text-[#eafff3] peer-focus-visible:ring-2 peer-focus-visible:ring-[#5fdf9b]/40">
                  Fix
                </span>
              </label>
              <label className="cursor-pointer">
                <input
                  checked={type === 'style'}
                  className="peer sr-only"
                  name="review-request-type"
                  onChange={handleTypeChange}
                  type="radio"
                  value="style"
                />
                <span className="flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-white/10 bg-[#15171c] px-3 text-sm text-[#8b92a1] transition peer-checked:border-[#5fdf9b]/50 peer-checked:bg-[#5fdf9b]/10 peer-checked:text-[#eafff3] peer-focus-visible:ring-2 peer-focus-visible:ring-[#5fdf9b]/40">
                  Style
                </span>
              </label>
            </div>
          </fieldset>

          <label className="block" htmlFor={titleId}>
            <span className="mb-2 block text-sm font-medium text-[#cdd2dc]">Titre de la PR</span>
            <input
              className="min-h-11 w-full rounded-[10px] border border-white/10 bg-[#15171c] px-3 text-sm text-[#eef0f4] outline-none transition placeholder:text-[#565d6b] focus:border-[#5fdf9b]/60 focus:ring-2 focus:ring-[#5fdf9b]/20"
              disabled={isSubmitting}
              id={titleId}
              maxLength={120}
              onChange={handleTitleChange}
              placeholder="Ex. Ajouter le filtre par collection"
              ref={handleInitialFocus}
              required
              value={title}
            />
            <span className="mt-1.5 block text-xs leading-5 text-[#6f7686]">
              Le commit utilisera le préfixe <code>{type}:</code> et un titre normalisé en minuscules.
            </span>
          </label>

          <label className="block" htmlFor={descriptionId}>
            <span className="mb-2 block text-sm font-medium text-[#cdd2dc]">Description de la PR</span>
            <textarea
              className="min-h-32 w-full resize-y rounded-[10px] border border-white/10 bg-[#15171c] px-3 py-2.5 text-sm leading-6 text-[#eef0f4] outline-none transition placeholder:text-[#565d6b] focus:border-[#5fdf9b]/60 focus:ring-2 focus:ring-[#5fdf9b]/20"
              disabled={isSubmitting}
              id={descriptionId}
              maxLength={10_000}
              onChange={handleDescriptionChange}
              placeholder="Explique le besoin, le résultat attendu et les points importants à vérifier."
              required
              value={description}
            />
          </label>

          {displayedError ? (
            <p
              className="rounded-[10px] border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200"
              id={errorId}
              role="alert"
            >
              {displayedError}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
            <Button disabled={isSubmitting} onClick={handleClose} variant="ghost">
              Annuler
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <svg
                  aria-hidden="true"
                  className="size-4 animate-spin motion-reduce:animate-none"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
                </svg>
              ) : null}
              {isSubmitting ? 'Création…' : 'Créer la draft PR'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
