import assert from 'node:assert/strict';
import test from 'node:test';
import { GoneException, HttpException } from '@nestjs/common';
import type { PairDockIdentity } from '@pairdock/domain';
import { ConnectedAgentsRegistry } from '../../../../../apps/api/src/agent-gateway/connected-agents.registry.js';
import { AgentOnboardingService } from '../../../../../apps/api/src/agent-onboarding/agent-onboarding.service.js';
import { AgentPairingLimiter } from '../../../../../apps/api/src/agent-onboarding/agent-pairing-limiter.js';
import type {
  AgentEnrollmentRepository,
  AgentPairingRecord,
  ClaimAgentPairingResult,
} from '../../../../../apps/api/src/persistence/ports/agent-enrollment.repository.js';

test('unknown device claims cannot exhaust pairing creation or developer approval', async () => {
  const enrollment = new EnrollmentStub();
  const onboarding = new AgentOnboardingService(
    enrollment,
    new ConnectedAgentsRegistry(),
    {} as never,
    new AgentPairingLimiter(),
  );
  const developer: PairDockIdentity = {
    id: '2cfc66c0-1942-40fb-bf77-9a28eb341798',
    kind: 'developer',
    email: 'developer@pairdock.test',
    displayName: 'Developer',
  };

  for (let attempt = 0; attempt < 9_995; attempt += 1) {
    await assert.rejects(
      onboarding.claim(String(attempt).padStart(43, 'A'), `192.0.2.${(attempt % 5) + 1}`),
      GoneException,
    );
  }

  const details = await onboarding.details(enrollment.pairing.userCode, developer);
  assert.equal(details.deviceName, 'Legitimate laptop');
  assert.deepEqual(await onboarding.approve(enrollment.pairing.userCode, developer), { approved: true });
  await onboarding.start('Another laptop', '198.51.100.1');
  assert.equal(enrollment.createdPairings, 1);
});

test('exhausting public limiter capacity preserves the authenticated approval budget', () => {
  const limiter = new AgentPairingLimiter();
  const now = 1_000;
  for (let bucket = 0; bucket < 10_000; bucket += 1) {
    limiter.assertAllowed(`public:${bucket}`, 1, now);
  }
  assert.throws(
    () => limiter.assertAllowed('new-public-client', 1, now),
    (error: unknown) => error instanceof HttpException && error.getStatus() === 429,
  );

  for (let attempt = 0; attempt < 30; attempt += 1) {
    assert.doesNotThrow(() => limiter.assertAllowed('approval:developer', 30, now, 'authenticated'));
  }
  assert.throws(
    () => limiter.assertAllowed('approval:developer', 30, now, 'authenticated'),
    (error: unknown) => error instanceof HttpException && error.getStatus() === 429,
  );
});

class EnrollmentStub implements AgentEnrollmentRepository {
  createdPairings = 0;
  readonly pairing: AgentPairingRecord = {
    id: '42bc26a9-b097-40ed-94a2-75d2b2dbccbd',
    deviceCodeHash: 'existing-device-hash',
    userCode: 'ABCDEFGH',
    deviceName: 'Legitimate laptop',
    expiresAt: new Date(Date.now() + 60_000),
    ownerUserId: null,
    approvedAt: null,
    claimedAt: null,
  };

  async createPairing() {
    this.createdPairings += 1;
  }

  async findPairing(userCode: string) {
    return userCode === this.pairing.userCode ? this.pairing : null;
  }

  async findPairingByDeviceCodeHash() {
    return null;
  }

  async approvePairing() {
    return true;
  }

  async claimPairing(): Promise<ClaimAgentPairingResult> {
    return { status: 'unavailable' };
  }

  async findCredentialByHash() {
    return null;
  }

  async findCredentialByAgentId() {
    return null;
  }

  async listAgents() {
    return [];
  }

  async revokeAgent() {
    return false;
  }
}
