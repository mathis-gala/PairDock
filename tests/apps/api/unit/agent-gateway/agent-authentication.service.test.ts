import assert from 'node:assert/strict';
import test from 'node:test';
import { AgentAuthenticationService } from '../../../../../apps/api/src/agent-gateway/agent-authentication.service.js';

const VALID_TOKEN = 'pairdock-agent-token-with-at-least-32-bytes';
const SECOND_VALID_TOKEN = 'second-agent-token-with-at-least-32-bytes';

test('production agent authentication rejects an invalid bearer token', async () => {
  const authentication = new AgentAuthenticationService({
    nodeEnv: 'production',
    credentials: { 'agent-local-1': { token: VALID_TOKEN, projectKeys: ['pairdock'] } },
  });

  await assert.rejects(
    () => authentication.authenticate('Bearer invalid-agent-token-with-32-bytes'),
    /Invalid agent authentication token/,
  );
});

test('agent authentication resolves the identity bound to each bearer token', async () => {
  const authentication = new AgentAuthenticationService({
    nodeEnv: 'production',
    credentials: {
      'agent-local-1': { token: VALID_TOKEN, projectKeys: ['pairdock'] },
      'agent-local-2': { token: SECOND_VALID_TOKEN, projectKeys: ['tcg'] },
    },
  });

  assert.deepEqual(await authentication.authenticate(`Bearer ${VALID_TOKEN}`), {
    agentId: 'agent-local-1',
    projectKeys: ['pairdock'],
  });
  assert.deepEqual(await authentication.authenticate(`Bearer ${SECOND_VALID_TOKEN}`), {
    agentId: 'agent-local-2',
    projectKeys: ['tcg'],
  });
});

test('production API permits self-service enrollment without allowing unauthenticated agents', async () => {
  const authentication = new AgentAuthenticationService({ nodeEnv: 'production', credentials: {} });
  await assert.rejects(() => authentication.authenticate(undefined), /Missing agent authentication token/);
});

test('agent authentication rejects duplicate, short, and malformed credentials', () => {
  assert.throws(
    () =>
      new AgentAuthenticationService({
        credentials: {
          'agent-local-1': { token: VALID_TOKEN, projectKeys: ['pairdock'] },
          'agent-local-2': { token: VALID_TOKEN, projectKeys: ['tcg'] },
        },
      }),
    /must be unique/,
  );
  assert.throws(
    () =>
      new AgentAuthenticationService({
        credentials: { 'agent-local-1': { token: 'too-short', projectKeys: ['pairdock'] } },
      }),
    /at least 32 bytes/,
  );
  assert.throws(() => new AgentAuthenticationService({ credentialsJson: '[]' }), /JSON object/);
  assert.throws(
    () =>
      new AgentAuthenticationService({
        credentials: {
          'agent-local-1': { token: VALID_TOKEN, projectKeys: ['pairdock'] },
          'agent-local-2': { token: SECOND_VALID_TOKEN, projectKeys: ['pairdock'] },
        },
      }),
    /assigned to exactly one credential/,
  );
});
