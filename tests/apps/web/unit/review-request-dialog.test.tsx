import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReviewRequestDialog } from '../../../../apps/web/src/components/pm-session/review-request-dialog.js';

test('review request dialog collects type, title, and description accessibly', () => {
  const html = renderToStaticMarkup(
    createElement(ReviewRequestDialog, {
      error: null,
      isSubmitting: false,
      onClose: () => undefined,
      onSubmit: async () => undefined,
    }),
  );

  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /Feature/);
  assert.match(html, /Fix/);
  assert.match(html, /Titre de la PR/);
  assert.match(html, /Description de la PR/);
  assert.match(html, /Créer la draft PR/);
});
