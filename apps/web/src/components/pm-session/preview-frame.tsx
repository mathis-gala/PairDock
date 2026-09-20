import { useCallback, useRef, useState } from 'react';
import { getFittedPreviewScale, getPreviewFrameStyle, type PreviewPresetId } from '../../lib/preview-presets.js';

interface PreviewFrameProps {
  agentAvailability: 'online' | 'offline';
  onFrameRef?: (frame: HTMLIFrameElement | null) => void;
  presetId: PreviewPresetId;
  previewUrl: string | null;
  sessionStatus: string;
}

interface PreviewAreaSize {
  height: number;
  width: number;
}

interface PreviewMessage {
  isPreparing: boolean;
  title: string;
  detail: string;
}

export function PreviewFrame({
  agentAvailability,
  onFrameRef,
  presetId,
  previewUrl,
  sessionStatus,
}: PreviewFrameProps) {
  const message = getMissingPreviewMessage(sessionStatus, agentAvailability);
  const isSessionClosing = sessionStatus === 'CLOSING' || sessionStatus === 'CLOSED';
  const frameUrl = isSessionClosing ? null : previewUrl;
  const warning = getPreviewWarning(sessionStatus, agentAvailability);
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
    <div className="flex size-full min-h-0 flex-col overflow-hidden">
      {frameUrl && warning ? (
        <p
          aria-live="polite"
          className="shrink-0 border-b border-amber-300/15 bg-amber-300/5 px-4 py-2 text-xs leading-5 text-amber-100"
          role="status"
        >
          {warning}
        </p>
      ) : null}
      <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden" ref={handleContainerRef}>
        {frameUrl ? (
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
                key={frameUrl}
                ref={onFrameRef}
                referrerPolicy="no-referrer"
                sandbox="allow-forms allow-modals allow-same-origin allow-scripts"
                src={frameUrl}
                style={{
                  width: frameStyle.width,
                  height: frameStyle.height,
                  transform: `scale(${scale})`,
                }}
                title="Aperçu PairDock"
              />
            </div>
          </div>
        ) : (
          <div
            aria-live="polite"
            className="m-auto flex max-w-[360px] flex-col items-center px-6 py-12 text-center"
            role="status"
          >
            {message.isPreparing ? (
              <svg
                aria-hidden="true"
                className="size-7 animate-spin text-[#5fdf9b] motion-reduce:animate-none"
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
            ) : null}
            <p className="mt-4 text-sm font-medium text-[#cdd2dc]">{message.title}</p>
            <p className="mt-1 max-w-[32ch] text-xs leading-5 text-[#6f7686]">{message.detail}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getPreviewWarning(sessionStatus: string, agentAvailability: 'online' | 'offline'): string | null {
  if (agentAvailability === 'offline') {
    return 'L’agent local est hors ligne. Cet aperçu peut afficher une version antérieure ; sa disponibilité et son état ne sont pas vérifiés.';
  }

  if (sessionStatus === 'FAILED') {
    return 'La session a rencontré une erreur. Cet aperçu peut afficher une version antérieure ; les dernières modifications ne sont pas validées.';
  }

  if (sessionStatus === 'AGENT_RUNNING') {
    return 'Travail en cours. Cet aperçu peut afficher une version antérieure ; les dernières modifications ne sont pas encore validées.';
  }

  if (sessionStatus === 'CHECKS_RUNNING') {
    return 'Vérifications en cours. Cet aperçu peut afficher une version antérieure ; les dernières modifications ne sont pas encore validées.';
  }

  return null;
}

function getMissingPreviewMessage(sessionStatus: string, agentAvailability: 'online' | 'offline'): PreviewMessage {
  if (sessionStatus === 'CLOSED') {
    return {
      isPreparing: false,
      title: 'Session terminée',
      detail: 'L’aperçu de cette session n’est plus disponible. Reviens au projet pour ouvrir une nouvelle session.',
    };
  }

  if (sessionStatus === 'CLOSING') {
    return {
      isPreparing: false,
      title: 'Fermeture de la session',
      detail: 'L’aperçu est en cours d’arrêt.',
    };
  }

  if (agentAvailability === 'offline') {
    return {
      isPreparing: false,
      title: 'L’agent local est hors ligne',
      detail: 'Demande au développeur de reconnecter son agent pour retrouver l’aperçu.',
    };
  }

  if (sessionStatus === 'FAILED') {
    return {
      isPreparing: false,
      title: 'La session a rencontré une erreur',
      detail: 'Aucun aperçu n’est disponible. Consulte le détail de l’erreur dans la conversation.',
    };
  }

  switch (sessionStatus) {
    case 'CREATED':
    case 'AGENT_CONNECTING':
    case 'WORKTREE_CREATING':
    case 'DOCKER_STARTING':
    case 'PREVIEW_STARTING':
      return {
        isPreparing: true,
        title: 'L’agent local prépare l’aperçu',
        detail: 'L’URL apparaîtra ici dès que l’application sera prête.',
      };
    default:
      return {
        isPreparing: false,
        title: 'Aperçu indisponible',
        detail:
          'Aucune URL d’aperçu n’a été fournie. Demande au développeur de vérifier la préparation de cette session.',
      };
  }
}
