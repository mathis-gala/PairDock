import { SectionCard } from '../ui/section-card.js';
import { getPreviewFrameStyle, type PreviewPresetId } from './preview-presets.js';

interface PreviewFrameProps {
  presetId: PreviewPresetId;
  previewUrl: string | null;
  zoomPercent: number;
}

export function PreviewFrame({ presetId, previewUrl, zoomPercent }: PreviewFrameProps) {
  const frameStyle = getPreviewFrameStyle(presetId);
  const scale = zoomPercent / 100;

  return (
    <SectionCard
      title="Preview canvas"
      description="The iframe scales inside the workspace while preserving the requested device preset."
    >
      {previewUrl ? (
        <div className="overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <div
            className="origin-top-left overflow-hidden rounded-xl border border-slate-700 bg-white"
            style={{
              width: `calc(${frameStyle.width} * ${scale})`,
              height: `calc(${frameStyle.height} * ${scale})`,
            }}
          >
            <iframe
              className="origin-top-left"
              src={previewUrl}
              style={{
                width: frameStyle.width,
                height: frameStyle.height,
                transform: `scale(${scale})`,
              }}
              title="PairDock preview"
            />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/70 px-4 py-12 text-center text-sm text-slate-500">
          The local agent has not published a preview URL for this session yet.
        </div>
      )}
    </SectionCard>
  );
}
