import assert from 'node:assert/strict';
import test from 'node:test';
import { GithubAuthStateService } from '../../../../../apps/api/src/auth/github-auth-state.service.js';

test('GitHub auth state preserves the installation across a signed, purpose-bound OAuth handoff', () => {
  const state = new GithubAuthStateService({
    now: () => Date.parse('2026-07-18T12:00:00.000Z'),
    secret: 'pairdock-test-state-secret-at-least-32-bytes',
    ttlMs: 10 * 60 * 1000,
  });

  const installationState = state.issueInstallationState();
  assert.doesNotThrow(() => state.verifyInstallationState(installationState));

  const authorizationState = state.issueAuthorizationState('98765');
  assert.equal(state.verifyAuthorizationState(authorizationState), '98765');
  assert.throws(() => state.verifyInstallationState(authorizationState), /Invalid GitHub authentication state/);
});
