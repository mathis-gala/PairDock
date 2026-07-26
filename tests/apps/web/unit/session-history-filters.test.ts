import assert from 'node:assert/strict';
import test from 'node:test';
import type { SharedSessionHistoryItem } from '@pairdock/shared-contracts';
import { filterSharedSessionHistory } from '../../../../apps/web/src/lib/session-history-filters.js';

const sessions: SharedSessionHistoryItem[] = [
  buildSession({
    id: '11111111-1111-4111-8111-111111111111',
    projectId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    projectName: 'PairDock',
    status: 'READY',
  }),
  buildSession({
    id: '22222222-2222-4222-8222-222222222222',
    projectId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    projectName: 'PairDock',
    status: 'CLOSED',
  }),
  buildSession({
    id: '33333333-3333-4333-8333-333333333333',
    projectId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    projectName: 'Storefront',
    status: 'FAILED',
  }),
];

test('session history shows every PM-owned session when filters are on all', () => {
  assert.deepEqual(
    filterSharedSessionHistory(sessions, { projectId: 'all', status: 'all' }).map((session) => session.id),
    sessions.map((session) => session.id),
  );
});

test('session history filters PM-owned sessions by project', () => {
  assert.deepEqual(
    filterSharedSessionHistory(sessions, {
      projectId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      status: 'all',
    }).map((session) => session.id),
    ['33333333-3333-4333-8333-333333333333'],
  );
});

test('session history opened filter excludes only closed sessions', () => {
  assert.deepEqual(
    filterSharedSessionHistory(sessions, { projectId: 'all', status: 'opened' }).map((session) => session.id),
    ['11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333'],
  );
});

test('session history closed filter returns only closed sessions', () => {
  assert.deepEqual(
    filterSharedSessionHistory(sessions, { projectId: 'all', status: 'closed' }).map((session) => session.id),
    ['22222222-2222-4222-8222-222222222222'],
  );
});

function buildSession(
  input: Pick<SharedSessionHistoryItem, 'id' | 'projectId' | 'projectName' | 'status'>,
): SharedSessionHistoryItem {
  return {
    ...input,
    repoFullName: `mathis-gala/${input.projectName}`,
    reviewRequest: null,
    createdAt: '2026-07-26T10:00:00.000Z',
    closedAt: input.status === 'CLOSED' ? '2026-07-26T11:00:00.000Z' : null,
  };
}
