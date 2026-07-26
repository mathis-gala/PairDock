import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConversationThread } from '../../../../apps/web/src/components/pm-session/conversation-thread.js';
import type { SessionConversationItem } from '../../../../apps/web/src/lib/session-conversation.js';

const LONG_PATH_ITEM: SessionConversationItem = {
  id: 'message:1',
  role: 'assistant',
  kind: 'message',
  text: '/Users/mathis/.pairdock/worktrees/session/apps/web/src/features/dashboard/components/ConfettiButton.tsx',
  tone: 'default',
  createdAt: '2026-07-26T12:00:00.000Z',
};

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
