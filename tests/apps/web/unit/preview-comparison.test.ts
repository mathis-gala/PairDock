import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_PREVIEW_CAPTURE_BYTES, type PreviewComparisonInput } from '@pairdock/shared-contracts';
import { createApiClient } from '../../../../apps/web/src/api/client.js';
import {
  comparisonCaptureFile,
  previewComparisonPageUrl,
  validatePreviewCapture,
} from '../../../../apps/web/src/lib/preview-comparison.js';
import { comparison, comparisonSessionId, pngBytes, pngDataUrl } from './preview-comparison.fixtures.js';

test('comparison context removes credentials and private query/fragment data while retaining the captured page', () => {
  assert.equal(
    previewComparisonPageUrl('https://user:password@preview.example.com/settings?token=private#private-section'),
    'https://preview.example.com/settings',
  );
  for (const value of [
    null,
    '',
    'not a URL',
    'data:text/html,private-content',
    'javascript:private()',
    'ftp://example.com/file',
  ]) {
    assert.equal(previewComparisonPageUrl(value), '', String(value));
  }
});

test('capture validation accepts PNG metadata and rejects unsupported, empty, oversized or private contexts', () => {
  const png = new File([pngBytes], 'capture.png', { type: 'image/png' });
  const input: PreviewComparisonInput = { stage: 'before', pageUrl: comparison.pageUrl, viewport: comparison.viewport };
  assert.doesNotThrow(() => validatePreviewCapture(png, input));
  for (const file of [
    new File([pngBytes], 'renamed.png', { type: 'image/jpeg' }),
    new File([], 'empty.png', { type: 'image/png' }),
    new File([new Uint8Array(MAX_PREVIEW_CAPTURE_BYTES + 1)], 'large.png', { type: 'image/png' }),
  ])
    assert.throws(() => validatePreviewCapture(file, input), /PNG|5 Mo/);
  for (const pageUrl of [
    'https://preview.example.com/?secret=value',
    'https://preview.example.com/#secret',
    'https://user:password@preview.example.com/',
    'file:///private/capture',
  ]) {
    assert.throws(() => validatePreviewCapture(png, { ...input, pageUrl }), /HTTP/);
  }
  assert.throws(() => validatePreviewCapture(png, { ...input, viewport: { width: 0, height: 900 } }), /format valide/);
});

test('private PNG data can become review attachments without changing bytes or accepting other media', async () => {
  for (const stage of ['avant', 'apres'] as const) {
    const file = comparisonCaptureFile(pngDataUrl, stage);
    assert.equal(file.name, `${stage}.png`);
    assert.equal(file.type, 'image/png');
    assert.deepEqual(Buffer.from(await file.arrayBuffer()), pngBytes);
  }
  for (const value of [
    'https://preview.example.com/capture.png',
    'data:image/jpeg;base64,/9j/',
    'data:image/png;base64,<>',
  ]) {
    assert.throws(() => comparisonCaptureFile(value, 'avant'), /PNG valide/);
  }
});

test('before and after imports send authenticated multipart bytes with matching stage and comparison metadata', async (context) => {
  const inputs: PreviewComparisonInput[] = [
    { stage: 'before', pageUrl: comparison.pageUrl, viewport: comparison.viewport },
    { stage: 'after', comparisonId: comparison.id, pageUrl: comparison.pageUrl, viewport: comparison.viewport },
  ];
  let imports = 0;
  context.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, options?: RequestInit) => {
    assert.equal(new URL(String(input)).pathname, `/sessions/${comparisonSessionId}/preview-comparisons`);
    const headers = new Headers(options?.headers);
    assert.equal(headers.get('authorization'), 'Bearer private-token');
    assert.equal(headers.has('content-type'), false, 'The browser must supply the multipart boundary.');
    assert.equal(options?.method, 'POST');
    assert.ok(options.body instanceof FormData);
    assert.deepEqual(JSON.parse(String(options.body.get('metadata'))), inputs[imports]);
    const file = options.body.get('screenshot');
    assert.ok(file instanceof File);
    assert.equal(file.name, 'capture.png');
    assert.deepEqual(Buffer.from(await file.arrayBuffer()), pngBytes);
    imports += 1;
    return Response.json(comparison);
  });
  const api = createApiClient('private-token');
  for (const input of inputs) {
    assert.deepEqual(
      await api.sessions.importPreviewCapture(
        comparisonSessionId,
        input,
        new File([pngBytes], 'capture.png', { type: 'image/png' }),
      ),
      comparison,
    );
  }
  assert.equal(imports, 2);
});

test('comparison reads and private image failures preserve session authorization and the server error', async (context) => {
  const paths: string[] = [];
  context.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, options?: RequestInit) => {
    paths.push(new URL(String(input)).pathname);
    assert.equal(new Headers(options?.headers).get('authorization'), 'Bearer private-token');
    if (paths.length === 1) return Response.json([comparison]);
    return Response.json({ message: 'Session access denied.' }, { status: 403 });
  });
  const api = createApiClient('private-token');
  assert.deepEqual(await api.sessions.listPreviewComparisons(comparisonSessionId), [comparison]);
  await assert.rejects(
    api.sessions.readAttachment(comparisonSessionId, comparison.before.attachment.id),
    /Session access denied/,
  );
  assert.deepEqual(paths, [
    `/sessions/${comparisonSessionId}/preview-comparisons`,
    `/sessions/${comparisonSessionId}/attachments/${comparison.before.attachment.id}`,
  ]);
});
