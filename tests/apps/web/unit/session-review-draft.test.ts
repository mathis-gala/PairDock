import assert from 'node:assert/strict';
import test from 'node:test';
import { createReviewRequestInputSchema } from '@pairdock/shared-contracts';
import { buildPreviewSelectionPrompt } from '../../../../apps/web/src/lib/preview-selection-prompt.js';
import type { SessionConversationItem } from '../../../../apps/web/src/lib/session-conversation.js';
import { buildSessionReviewDraft } from '../../../../apps/web/src/lib/session-review-draft.js';

test('PR draft uses the actual request and diff, strips selection payloads, and preserves skipped checks', () => {
  const request = buildPreviewSelectionPrompt('Agrandir le bouton du panier', [
    {
      url: 'https://preview.example.test/cart',
      selector: '#cart',
      tagName: 'button',
      html: '<button>Acheter</button>',
      text: 'Acheter',
      rect: { x: 1, y: 2, width: 30, height: 20 },
      viewport: { width: 1280, height: 800 },
    },
  ]);
  const conversation: SessionConversationItem[] = [
    { id: 'pm-1', role: 'user', kind: 'message', text: request, createdAt: '2026-09-20', tone: 'default' },
    {
      id: 'agent-1',
      role: 'assistant',
      kind: 'message',
      text: 'Tout fonctionne, tests réussis.',
      createdAt: '2026-09-20',
      tone: 'default',
    },
  ];
  const draft = buildSessionReviewDraft({
    projectName: 'Boutique',
    conversation,
    changedFiles: ['src/cart.tsx'],
    sessionStatus: 'AWAITING_PM_VALIDATION',
    validation: {
      status: 'passed',
      buildStatus: 'passed',
      testStatus: 'skipped',
      lintStatus: null,
      previewStatus: 'passed',
    },
  });

  assert.equal(draft.title, 'Agrandir le bouton du panier');
  assert.match(draft.description, /src\/cart.tsx/);
  assert.match(draft.description, /Tests : Non exécuté/);
  assert.match(draft.description, /Analyse du code : Non renseigné/);
  assert.doesNotMatch(draft.description, /selected-button|preview.example|selector|Tout fonctionne|tests réussis/);
});

test('large session histories produce bounded drafts without dropping the validation disclosure', () => {
  const conversation: SessionConversationItem[] = Array.from({ length: 20 }, (_, index) => ({
    id: String(index),
    role: 'user',
    kind: 'message',
    text: 'Une demande détaillée. '.repeat(100),
    createdAt: '2026-09-20',
    tone: 'default',
  }));
  const draft = buildSessionReviewDraft({
    projectName: 'Projet',
    conversation,
    changedFiles: Array.from({ length: 200 }, (_, index) => `src/${'nested/'.repeat(20)}file-${index}.ts`),
    sessionStatus: 'AGENT_RUNNING',
    validation: null,
  });
  assert.equal(createReviewRequestInputSchema.safeParse(draft).success, true);
  assert.match(draft.description, /Aucun résultat de validation reçu/);
  assert.match(draft.description, /ne valident pas encore les nouvelles modifications/);
  assert.match(draft.description, /Vérification visuelle/);
});
