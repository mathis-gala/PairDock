import { useCallback, useRef, useState } from 'react';
import { getFittedPreviewScale, getPreviewFrameStyle, type PreviewPresetId } from '../../lib/preview-presets.js';

interface PreviewFrameProps {
  presetId: PreviewPresetId;
  previewUrl: string | null;
}

interface PreviewAreaSize {
  height: number;
  width: number;
}

export function PreviewFrame({ presetId, previewUrl }: PreviewFrameProps) {
  const frameStyle = getPreviewFrameStyle(presetId);
  const observerRef = useRef<ResizeObserver | null>(null);
  const [areaSize, setAreaSize] = useState<PreviewAreaSize>({ height: 0, width: 0 });
  const scale = getFittedPreviewScale(
    Math.max(0, areaSize.width - 32),
    Math.max(0, areaSize.height - 32),
    frameStyle.widthPixels,
    frameStyle.heightPixels,
  );

  const handleContainerRef = useCallback((element: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setAreaSize({ height: entry.contentRect.height, width: entry.contentRect.width });
      }
    });
    observer.observe(element);
    observerRef.current = observer;
  }, []);

  return (
    <div className="flex size-full min-h-0 items-center justify-center overflow-hidden" ref={handleContainerRef}>
      {previewUrl ? (
        <div className="overflow-hidden rounded-[12px] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
          <div
            className="origin-top-left overflow-hidden bg-white"
            style={{
              width: frameStyle.widthPixels * scale,
              height: frameStyle.heightPixels * scale,
            }}
          >
            <iframe
              className="origin-top-left border-0"
              referrerPolicy="no-referrer"
              sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
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
