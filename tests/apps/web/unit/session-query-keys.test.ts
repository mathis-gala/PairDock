import assert from 'node:assert/strict';
import test from 'node:test';
import { sessionQueryKeys } from '../../../../apps/web/src/lib/session-query-keys.js';

test('session and private attachment caches are isolated by authenticated identity', () => {
  const firstIdentity = sessionQueryKeys.attachment(
    'token-for-first-user',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
  );
  const secondIdentity = sessionQueryKeys.attachment(
    'token-for-second-user',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
  );

  assert.notDeepEqual(firstIdentity, secondIdentity);
  assert.notDeepEqual(
    sessionQueryKeys.messages('token-for-first-user', '11111111-1111-4111-8111-111111111111'),
    sessionQueryKeys.messages('token-for-second-user', '11111111-1111-4111-8111-111111111111'),
  );
});
