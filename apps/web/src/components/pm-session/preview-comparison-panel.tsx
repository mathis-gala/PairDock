import {
  isPromptableSessionStatus,
  MAX_PREVIEW_COMPARISONS,
  type PreviewComparison,
  type PreviewComparisonInput,
} from '@pairdock/shared-contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ChangeEvent, useId, useState } from 'react';
import { createApiClient } from '../../api/client.js';
import {
  comparisonCaptureFile,
  previewComparisonPageUrl,
  validatePreviewCapture,
} from '../../lib/preview-comparison.js';
import { type PreviewPresetId, previewPresets } from '../../lib/preview-presets.js';
import { sessionQueryKeys } from '../../lib/session-query-keys.js';
import { Button } from '../button.js';
import { PreviewComparisonViewer } from './preview-comparison-viewer.js';

interface PreviewComparisonPanelProps {
  accessToken: string;
  sessionId: string;
  previewUrl: string | null;
  presetId: PreviewPresetId;
  readOnly: boolean;
  sessionStatus: string;
  onUseInReview?: (files: File[]) => void;
}

export function PreviewComparisonPanel({
  accessToken,
  sessionId,
  previewUrl,
  presetId,
  readOnly,
  sessionStatus,
  onUseInReview,
}: PreviewComparisonPanelProps) {
  const queryClient = useQueryClient();
  const queryKey = sessionQueryKeys.comparisons(accessToken, sessionId);
  const comparisonQuery = useQuery({
    queryKey,
    queryFn: () => createApiClient(accessToken).sessions.listPreviewComparisons(sessionId),
    refetchInterval: 10_000,
  });
  const comparisons = comparisonQuery.data ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pageUrlInput, setPageUrlInput] = useState<string | null>(null);
  const [formatId, setFormatId] = useState<PreviewPresetId>(presetId);
  const id = useId();
  const pageUrl = pageUrlInput ?? previewComparisonPageUrl(previewUrl);
  const selected = comparisons.find((comparison) => comparison.id === selectedId) ?? comparisons[0] ?? null;
  const isNew = selectedId === 'new' || !selected;
  const canWrite = !readOnly && isPromptableSessionStatus(sessionStatus);
  const format = previewPresets.find((preset) => preset.id === formatId) ?? previewPresets[0];

  const upload = useMutation({
    mutationFn: async ({ file, input }: { file: File; input: PreviewComparisonInput }) => {
      validatePreviewCapture(file, input);
      return createApiClient(accessToken).sessions.importPreviewCapture(sessionId, input, file);
    },
    onSuccess: async (comparison) => {
      await queryClient.cancelQueries({ queryKey, exact: true });
      queryClient.setQueryData<PreviewComparison[]>(queryKey, (current = []) => [
        comparison,
        ...current.filter((item) => item.id !== comparison.id),
      ]);
      setSelectedId(comparison.id);
      void queryClient.invalidateQueries({ queryKey, exact: true });
    },
  });
  const attachToReview = useMutation({
    mutationFn: async (comparison: PreviewComparison) => {
      if (!comparison.after) throw new Error('Ajoute la capture Après avant de joindre la comparaison.');
      const captures = [comparison.before, comparison.after];
      const files = await Promise.all(
        captures.map(async (capture, index) => {
          const data = await queryClient.fetchQuery({
            queryKey: sessionQueryKeys.attachment(accessToken, sessionId, capture.attachment.id),
            queryFn: () => createApiClient(accessToken).sessions.readAttachment(sessionId, capture.attachment.id),
            staleTime: Number.POSITIVE_INFINITY,
          });
          return comparisonCaptureFile(data, index === 0 ? 'avant' : 'apres');
        }),
      );
      onUseInReview?.(files);
    },
  });
  const busy = upload.isPending || attachToReview.isPending;
  const error = upload.error?.message ?? attachToReview.error?.message;

  function handleNew() {
    setSelectedId('new');
    upload.reset();
    attachToReview.reset();
  }
  function handleSelect(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedId(event.target.value);
    upload.reset();
    attachToReview.reset();
  }
  function handlePageUrl(event: ChangeEvent<HTMLInputElement>) {
    setPageUrlInput(event.target.value);
  }
  function handleFormat(event: ChangeEvent<HTMLSelectElement>) {
    const value = previewPresets.find((preset) => preset.id === event.target.value);
    if (value) setFormatId(value.id);
  }
  function handleBefore(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !canWrite || busy) return;
    upload.mutate({
      file,
      input: {
        stage: 'before',
        pageUrl: pageUrl.trim(),
        viewport: { width: format.widthPixels, height: format.heightPixels },
      },
    });
  }
  function handleAfter(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !selected || !canWrite || busy) return;
    upload.mutate({
      file,
      input: { stage: 'after', comparisonId: selected.id, pageUrl: selected.pageUrl, viewport: selected.viewport },
    });
  }
  function handleAttach() {
    if (selected) attachToReview.mutate(selected);
  }
  function handleRetry() {
    void comparisonQuery.refetch();
  }

  return (
    <section aria-labelledby={`${id}-title`} className="min-h-full space-y-5 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#eef0f4]" id={`${id}-title`}>
            Comparer le résultat
          </h2>
          <p className="mt-1 max-w-prose text-xs leading-5 text-[#aeb5c3]">
            {isNew
              ? 'Importe des captures de la même page et du même cadrage, avant puis après le changement. Elles restent privées à la session.'
              : 'Captures privées à cette session.'}
          </p>
        </div>
        {canWrite && comparisons.length > 0 && !isNew ? (
          <Button
            aria-label="Nouvelle comparaison"
            disabled={busy || comparisons.length >= MAX_PREVIEW_COMPARISONS}
            onClick={handleNew}
            variant="secondary"
          >
            Nouvelle
          </Button>
        ) : null}
      </header>
      {comparisonQuery.isPending ? (
        <p role="status" className="text-sm text-[#aeb5c3]">
          Chargement des comparaisons…
        </p>
      ) : null}
      {comparisonQuery.isError ? (
        <div className="space-y-2">
          <p role="alert" className="text-sm text-rose-200">
            {comparisonQuery.error.message}
          </p>
          <Button onClick={handleRetry} variant="secondary">
            Réessayer
          </Button>
        </div>
      ) : null}
      {comparisons.length > 1 || (comparisons.length > 0 && isNew) ? (
        <label className="block text-xs text-[#aeb5c3]" htmlFor={`${id}-selection`}>
          Comparaison enregistrée
          <select
            className="mt-2 min-h-11 w-full rounded-lg border border-white/15 bg-[#191c23] px-3 text-sm text-[#eef0f4]"
            disabled={busy}
            id={`${id}-selection`}
            onChange={handleSelect}
            value={isNew ? 'new' : selected?.id}
          >
            {isNew ? <option value="new">Nouvelle comparaison</option> : null}
            {comparisons.map((comparison) => (
              <option key={comparison.id} value={comparison.id}>
                {new URL(comparison.pageUrl).pathname} · {comparison.viewport.width} × {comparison.viewport.height} ·{' '}
                {new Date(comparison.before.createdAt).toLocaleString('fr-FR')}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {isNew && canWrite && !comparisonQuery.isPending && !comparisonQuery.isError ? (
        <div className="space-y-4 rounded-xl border border-white/10 p-4">
          <label className="block text-xs text-[#aeb5c3]" htmlFor={`${id}-page`}>
            Page capturée
            <input
              className="mt-2 min-h-11 w-full rounded-lg border border-white/15 bg-[#191c23] px-3 text-sm text-[#eef0f4]"
              disabled={busy}
              id={`${id}-page`}
              onChange={handlePageUrl}
              placeholder="https://preview.example.com/ma-page"
              type="url"
              value={pageUrl}
            />
          </label>
          <label className="block text-xs text-[#aeb5c3]" htmlFor={`${id}-format`}>
            Format de la preview
            <select
              className="mt-2 min-h-11 w-full rounded-lg border border-white/15 bg-[#191c23] px-3 text-sm text-[#eef0f4]"
              disabled={busy}
              id={`${id}-format`}
              onChange={handleFormat}
              value={formatId}
            >
              {previewPresets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.description}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs leading-5 text-[#aeb5c3]">
            Garde la même page, le même zoom et la même position de défilement pour la capture Après. PNG uniquement, 5
            Mo maximum ; dimensions des deux images identiques.
          </p>
          <label
            className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-[#5fdf9b]/40 bg-[#5fdf9b]/10 px-3 text-sm text-[#b1f3ce] focus-within:ring-2 focus-within:ring-[#5fdf9b] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
            htmlFor={`${id}-before`}
          >
            Importer la capture Avant
            <input
              accept="image/png"
              className="sr-only"
              disabled={busy || !pageUrl || comparisons.length >= MAX_PREVIEW_COMPARISONS}
              id={`${id}-before`}
              onChange={handleBefore}
              type="file"
            />
          </label>
          {comparisons.length >= MAX_PREVIEW_COMPARISONS ? (
            <p className="text-xs text-amber-200">
              La limite de {MAX_PREVIEW_COMPARISONS} comparaisons de cette session est atteinte.
            </p>
          ) : null}
        </div>
      ) : null}
      {!isNew && selected ? (
        <>
          <details className="text-xs text-[#aeb5c3]">
            <summary className="cursor-pointer rounded py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fdf9b]">
              Page et format · {selected.viewport.width} × {selected.viewport.height}
            </summary>
            <p className="mt-2 break-all">{selected.pageUrl}</p>
            <p className="mt-1">
              Format {selected.viewport.width} × {selected.viewport.height} · Images {selected.before.image.width} ×{' '}
              {selected.before.image.height} px
            </p>
          </details>
          <PreviewComparisonViewer
            accessToken={accessToken}
            comparison={selected}
            key={selected.id}
            sessionId={sessionId}
          />
          <div className="flex flex-wrap gap-3">
            {canWrite ? (
              <label
                className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-white/15 px-3 text-sm text-[#eef0f4] focus-within:ring-2 focus-within:ring-[#5fdf9b] has-[:disabled]:opacity-50"
                htmlFor={`${id}-after`}
              >
                {selected.after ? 'Actualiser la capture Après' : 'Importer la capture Après'}
                <input
                  accept="image/png"
                  className="sr-only"
                  disabled={busy}
                  id={`${id}-after`}
                  onChange={handleAfter}
                  type="file"
                />
              </label>
            ) : null}
            {!readOnly && onUseInReview && selected.after ? (
              <Button disabled={busy} onClick={handleAttach} variant="secondary">
                Préparer la PR avec ces captures
              </Button>
            ) : null}
          </div>
          {!readOnly && onUseInReview && selected.after ? (
            <p className="text-xs text-[#aeb5c3]">
              Tu pourras vérifier et retirer les captures avant publication dans la PR.
            </p>
          ) : null}
        </>
      ) : null}
      {isNew && !canWrite && !comparisonQuery.isPending ? (
        <p className="text-sm text-[#aeb5c3]">
          Aucune comparaison enregistrée. Les captures peuvent être ajoutées lorsque la session est prête à recevoir une
          demande.
        </p>
      ) : null}
      {busy ? (
        <p role="status" className="text-sm text-[#a9efc9]">
          {upload.isPending ? 'Enregistrement de la capture…' : 'Préparation des captures pour la PR…'}
        </p>
      ) : null}
      {upload.isSuccess && !busy ? (
        <p role="status" className="text-xs text-[#a9efc9]">
          Capture enregistrée dans la session.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-rose-200">
          {error}
        </p>
      ) : null}
    </section>
  );
}
