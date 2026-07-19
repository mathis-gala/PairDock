import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSessionConversation } from '../../../../apps/web/src/lib/session-conversation.js';

const sessionId = '11111111-1111-4111-8111-111111111111';

test('PM conversation contains human messages and agent replies, not technical events', () => {
  const items = buildSessionConversation(
    [
      {
        id: '22222222-2222-4222-8222-222222222222',
        sessionId,
        userId: '33333333-3333-4333-8333-333333333333',
        role: 'pm',
        content: 'Corrige le bouton panier.',
        createdAt: '2026-07-18T10:00:00.000Z',
      },
    ],
    [
      {
        id: '44444444-4444-4444-8444-444444444444',
        sessionId,
        agentId: 'local-agent',
        type: 'session.progress',
        payload: { status: 'AGENT_RUNNING' },
        createdAt: '2026-07-18T10:00:01.000Z',
      },
      {
        id: '55555555-5555-4555-8555-555555555555',
        sessionId,
        agentId: 'local-agent',
        type: 'agent.output',
        payload: { stream: 'stdout', text: 'Je corrige le panier.' },
        createdAt: '2026-07-18T10:00:02.000Z',
      },
      {
        id: '66666666-6666-4666-8666-666666666666',
        sessionId,
        agentId: 'local-agent',
        type: 'git.diff',
        payload: { diff: 'secret technical diff', changedFiles: ['cart.ts'] },
        createdAt: '2026-07-18T10:00:03.000Z',
      },
    ],
  );

  assert.deepEqual(
    items.map(({ role, text }) => ({ role, text })),
    [
      { role: 'user', text: 'Corrige le bouton panier.' },
      { role: 'assistant', text: 'Je corrige le panier.' },
    ],
  );
});

test('raw Codex compatibility stderr becomes a useful PM-facing error', () => {
  const items = buildSessionConversation(
    [],
    [
      {
        id: '77777777-7777-4777-8777-777777777777',
        sessionId,
        agentId: 'local-agent',
        type: 'agent.output',
        payload: {
          stream: 'stderr',
          text: 'ERROR: {"type":"error","status":400,"error":{"type":"invalid_request_error","message":"The \'gpt-5.6-luna\' model requires a newer version of Codex. Please upgrade to the latest app or CLI and try again."}}\n',
        },
        createdAt: '2026-07-18T10:00:00.000Z',
      },
    ],
  );

  assert.equal(items.length, 1);
  assert.equal(items[0]?.tone, 'error');
  assert.match(items[0]?.text ?? '', /agent local doit être mis à jour/i);
  assert.match(items[0]?.text ?? '', /gpt-5\.6-luna/);
  assert.doesNotMatch(items[0]?.text ?? '', /\{"type"/);
});

test('failed validation becomes an actionable PM-facing conversation message', () => {
  const items = buildSessionConversation(
    [],
    [
      {
        id: '88888888-8888-4888-8888-888888888888',
        sessionId,
        agentId: 'local-agent',
        type: 'checks.result',
        payload: {
          sessionId,
          ok: false,
          build: { status: 'passed' },
          tests: {
            status: 'failed',
            logs: "error: Cannot find module '.prisma/client/default'",
          },
          lint: { status: 'passed' },
          preview: { status: 'passed' },
        },
        createdAt: '2026-07-18T10:00:00.000Z',
      },
    ],
  );

  assert.equal(items.length, 1);
  assert.equal(items[0]?.tone, 'error');
  assert.match(items[0]?.text ?? '', /validation.*tests/i);
  assert.match(items[0]?.text ?? '', /Cannot find module '.prisma\/client\/default'/);
  assert.match(items[0]?.text ?? '', /renvoyer un message/i);
});
