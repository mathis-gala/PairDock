import { type MouseEvent, useState } from 'react';
import { isPreviewPresetId, type PreviewPresetId, previewPresets } from '../../lib/preview-presets.js';
import type { PreviewSelectionSnapshot } from '../../lib/preview-selection-bridge.js';
import { Button } from '../button.js';

interface PreviewToolbarProps {
  onPresetChange: (presetId: PreviewPresetId) => void;
  presetId: PreviewPresetId;
  previewUrl: string | null;
  selectionControls?: PreviewSelectionControls;
}

export interface PreviewSelectionControls {
  state: PreviewSelectionSnapshot;
  disabledReason: string | null;
  onToggle: () => void;
  onRetry: () => void;
}

export function PreviewToolbar({ onPresetChange, presetId, previewUrl, selectionControls }: PreviewToolbarProps) {
  const [showSelectionHelp, setShowSelectionHelp] = useState(false);

  function handleToggleSelectionHelp() {
    setShowSelectionHelp((current) => !current);
  }
  function handlePresetClick(event: MouseEvent<HTMLButtonElement>) {
    const nextPresetId = event.currentTarget.dataset.presetId;

    if (nextPresetId && isPreviewPresetId(nextPresetId)) {
      onPresetChange(nextPresetId);
    }
  }

  function handleOpenPreview() {
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }
  }

  let selectionMessage = 'Sélectionne un élément, puis décris la modification dans la discussion.';
  if (selectionControls?.disabledReason) {
    selectionMessage = selectionControls.disabledReason;
  } else if (!previewUrl) {
    selectionMessage = 'La sélection sera disponible quand l’aperçu sera prêt.';
  } else if (selectionControls?.state.status === 'connecting') {
    selectionMessage = 'Connexion à la sélection d’éléments…';
  } else if (selectionControls?.state.status === 'unsupported') {
    selectionMessage = 'Sélection indisponible sur cette page. Recharge l’aperçu ou réessaie.';
  } else if (selectionControls?.state.isSelecting) {
    selectionMessage = 'Clique sur un élément à annoter. Échap pour annuler.';
  }
  const isSelectionDisabled = !!selectionControls?.disabledReason || selectionControls?.state.status !== 'ready';

  return (
    <div className="relative flex flex-none flex-col items-center gap-2 border-t border-white/10 bg-[#15171c] px-3 py-2">
      <div className="flex w-full items-center justify-center gap-1 text-[12px] text-[#cdd2dc] sm:flex-wrap sm:gap-2">
        <fieldset className="flex shrink-0 items-center justify-center gap-0.5 sm:flex-wrap sm:gap-1">
          <legend className="sr-only">Format de l’aperçu</legend>
          {previewPresets.map((preset) => {
            const isSelected = preset.id === presetId;

            return (
              <button
                aria-pressed={isSelected}
                className={
                  isSelected
                    ? 'flex size-11 items-center justify-center gap-2 rounded-[9px] border border-[#5fdf9b]/50 bg-[#5fdf9b]/10 text-[#eafff3] transition hover:bg-[#5fdf9b]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fdf9b]/40 sm:w-auto sm:px-3'
                    : 'flex size-11 items-center justify-center gap-2 rounded-[9px] border border-transparent text-[#8b92a1] transition hover:border-white/10 hover:bg-white/5 hover:text-[#eef0f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fdf9b]/40 sm:w-auto sm:px-3'
                }
                data-preset-id={preset.id}
                key={preset.id}
                onClick={handlePresetClick}
                title={preset.description}
                type="button"
              >
                <PresetIcon presetId={preset.id} />
                <span className="sr-only sm:not-sr-only">{preset.label}</span>
              </button>
            );
          })}
        </fieldset>
        <span className="hidden rounded-[8px] border border-white/10 bg-[#0f1115] px-3 py-1.5 text-[#8b92a1] sm:inline-flex">
          Ajustement auto
        </span>
        {previewUrl ? (
          <Button
            className="shrink-0 text-xs max-sm:size-11 max-sm:p-0 sm:px-3"
            onClick={handleOpenPreview}
            title="Ouvrir l’aperçu dans un nouvel onglet"
            variant="secondary"
          >
            <svg aria-hidden="true" className="size-4 sm:hidden" fill="none" viewBox="0 0 24 24">
              <path
                d="M14 4h6v6m0-6-9 9M10 5H5v14h14v-5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
            <span className="sr-only sm:not-sr-only">Ouvrir</span>
          </Button>
        ) : null}
        {selectionControls ? (
          <Button
            aria-describedby="preview-selection-status"
            aria-pressed={selectionControls.state.isSelecting}
            className="min-h-11 shrink-0 px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fdf9b]/60 max-sm:size-11 max-sm:p-0"
            disabled={isSelectionDisabled}
            onClick={selectionControls.onToggle}
            variant={selectionControls.state.isSelecting ? 'primary' : 'secondary'}
            title={selectionControls.state.isSelecting ? 'Annuler la sélection' : 'Sélectionner un élément'}
          >
            <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
              <path d="m5 3 14 9-7 1-3 7-4-17Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
            </svg>
            <span className="sr-only sm:not-sr-only">
              {selectionControls.state.isSelecting ? 'Annuler' : 'Sélectionner'}
            </span>
          </Button>
        ) : null}
        {selectionControls ? (
          <Button
            aria-controls="preview-selection-help"
            aria-expanded={showSelectionHelp}
            aria-label="Aide à la sélection d’éléments"
            className="size-11 shrink-0 p-0 sm:hidden"
            onClick={handleToggleSelectionHelp}
            variant="ghost"
          >
            ?
          </Button>
        ) : null}
      </div>
      {selectionControls ? (
        <div
          className={`${showSelectionHelp ? 'flex' : 'hidden'} absolute inset-x-2 bottom-full z-20 mb-1 flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-lg border border-white/10 bg-[#20232a] p-3 text-center text-xs leading-5 text-[#cdd2dc] shadow-lg sm:static sm:mb-0 sm:flex sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:text-[#a3aab8] sm:shadow-none`}
          id="preview-selection-help"
        >
          <p aria-live="polite" id="preview-selection-status" role="status">
            {selectionMessage}
          </p>
          {selectionControls.state.status === 'unsupported' && !selectionControls.disabledReason ? (
            <button
              className="min-h-9 rounded px-1 text-[#a9efc9] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fdf9b]/60"
              onClick={selectionControls.onRetry}
              type="button"
            >
              Réessayer
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PresetIcon({ presetId }: { presetId: PreviewPresetId }) {
  if (presetId === 'mobile') {
    return (
      <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
        <rect height="18" rx="2" stroke="currentColor" strokeWidth="1.8" width="10" x="7" y="3" />
        <path d="M10.5 18h3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (presetId === 'tablet') {
    return (
      <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
        <rect height="18" rx="2" stroke="currentColor" strokeWidth="1.8" width="14" x="5" y="3" />
        <circle cx="12" cy="18" fill="currentColor" r="0.9" />
      </svg>
    );
  }

  if (presetId === 'laptop') {
    return (
      <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
        <rect height="11" rx="1.5" stroke="currentColor" strokeWidth="1.8" width="16" x="4" y="4" />
        <path d="M2.5 18h19l-1 2h-17l-1-2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
      <rect height="13" rx="1.5" stroke="currentColor" strokeWidth="1.8" width="18" x="3" y="3" />
      <path d="M9 21h6M12 16v5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}
