import { isPreviewPresetId, type PreviewPresetId, previewPresets } from '../../lib/preview-presets.js';
import { Button } from '../button.js';
import { SectionCard } from '../section-card.js';

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
    <SectionCard
      title="Responsive preview"
      description="Switch viewport presets without leaving the PM session route."
      actions={
        previewUrl ? (
          <Button onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')} variant="secondary">
            Open raw preview
          </Button>
        ) : null
      }
    >
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
        <label className="flex items-center gap-2">
          <span className="text-slate-500">Preset</span>
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            onChange={(event) => {
              if (isPreviewPresetId(event.target.value)) {
                onPresetChange(event.target.value);
              }
            }}
            value={presetId}
          >
            {previewPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label} · {preset.description}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-slate-500">Zoom</span>
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
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
      </div>
    </SectionCard>
  );
}
