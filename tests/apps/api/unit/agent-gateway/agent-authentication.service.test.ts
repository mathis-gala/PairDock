import assert from 'node:assert/strict';
import test from 'node:test';
import { AgentAuthenticationService } from '../../../../../apps/api/src/agent-gateway/agent-authentication.service.js';

const VALID_TOKEN = 'pairdock-agent-token-with-at-least-32-bytes';

test('production agent authentication rejects an invalid bearer token', () => {
  const authentication = new AgentAuthenticationService({
    nodeEnv: 'production',
    token: VALID_TOKEN,
  });

  assert.throws(
    () => authentication.assertAuthorized('Bearer invalid-agent-token-with-32-bytes'),
    /Invalid agent authentication token/,
  );
});

test('production API refuses to start without an agent authentication token', () => {
  assert.throws(
    () => new AgentAuthenticationService({ nodeEnv: 'production', token: undefined }),
    /AGENT_AUTH_TOKEN is required in production/,
  );
});
