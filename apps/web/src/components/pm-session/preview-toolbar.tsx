import type { MouseEvent } from 'react';
import { isPreviewPresetId, type PreviewPresetId, previewPresets } from '../../lib/preview-presets.js';
import { Button } from '../button.js';

interface PreviewToolbarProps {
  onPresetChange: (presetId: PreviewPresetId) => void;
  presetId: PreviewPresetId;
  previewUrl: string | null;
}

export function PreviewToolbar({ onPresetChange, presetId, previewUrl }: PreviewToolbarProps) {
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

  return (
    <div className="flex flex-none flex-wrap items-center justify-center gap-2 border-t border-black/10 bg-[#ffffff] px-3 py-2">
      <div className="flex flex-wrap items-center justify-center gap-2 text-[12px] text-[#46505f]">
        <fieldset className="flex flex-wrap items-center justify-center gap-1">
          <legend className="sr-only">Format de preview</legend>
          {previewPresets.map((preset) => {
            const isSelected = preset.id === presetId;

            return (
              <button
                aria-pressed={isSelected}
                className={
                  isSelected
                    ? 'flex min-h-11 items-center gap-2 rounded-[9px] border border-[#16834f]/50 bg-[#16834f]/10 px-3 text-[#14532d] transition hover:bg-[#16834f]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16834f]/40'
                    : 'flex min-h-11 items-center gap-2 rounded-[9px] border border-transparent px-3 text-[#5e6878] transition hover:border-black/10 hover:bg-black/5 hover:text-[#20242b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16834f]/40'
                }
                data-preset-id={preset.id}
                key={preset.id}
                onClick={handlePresetClick}
                title={preset.description}
                type="button"
              >
                <PresetIcon presetId={preset.id} />
                <span>{preset.label}</span>
              </button>
            );
          })}
        </fieldset>
        <span className="hidden rounded-[8px] border border-black/10 bg-[#f1f3f5] px-3 py-1.5 text-[#5e6878] sm:inline-flex">
          Ajustement auto
        </span>
        {previewUrl ? (
          <Button className="min-h-[30px] px-3 py-1.5 text-xs" onClick={handleOpenPreview} variant="secondary">
            Ouvrir
          </Button>
        ) : null}
      </div>
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
