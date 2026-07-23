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
              sandbox="allow-forms allow-modals allow-same-origin allow-scripts"
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
        <div
          aria-live="polite"
          className="m-auto flex max-w-[360px] flex-col items-center px-6 py-12 text-center"
          role="status"
        >
          <svg
            aria-hidden="true"
            className="size-7 animate-spin text-[#16834f] motion-reduce:animate-none"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-20" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" />
            <path
              className="opacity-90"
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2.5"
            />
          </svg>
          <p className="mt-4 text-sm font-medium text-[#46505f]">L'agent local prépare la preview</p>
          <p className="mt-1 max-w-[32ch] text-xs leading-5 text-[#697386]">
            L'URL apparaîtra ici dès que l'application sera prête.
          </p>
        </div>
      )}
    </div>
  );
}
