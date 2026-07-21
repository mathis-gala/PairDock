import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertLocalDevelopmentSeedTarget,
  buildPmDemoSessions,
} from '../../../../../apps/api/src/development/pm-demo-seed.js';

test('PM demo seed refuses a production database', () => {
  assert.throws(
    () =>
      assertLocalDevelopmentSeedTarget({
        DATABASE_URL: 'postgresql://pairdock:secret@127.0.0.1:5432/pairdock',
        NODE_ENV: 'production',
      }),
    /refuses NODE_ENV=production/,
  );
});

test('PM demo seed accepts only loopback PostgreSQL databases', () => {
  assert.throws(
    () =>
      assertLocalDevelopmentSeedTarget({
        DATABASE_URL: 'postgresql://pairdock:secret@db.example.com:5432/pairdock',
        NODE_ENV: 'development',
      }),
    /local PostgreSQL database/,
  );

  const target = assertLocalDevelopmentSeedTarget({
    DATABASE_URL: 'postgresql://pairdock:secret@127.0.0.1:55432/pairdock',
    NODE_ENV: 'development',
  });

  assert.equal(target.hostname, '127.0.0.1');
  assert.equal(target.pathname, '/pairdock');
});

test('PM demo seed builds stable sessions covering the PM lifecycle', () => {
  const projectId = '11111111-1111-4111-8111-111111111111';
  const now = new Date('2026-07-21T12:00:00.000Z');

  const first = buildPmDemoSessions(projectId, now);
  const second = buildPmDemoSessions(projectId, now);

  assert.deepEqual(first, second);
  assert.deepEqual(
    first.map((session) => session.status),
    ['READY', 'AGENT_RUNNING', 'AWAITING_PM_VALIDATION', 'FAILED', 'REVIEW_REQUEST_CREATED', 'CLOSED'],
  );
  assert.equal(new Set(first.map((session) => session.id)).size, first.length);
  assert.ok(first.every((session) => session.messages.length >= 2));
  assert.ok(first.some((session) => session.validation?.status === 'passed'));
  assert.ok(first.some((session) => session.validation?.status === 'failed'));
  assert.ok(first.some((session) => session.reviewRequest !== null));
});
