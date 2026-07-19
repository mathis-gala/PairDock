import assert from 'node:assert/strict';
import test from 'node:test';
import { UnauthorizedException } from '@nestjs/common';
import { AuthTokenService } from '../../../../../apps/api/src/auth/auth-token.service.js';

const user = {
  displayName: 'Mathis',
  email: 'mathis@example.com',
  id: '10000000-0000-4000-8000-000000000001',
  kind: 'developer' as const,
};

test('PairDock auth tokens remain verifiable across instances sharing the production secret', () => {
  const options = {
    now: () => Date.parse('2026-07-18T12:00:00.000Z'),
    secret: 'pairdock-test-token-secret-at-least-32-bytes',
    ttlMs: 60 * 60 * 1000,
  };
  const issuer = new AuthTokenService(options);
  const verifier = new AuthTokenService(options);

  assert.deepEqual(verifier.verify(issuer.issue(user)), user);
});

test('PairDock auth tokens reject expiration and malformed signature lengths as 401 errors', () => {
  let now = Date.parse('2026-07-18T12:00:00.000Z');
  const tokens = new AuthTokenService({
    now: () => now,
    secret: 'pairdock-test-token-secret-at-least-32-bytes',
    ttlMs: 1000,
  });
  const token = tokens.issue(user);

  now += 1001;
  assert.throws(() => tokens.verify(token), UnauthorizedException);
  assert.throws(() => tokens.verify(`${token.split('.')[0]}.x`), UnauthorizedException);
});
