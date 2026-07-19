import assert from 'node:assert/strict';
import test from 'node:test';
import { createDeveloperProjectInputSchema } from '@pairdock/shared-contracts';

const validProjectInput = {
  agentProjectKey: 'tcg',
  defaultBranch: 'main',
  defaultModelId: 'gpt-5.5',
  defaultReasoningEffort: 'low',
  name: 'TCG Collection',
  repoFullName: 'mathis-gala/Booster-Break',
};

test('project creation contract never accepts a client-selected GitHub installation', () => {
  assert.equal(createDeveloperProjectInputSchema.safeParse(validProjectInput).success, true);
  assert.equal(
    createDeveloperProjectInputSchema.safeParse({
      ...validProjectInput,
      sourceControl: {
        accountLogin: 'attacker',
        providerConnectionId: 'victim-installation',
      },
    }).success,
    false,
  );
});

test('project creation requires developer-owned model and reasoning defaults', () => {
  assert.equal(createDeveloperProjectInputSchema.safeParse(validProjectInput).success, true);
  const { defaultReasoningEffort: _, ...missingReasoningDefault } = validProjectInput;

  assert.equal(createDeveloperProjectInputSchema.safeParse(missingReasoningDefault).success, false);
});
