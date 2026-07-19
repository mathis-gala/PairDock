import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PreviewToolbar } from '../../../../apps/web/src/components/pm-session/preview-toolbar.js';

test('preview presets are exposed as accessible icon buttons instead of a select', () => {
  const html = renderToStaticMarkup(
    createElement(PreviewToolbar, {
      onPresetChange: () => undefined,
      presetId: 'tablet',
      previewUrl: null,
    }),
  );

  assert.doesNotMatch(html, /<select/);
  assert.match(html, />Desktop</);
  assert.match(html, />Laptop</);
  assert.match(html, />Tablet</);
  assert.match(html, />Mobile</);
  assert.match(html, /aria-pressed="true"[^>]*>.*Tablet/s);
  assert.match(html, /<svg/);
});
