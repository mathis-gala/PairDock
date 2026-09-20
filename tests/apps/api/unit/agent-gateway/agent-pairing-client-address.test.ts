import assert from 'node:assert/strict';
import test from 'node:test';
import { AgentPairingClientAddress } from '../../../../../apps/api/src/agent-onboarding/agent-pairing-client-address.js';
import { AgentPairingLimiter } from '../../../../../apps/api/src/agent-onboarding/agent-pairing-limiter.js';

test('pairing limits distinguish clients only behind explicitly trusted proxy peers', () => {
  const addresses = new AgentPairingClientAddress('172.20.0.3, ::1');
  assert.equal(addresses.resolve('::ffff:172.20.0.3', '198.51.100.1'), '198.51.100.1');
  assert.equal(addresses.resolve('172.20.0.4', '198.51.100.1'), '172.20.0.4');
  assert.equal(addresses.resolve('172.20.0.3', '198.51.100.1, 198.51.100.2'), '172.20.0.3');
  assert.equal(addresses.resolve('172.20.0.3', ['198.51.100.1', '198.51.100.2']), '172.20.0.3');
  assert.equal(new AgentPairingClientAddress('').resolve('172.20.0.3', '198.51.100.1'), '172.20.0.3');
  assert.throws(() => new AgentPairingClientAddress('172.20.0.0/16'), /exact IP/);

  const limiter = new AgentPairingLimiter();
  const first = addresses.resolve('172.20.0.3', '198.51.100.1');
  const second = addresses.resolve('172.20.0.3', '198.51.100.2');
  for (let attempt = 0; attempt < 30; attempt += 1) limiter.assertAllowed(first, 30, 0);
  assert.throws(() => limiter.assertAllowed(first, 30, 0), /Too many/);
  assert.doesNotThrow(() => limiter.assertAllowed(second, 30, 0));
  assert.doesNotThrow(() => limiter.assertAllowed(first, 30, 10 * 60 * 1_000));
});
