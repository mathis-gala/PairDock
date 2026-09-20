import type { PreviewComparison } from '@pairdock/shared-contracts';
import { useQuery } from '@tanstack/react-query';
import { type ChangeEvent, useId, useState } from 'react';
import { createApiClient } from '../../api/client.js';
import { sessionQueryKeys } from '../../lib/session-query-keys.js';
import { Button } from '../button.js';

interface PreviewComparisonViewerProps {
  accessToken: string;
  sessionId: string;
  comparison: PreviewComparison;
}

export function PreviewComparisonViewer({ accessToken, sessionId, comparison }: PreviewComparisonViewerProps) {
  const [position, setPosition] = useState(50);
  const sliderId = useId();
  const before = useQuery({
    queryKey: sessionQueryKeys.attachment(accessToken, sessionId, comparison.before.attachment.id),
    queryFn: () => createApiClient(accessToken).sessions.readAttachment(sessionId, comparison.before.attachment.id),
    staleTime: Number.POSITIVE_INFINITY,
  });
  const afterCapture = comparison.after;
  const after = useQuery({
    queryKey: sessionQueryKeys.attachment(accessToken, sessionId, afterCapture?.attachment.id ?? 'absent'),
    queryFn: () => {
      if (!afterCapture) throw new Error('Capture Après absente.');
      return createApiClient(accessToken).sessions.readAttachment(sessionId, afterCapture.attachment.id);
    },
    enabled: Boolean(afterCapture),
    staleTime: Number.POSITIVE_INFINITY,
  });
  function handlePosition(event: ChangeEvent<HTMLInputElement>) {
    setPosition(Number(event.target.value));
  }
  function handleBefore() {
    setPosition(0);
  }
  function handleAfter() {
    setPosition(100);
  }
  function handleRetry() {
    void before.refetch();
    if (afterCapture) void after.refetch();
  }
  if (before.isError || after.isError)
    return (
      <div className="space-y-2">
        <p className="text-sm text-rose-200" role="alert">
          Impossible de charger les captures. {before.error?.message ?? after.error?.message}
        </p>
        <Button onClick={handleRetry} variant="secondary">
          Réessayer les images
        </Button>
      </div>
    );
  if (!before.data || (afterCapture && !after.data))
    return (
      <p className="text-sm text-[#aeb5c3]" role="status">
        Chargement des images…
      </p>
    );
  const afterStyle = { clipPath: `inset(0 ${100 - position}% 0 0)` };
  return (
    <figure className="space-y-3">
      <div className="relative overflow-hidden rounded-lg border border-white/15 bg-[#191c23]">
        <img
          alt="Avant la modification"
          className="block h-auto max-h-[38vh] w-full object-contain"
          src={before.data}
        />
        {after.data ? (
          <img
            alt="Après la modification"
            className="absolute inset-0 h-full w-full object-contain"
            src={after.data}
            style={afterStyle}
          />
        ) : null}
      </div>
      {after.data ? (
        <div className="space-y-2">
          <div className="flex justify-between gap-3">
            <Button onClick={handleBefore} variant="secondary">
              Voir Avant
            </Button>
            <Button onClick={handleAfter} variant="secondary">
              Voir Après
            </Button>
          </div>
          <label className="block text-xs text-[#aeb5c3]" htmlFor={sliderId}>
            Superposition : {position} % de l’image Après
            <input
              className="mt-2 min-h-8 w-full accent-[#5fdf9b]"
              id={sliderId}
              max={100}
              min={0}
              onChange={handlePosition}
              type="range"
              value={position}
            />
          </label>
        </div>
      ) : (
        <p className="text-sm text-[#aeb5c3]">
          La référence Avant est enregistrée. Ajoute Après une fois le changement prêt.
        </p>
      )}
      <figcaption className="text-xs leading-5 text-[#aeb5c3]">
        Captures importées : Avant le {new Date(comparison.before.createdAt).toLocaleString('fr-FR')}
        {comparison.after ? ` · Après le ${new Date(comparison.after.createdAt).toLocaleString('fr-FR')}` : ''}. Le
        contenu et le cadrage sont à vérifier visuellement.
      </figcaption>
    </figure>
  );
}
