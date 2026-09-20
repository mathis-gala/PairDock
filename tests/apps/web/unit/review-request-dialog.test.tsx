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
  assert.match(html, /Fonctionnalité/);
  assert.match(html, /Correction/);
  assert.match(html, /Style/);
  assert.match(html, /Titre de la PR/);
  assert.match(html, /Description de la PR/);
  assert.match(html, /Captures pour GitHub/);
  assert.match(html, /⌘V \/ Ctrl\+V pour coller/);
  assert.match(html, /accept="image\/png,image\/jpeg,image\/webp"/);
  assert.match(html, /Créer la PR/);
});

test('PR dialog displays an editable draft and prevents submission after the session becomes unavailable', () => {
  const html = renderToStaticMarkup(
    createElement(ReviewRequestDialog, {
      error: null,
      initialValues: { type: 'fix', title: 'Corriger le panier', description: 'Tests : Non exécuté' },
      blockedReason: 'L’agent est hors ligne. Attends sa reconnexion.',
      isSubmitting: false,
      onClose: () => undefined,
      onSubmit: async () => undefined,
    }),
  );
  assert.match(html, /value="Corriger le panier"/);
  assert.match(html, /Tests : Non exécuté<\/textarea>/);
  assert.match(html, /L’agent est hors ligne/);
  assert.match(html, /<button[^>]*disabled=""[^>]*type="submit"/);
  assert.doesNotMatch(html, /<textarea[^>]*(?:readonly|disabled)/);
});

test('initial captures do not allocate preview URLs before the dialog mounts', (context) => {
  const createObjectURL = context.mock.method(URL, 'createObjectURL', () => {
    throw new Error('Preview allocated during render');
  });
  const initialScreenshots = [new File(['before'], 'avant.png', { type: 'image/png' })];
  const html = renderToStaticMarkup(
    createElement(ReviewRequestDialog, {
      error: null,
      initialScreenshots,
      isSubmitting: false,
      initialValues: { type: 'feat', title: 'Agrandir le bouton', description: 'À vérifier.' },
      onClose: () => undefined,
      onSubmit: async () => undefined,
    }),
  );
  assert.equal(createObjectURL.mock.callCount(), 0);
  assert.match(html, /value="Agrandir le bouton"/);
});
