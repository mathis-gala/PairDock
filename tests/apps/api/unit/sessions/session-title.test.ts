import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPreviewSelectionPrompt } from '@pairdock/shared-contracts';
import { buildSessionTitle } from '../../../../../apps/api/src/sessions/session-title.js';

test('session titles summarize the first request without quoted preview context', () => {
  const selection = {
    tagName: 'button',
    selector: '#submit',
    text: 'Envoyer',
    html: '<button>Envoyer</button>',
    url: 'https://preview.example.test/',
    rect: { x: 0, y: 0, width: 40, height: 40 },
    viewport: { width: 1280, height: 900 },
  };
  assert.equal(
    buildSessionTitle(buildPreviewSelectionPrompt('  Agrandis ce bouton.\n Rends-le bleu. ', [selection])),
    'Agrandis ce bouton. Rends-le bleu.',
  );
  assert.equal(buildSessionTitle(buildPreviewSelectionPrompt('', [selection]).trim()), 'Annotation de la preview');
  assert.equal(buildSessionTitle(null), null);
  assert.equal(buildSessionTitle('  '), null);
});

test('session titles remain bounded for long requests', () => {
  const title = buildSessionTitle('Une très longue demande '.repeat(30));
  assert.ok(title);
  assert.ok(title.length <= 120);
  assert.ok(title.endsWith('…'));
});
