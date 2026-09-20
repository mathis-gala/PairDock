import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PreviewFrame } from '../../../../apps/web/src/components/pm-session/preview-frame.js';

test('preview frame communicates preparation only while an online agent prepares the session', () => {
  for (const sessionStatus of [
    'CREATED',
    'AGENT_CONNECTING',
    'WORKTREE_CREATING',
    'DOCKER_STARTING',
    'PREVIEW_STARTING',
  ]) {
    const html = renderToStaticMarkup(
      createElement(PreviewFrame, {
        agentAvailability: 'online',
        presetId: 'desktop',
        previewUrl: null,
        sessionStatus,
      }),
    );

    assert.match(html, /role="status"/, sessionStatus);
    assert.match(html, /animate-spin/, sessionStatus);
    assert.match(html, /agent local prépare l’aperçu/, sessionStatus);
    assert.doesNotMatch(html, /<iframe/, sessionStatus);
  }
});

test('an offline agent does not leave a missing preview in a loading state', () => {
  const html = renderToStaticMarkup(
    createElement(PreviewFrame, {
      agentAvailability: 'offline',
      presetId: 'desktop',
      previewUrl: null,
      sessionStatus: 'PREVIEW_STARTING',
    }),
  );

  assert.match(html, /role="status"/);
  assert.match(html, /agent local est hors ligne/);
  assert.doesNotMatch(html, /animate-spin|agent local prépare|<iframe/);
});

test('an absent preview explains the session state without implying preparation', () => {
  for (const [sessionStatus, expectedMessage] of [
    ['FAILED', /La session a rencontré une erreur/],
    ['CLOSING', /Fermeture de la session/],
    ['CLOSED', /Session terminée/],
    ['READY', /Aucune URL d’aperçu/],
    ['AGENT_RUNNING', /Aucune URL d’aperçu/],
    ['UNKNOWN', /Aucune URL d’aperçu/],
  ] as const) {
    const html = renderToStaticMarkup(
      createElement(PreviewFrame, {
        agentAvailability: 'online',
        presetId: 'desktop',
        previewUrl: null,
        sessionStatus,
      }),
    );

    assert.match(html, expectedMessage, sessionStatus);
    assert.doesNotMatch(html, /animate-spin|agent local prépare|<iframe/, sessionStatus);
  }
});

test('closing and closed sessions hide a saved preview URL even when the agent is offline', () => {
  for (const sessionStatus of ['CLOSING', 'CLOSED']) {
    const html = renderToStaticMarkup(
      createElement(PreviewFrame, {
        agentAvailability: 'offline',
        presetId: 'desktop',
        previewUrl: 'https://preview.example/session',
        sessionStatus,
      }),
    );

    assert.match(html, /Fermeture de la session|Session terminée/, sessionStatus);
    assert.doesNotMatch(html, /<iframe|preview\.example|animate-spin|hors ligne/, sessionStatus);
  }
});

test('an existing preview stays available with an accessible warning when its current state is uncertain', () => {
  for (const [sessionStatus, agentAvailability, expectedMessage] of [
    ['READY', 'offline', /agent local est hors ligne/],
    ['FAILED', 'online', /session a rencontré une erreur/],
    ['AGENT_RUNNING', 'online', /Travail en cours/],
    ['CHECKS_RUNNING', 'online', /Vérifications en cours/],
  ] as const) {
    const html = renderToStaticMarkup(
      createElement(PreviewFrame, {
        agentAvailability,
        presetId: 'desktop',
        previewUrl: 'https://preview.example/session',
        sessionStatus,
      }),
    );

    assert.match(html, /<iframe[^>]+src="https:\/\/preview\.example\/session"/);
    assert.match(html, /role="status"/);
    assert.match(html, expectedMessage, sessionStatus);
    assert.match(html, /version antérieure/, sessionStatus);
    assert.doesNotMatch(html, /animate-spin/, sessionStatus);
  }
});

test('a preview awaiting PM validation is shown without claiming a loading or failure state', () => {
  const html = renderToStaticMarkup(
    createElement(PreviewFrame, {
      agentAvailability: 'online',
      presetId: 'desktop',
      previewUrl: 'https://preview.example/session',
      sessionStatus: 'AWAITING_PM_VALIDATION',
    }),
  );

  assert.match(html, /<iframe[^>]+src="https:\/\/preview\.example\/session"/);
  assert.doesNotMatch(html, /animate-spin|version antérieure|indisponible|rencontré une erreur/);
});
