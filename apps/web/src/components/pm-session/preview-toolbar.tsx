import { isPreviewPresetId, type PreviewPresetId, previewPresets } from '../../lib/preview-presets.js';
import { Button } from '../button.js';

interface PreviewToolbarProps {
  onPresetChange: (presetId: PreviewPresetId) => void;
  onZoomChange: (zoomPercent: number) => void;
  presetId: PreviewPresetId;
  previewUrl: string | null;
  zoomPercent: number;
}

const zoomLevels = [75, 100, 125];

export function PreviewToolbar({
  onPresetChange,
  onZoomChange,
  presetId,
  previewUrl,
  zoomPercent,
}: PreviewToolbarProps) {
  return (
    <div className="flex flex-none flex-wrap items-center justify-center gap-2 border-t border-white/10 bg-[#15171c] px-3 py-2">
      <div className="flex flex-wrap items-center justify-center gap-2 text-[12px] text-[#cdd2dc]">
        <label className="flex items-center gap-2 rounded-[8px] border border-white/10 bg-[#0f1115] px-3 py-1.5">
          <span className="text-[#6f7686]">Preset</span>
          <select
            className="bg-transparent outline-none"
            onChange={(event) => {
              if (isPreviewPresetId(event.target.value)) {
                onPresetChange(event.target.value);
              }
            }}
            value={presetId}
          >
            {previewPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-[8px] border border-white/10 bg-[#0f1115] px-3 py-1.5">
          <span className="text-[#6f7686]">Zoom</span>
          <select
            className="bg-transparent outline-none"
            onChange={(event) => onZoomChange(Number(event.target.value))}
            value={zoomPercent}
          >
            {zoomLevels.map((level) => (
              <option key={level} value={level}>
                {level}%
              </option>
            ))}
          </select>
        </label>
        {previewUrl ? (
          <Button
            className="min-h-[30px] px-3 py-1.5 text-xs"
            onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
            variant="secondary"
          >
            Ouvrir
          </Button>
        ) : null}
      </div>
    </div>
  );
}
