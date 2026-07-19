import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PreviewFrame } from '../../../../apps/web/src/components/pm-session/preview-frame.js';

test('preview frame communicates that the local preview is loading', () => {
  const html = renderToStaticMarkup(createElement(PreviewFrame, { presetId: 'desktop', previewUrl: null }));

  assert.match(html, /role="status"/);
  assert.match(html, /animate-spin/);
  assert.match(html, /agent local prépare la preview/);
  assert.doesNotMatch(html, /<iframe/);
});
