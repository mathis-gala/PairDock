import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PromptComposer } from '../../../../apps/web/src/components/pm-session/prompt-composer.js';

test('PM prompt composer explains why sending is temporarily unavailable', () => {
  Object.assign(globalThis, { React });

  const html = renderToStaticMarkup(
    <PromptComposer
      blockedReason="L’agent termine la vérification avant le prochain message."
      canCancel={false}
      canSubmit={false}
      isCancelling={false}
      isSubmitting={false}
      onCancel={async () => undefined}
      onSubmit={async () => undefined}
    />,
  );

  assert.match(html, /L’agent termine la vérification avant le prochain message\./);
  assert.match(html, /<button[^>]*disabled[^>]*type="submit"/);
  assert.match(html, /<textarea/);
  assert.doesNotMatch(html, /<textarea[^>]*disabled/);
  assert.match(html, /Ajouter une capture/);
  assert.match(html, /⌘V \/ Ctrl\+V pour coller/);
  assert.match(html, /accept="image\/png,image\/jpeg,image\/webp"/);
  assert.match(html, /multiple=""[^>]*type="file"/);
  const screenshotInput = html.match(/<input[^>]*type="file"[^>]*>/)?.[0] ?? '';
  assert.doesNotMatch(screenshotInput, /disabled/);
});
