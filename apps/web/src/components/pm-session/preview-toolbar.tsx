import type { ChangeEvent } from 'react';
import { isPreviewPresetId, type PreviewPresetId, previewPresets } from '../../lib/preview-presets.js';
import { Button } from '../button.js';

interface PreviewToolbarProps {
  onPresetChange: (presetId: PreviewPresetId) => void;
  presetId: PreviewPresetId;
  previewUrl: string | null;
}

export function PreviewToolbar({ onPresetChange, presetId, previewUrl }: PreviewToolbarProps) {
  function handlePresetChange(event: ChangeEvent<HTMLSelectElement>) {
    if (isPreviewPresetId(event.target.value)) {
      onPresetChange(event.target.value);
    }
  }

  function handleOpenPreview() {
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <div className="flex flex-none flex-wrap items-center justify-center gap-2 border-t border-white/10 bg-[#15171c] px-3 py-2">
      <div className="flex flex-wrap items-center justify-center gap-2 text-[12px] text-[#cdd2dc]">
        <label className="flex items-center gap-2 rounded-[8px] border border-white/10 bg-[#0f1115] px-3 py-1.5">
          <span className="text-[#6f7686]">Preset</span>
          <select className="bg-transparent outline-none" onChange={handlePresetChange} value={presetId}>
            {previewPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>
        <span className="rounded-[8px] border border-white/10 bg-[#0f1115] px-3 py-1.5 text-[#8b92a1]">
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
