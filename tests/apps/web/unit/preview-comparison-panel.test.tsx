import assert from 'node:assert/strict';
import test from 'node:test';
import type { PreviewComparison } from '@pairdock/shared-contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PreviewComparisonPanel } from '../../../../apps/web/src/components/pm-session/preview-comparison-panel.js';
import { PreviewComparisonViewer } from '../../../../apps/web/src/components/pm-session/preview-comparison-viewer.js';
import { sessionQueryKeys } from '../../../../apps/web/src/lib/session-query-keys.js';
import { comparison, comparisonSessionId, pngDataUrl } from './preview-comparison.fixtures.js';

Object.assign(globalThis, { React });

const accessToken = 'comparison-owner';
const comparisonKey = sessionQueryKeys.comparisons(accessToken, comparisonSessionId);

function renderPanel(queryClient: QueryClient, readOnly = false, sessionStatus = 'READY') {
  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <PreviewComparisonPanel
        accessToken={accessToken}
        sessionId={comparisonSessionId}
        previewUrl="https://preview.example.com/settings?token=private#fragment"
        presetId="mobile"
        readOnly={readOnly}
        sessionStatus={sessionStatus}
      />
    </QueryClientProvider>,
  );
}

function renderViewer(queryClient: QueryClient, value: PreviewComparison = comparison) {
  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <PreviewComparisonViewer accessToken={accessToken} comparison={value} sessionId={comparisonSessionId} />
    </QueryClientProvider>,
  );
}

test('a first comparison offers only Before with a private URL context and blocks uploads outside writable sessions', (context) => {
  const queryClient = new QueryClient();
  context.after(() => queryClient.clear());
  queryClient.setQueryData(comparisonKey, []);
  const html = renderPanel(queryClient);
  assert.match(html, /Importer la capture Avant/);
  assert.match(html, /value="https:\/\/preview\.example\.com\/settings"/);
  assert.match(html, /value="mobile" selected/);
  assert.doesNotMatch(html, /token=private|#fragment|Importer la capture Après/);
  for (const [readOnly, status] of [
    [true, 'READY'],
    [false, 'CLOSED'],
    [false, 'AGENT_RUNNING'],
  ] as const) {
    const blocked = renderPanel(queryClient, readOnly, status);
    assert.doesNotMatch(blocked, /type="file"|Importer la capture|Nouvelle comparaison/);
    assert.match(blocked, /Aucune comparaison enregistrée/);
  }
});

test('saved Before remains readable in read-only mode while After import is offered only to a writable session', (context) => {
  const queryClient = new QueryClient();
  context.after(() => queryClient.clear());
  queryClient.setQueryData(comparisonKey, [{ ...comparison, after: null }]);
  queryClient.setQueryData(
    sessionQueryKeys.attachment(accessToken, comparisonSessionId, comparison.before.attachment.id),
    pngDataUrl,
  );
  const editable = renderPanel(queryClient);
  assert.match(editable, /Importer la capture Après/);
  assert.match(editable, /La référence Avant est enregistrée/);
  assert.match(editable, /1280 × 900/);
  assert.doesNotMatch(editable, /Importer la capture Avant|type="range"|Voir Après/);
  const readOnly = renderPanel(queryClient, true);
  assert.match(readOnly, /alt="Avant la modification"/);
  assert.doesNotMatch(readOnly, /type="file"|Importer la capture|Nouvelle comparaison/);
});

test('private capture caches are isolated by identity and comparison controls require both loaded images', (context) => {
  const queryClient = new QueryClient();
  context.after(() => queryClient.clear());
  assert.ok(comparison.after);
  for (const capture of [comparison.before, comparison.after]) {
    queryClient.setQueryData(
      sessionQueryKeys.attachment('other-user', comparisonSessionId, capture.attachment.id),
      'data:image/png;base64,other-user-data',
    );
  }
  const privateLoading = renderViewer(queryClient);
  assert.match(privateLoading, /Chargement des images/);
  assert.doesNotMatch(privateLoading, /<img|other-user-data|Voir Après/);
  queryClient.setQueryData(
    sessionQueryKeys.attachment(accessToken, comparisonSessionId, comparison.before.attachment.id),
    pngDataUrl,
  );
  assert.match(renderViewer(queryClient), /Chargement des images/);
  queryClient.setQueryData(
    sessionQueryKeys.attachment(accessToken, comparisonSessionId, comparison.after.attachment.id),
    pngDataUrl,
  );
  const loaded = renderViewer(queryClient);
  assert.match(loaded, /alt="Avant la modification"/);
  assert.match(loaded, /alt="Après la modification"/);
  assert.match(loaded, /Voir Avant/);
  assert.match(loaded, /Voir Après/);
  assert.match(loaded, /type="range"/);
  assert.doesNotMatch(loaded, /other-user-data|src="https?:|Chargement des images/);
});

test('persisted comparisons load through the session query, expose a retryable error, and recover on a fresh read', async (context) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, retryOnMount: false } } });
  context.after(() => queryClient.clear());
  let calls = 0;
  context.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, options?: RequestInit) => {
    assert.equal(new URL(String(input)).pathname, `/sessions/${comparisonSessionId}/preview-comparisons`);
    assert.equal(new Headers(options?.headers).get('authorization'), `Bearer ${accessToken}`);
    calls += 1;
    if (calls === 1) return Response.json({ message: 'Comparison service unavailable.' }, { status: 503 });
    return Response.json([comparison]);
  });
  assert.match(renderPanel(queryClient), /Chargement des comparaisons/);
  // Server rendering registers the real query without mounting its browser subscription.
  const query = queryClient.getQueryCache().find({ queryKey: comparisonKey, exact: true });
  assert.ok(query);
  await assert.rejects(query.fetch(), /Comparison service unavailable/);
  const failed = renderPanel(queryClient);
  assert.match(failed, /role="alert"/);
  assert.match(failed, /Comparison service unavailable/);
  assert.match(failed, /Réessayer/);
  assert.doesNotMatch(failed, /Importer la capture Avant/);
  await queryClient.refetchQueries({ queryKey: comparisonKey, exact: true });
  const recovered = renderPanel(queryClient);
  assert.match(recovered, /https:\/\/preview\.example\.com\/settings/);
  assert.match(recovered, /Actualiser la capture Après/);
  assert.doesNotMatch(recovered, /Comparison service unavailable/);
  assert.equal(calls, 2);
  assert.deepEqual(queryClient.getQueryData(comparisonKey), [comparison]);
  assert.equal(queryClient.getQueryData(sessionQueryKeys.comparisons('other-user', comparisonSessionId)), undefined);
});
