import assert from 'node:assert/strict';
import test from 'node:test';
import type { SessionStatus, ValidationRun } from '@pairdock/domain';
import { ValidationPolicy } from '../../../../../apps/api/src/validation/validation.policy.js';

function buildValidationRun(overrides: Partial<ValidationRun> = {}): ValidationRun {
  return {
    id: '4cb2f639-fde6-4d08-8a3c-d1d4f9011d76',
    sessionId: '0378e29f-4b36-4f5e-b5b2-f21965b1f724',
    status: 'passed',
    buildStatus: 'passed',
    testStatus: 'passed',
    lintStatus: 'passed',
    previewStatus: 'passed',
    logsRef: null,
    createdAt: new Date('2026-07-02T10:00:00.000Z'),
    ...overrides,
  };
}

test('BT-023: ValidationPolicy allows draft review request creation when every check passed and the session awaits PM validation', () => {
  const policy = new ValidationPolicy();
  const validationRun = buildValidationRun();

  assert.equal(policy.canCreateDraftReviewRequest(validationRun, 'AWAITING_PM_VALIDATION'), true);
  assert.deepEqual(policy.failureReasons(validationRun, 'AWAITING_PM_VALIDATION'), []);
});

test('BT-024: ValidationPolicy blocks draft review request creation with a readable reason when a check failed', () => {
  const policy = new ValidationPolicy();
  const validationRun = buildValidationRun({
    status: 'failed',
    lintStatus: 'failed',
  });

  assert.equal(policy.canCreateDraftReviewRequest(validationRun, 'AWAITING_PM_VALIDATION'), false);
  assert.deepEqual(policy.failureReasons(validationRun, 'AWAITING_PM_VALIDATION' satisfies SessionStatus), [
    'Lint validation must pass before creating a draft review request.',
  ]);
});
