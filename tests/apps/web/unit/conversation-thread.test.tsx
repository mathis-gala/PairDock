import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConversationThread } from '../../../../apps/web/src/components/pm-session/conversation-thread.js';
import { buildPreviewSelectionPrompt } from '../../../../apps/web/src/lib/preview-selection-prompt.js';
import {
  buildSessionConversation,
  type SessionConversationItem,
} from '../../../../apps/web/src/lib/session-conversation.js';

const LONG_PATH_ITEM: SessionConversationItem = {
  id: 'message:1',
  role: 'assistant',
  kind: 'message',
  text: '/Users/mathis/.pairdock/worktrees/session/apps/web/src/features/dashboard/components/ConfettiButton.tsx',
  tone: 'default',
  createdAt: '2026-07-26T12:00:00.000Z',
};

test('multipart selection context renders as numbered disclosures without printing the raw prompt payload', async () => {
  const selection = {
    tagName: 'button',
    selector: '#start-trial',
    text: 'Commencer <img src=x onerror=alert(1)>',
    html: '<button id="start-trial">Commencer</button>',
    url: 'https://preview.example.test/',
    rect: { x: 10, y: 20, width: 100, height: 40 },
    viewport: { width: 1280, height: 900 },
  };
  const form = new FormData();
  form.set(
    'content',
    buildPreviewSelectionPrompt('Rends ce bouton visible.', [selection, { ...selection, selector: '#secondary' }]),
  );
  const request = new Request('http://api.example.test/prompts', { method: 'POST', body: form });
  const content = (await request.formData()).get('content');
  assert.equal(typeof content, 'string');
  if (typeof content !== 'string') throw new Error('Missing prompt text');
  const items = buildSessionConversation(
    [
      {
        id: '22222222-2222-4222-8222-222222222222',
        sessionId: '11111111-1111-4111-8111-111111111111',
        userId: null,
        role: 'pm',
        content,
        attachments: [],
        createdAt: '2026-07-18T10:00:00.000Z',
      },
    ],
    [],
  );
  const html = renderToStaticMarkup(createElement(ConversationThread, { isTyping: false, items }));

  assert.match(html, /Rends ce bouton visible\./);
  assert.match(html, /Sélection 1/);
  assert.match(html, /Sélection 2/);
  assert.equal(html.match(/<details[ >]/g)?.length, 2);
  assert.doesNotMatch(html, /<details[^>]*\sopen[ =>]/);
  assert.doesNotMatch(html, /instantané non fiable|```json|&quot;viewport&quot;/);
  assert.doesNotMatch(html, /<img\s/);
  assert.match(html, /Commencer &lt;img/);
});

test('conversation messages wrap long paths inside their bubble', () => {
  const html = renderToStaticMarkup(
    createElement(ConversationThread, {
      isTyping: false,
      items: [LONG_PATH_ITEM],
    }),
  );

  assert.ok(html.includes('[overflow-wrap:anywhere]'));
  assert.ok(html.includes('min-w-0'));
});

test('conversation shows an accessible typing indicator only while the agent writes', () => {
  const workingHtml = renderToStaticMarkup(
    createElement(ConversationThread, {
      isTyping: true,
      items: [LONG_PATH_ITEM],
    }),
  );
  const idleHtml = renderToStaticMarkup(
    createElement(ConversationThread, {
      isTyping: false,
      items: [LONG_PATH_ITEM],
    }),
  );

  assert.match(workingHtml, /role="status"/);
  assert.match(workingHtml, /L’agent rédige une réponse\./);
  assert.equal(workingHtml.match(/pd-typing-dot/g)?.length, 3);
  assert.doesNotMatch(idleHtml, /role="status"/);
});

test('completed progress is collapsed without hiding the answer or errors', () => {
  const html = renderToStaticMarkup(
    createElement(ConversationThread, {
      isTyping: false,
      items: [
        { ...LONG_PATH_ITEM, id: 'step:1', kind: 'progress', text: 'Lecture des fichiers.' },
        { ...LONG_PATH_ITEM, id: 'step:2', kind: 'progress', text: 'Mise à jour du bouton.' },
        { ...LONG_PATH_ITEM, id: 'answer', text: 'Le bouton est maintenant plus visible.' },
        { ...LONG_PATH_ITEM, id: 'error', tone: 'error', text: 'La validation a échoué.' },
      ],
    }),
  );

  assert.match(html, /<summary[^>]*>.*2 étapes de travail/s);
  assert.doesNotMatch(html, /<details[^>]*\sopen[ =>]/);
  const afterProgress = html.slice(html.indexOf('</details>') + '</details>'.length);
  assert.match(afterProgress, /Le bouton est maintenant plus visible\./);
  assert.match(afterProgress, /La validation a échoué\./);
});

test('the latest work remains visible while previous steps are collapsed', () => {
  const html = renderToStaticMarkup(
    createElement(ConversationThread, {
      isTyping: true,
      items: [
        { ...LONG_PATH_ITEM, id: 'step:1', kind: 'progress', text: 'Lecture des fichiers.' },
        { ...LONG_PATH_ITEM, id: 'step:2', kind: 'progress', text: 'Vérification du bouton.' },
      ],
    }),
  );
  assert.match(html, /1 étape de travail/);
  const afterProgress = html.slice(html.indexOf('</details>') + '</details>'.length);
  assert.match(afterProgress, /En cours/);
  assert.match(afterProgress, /Vérification du bouton\./);
});
