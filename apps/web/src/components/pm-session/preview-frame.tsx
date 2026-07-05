import { getPreviewFrameStyle, type PreviewPresetId } from '../../lib/preview-presets.js';

interface PreviewFrameProps {
  presetId: PreviewPresetId;
  previewUrl: string | null;
  zoomPercent: number;
}

export function PreviewFrame({ presetId, previewUrl, zoomPercent }: PreviewFrameProps) {
  const frameStyle = getPreviewFrameStyle(presetId);
  const scale = zoomPercent / 100;

  return (
    <div className="flex min-h-full justify-center">
      {previewUrl ? (
        <div className="overflow-auto rounded-[12px] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
          <div
            className="origin-top-left overflow-hidden bg-white"
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
        <div className="m-auto max-w-[320px] rounded-[12px] border border-dashed border-white/10 bg-[#15171c] px-4 py-12 text-center text-sm text-[#565d6b]">
          L'agent local n'a pas encore publié d'URL de preview pour cette session.
        </div>
      )}
    </div>
  );
}
