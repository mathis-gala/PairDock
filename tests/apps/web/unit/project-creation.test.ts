import assert from 'node:assert/strict';
import test from 'node:test';
import type { CreateDeveloperProjectInput, DeveloperProjectSetup } from '@pairdock/shared-contracts';
import { resolveProjectCreation } from '../../../../apps/web/src/lib/project-creation.js';

const setup: DeveloperProjectSetup = {
  repositories: [
    { fullName: 'team/storefront', name: 'storefront', defaultBranch: 'main', branches: ['main', 'develop'] },
  ],
  agents: [
    {
      agentId: 'macbook',
      capabilities: ['session.prepare'],
      models: [
        {
          id: 'agent/model',
          label: 'Published model',
          provider: 'local',
          reasoningEfforts: [
            { id: 'low', label: 'Low' },
            { id: 'high', label: 'High' },
          ],
          defaultReasoningEffort: 'high',
        },
      ],
      projects: [
        {
          key: 'storefront-local',
          name: 'Local storefront',
          repoFullName: 'team/storefront',
          pathAlias: 'Projects/storefront',
          defaultBranch: 'develop',
          models: ['agent/model'],
          readiness: null,
        },
      ],
    },
  ],
};

test('loading setup later resolves real project defaults while preserving deliberate edits', () => {
  const edits: Partial<CreateDeveloperProjectInput> = { description: 'PM workspace', pmCanStartSessions: false };
  const loading = resolveProjectCreation(null, edits);
  assert.equal(loading.canCreate, false);
  assert.equal(loading.values.name, '');
  assert.equal(loading.values.defaultReasoningEffort, '');

  const ready = resolveProjectCreation(setup, edits);
  assert.equal(ready.canCreate, true);
  assert.deepEqual(ready.values, {
    name: 'Local storefront',
    description: 'PM workspace',
    repoFullName: 'team/storefront',
    agentProjectKey: 'storefront-local',
    defaultBranch: 'develop',
    defaultModelId: 'agent/model',
    defaultReasoningEffort: 'high',
    pmCanStartSessions: false,
  });
  assert.equal(ready.selectedAgentProject?.pathAlias, 'Projects/storefront');
  assert.equal(resolveProjectCreation(setup, { name: '' }).canCreate, false);
});

test('an exact desktop handoff disambiguates repositories while unknown or ambiguous handoffs select nothing', () => {
  const multiple = structuredClone(setup);
  multiple.repositories.push({ fullName: 'team/docs', name: 'docs', defaultBranch: 'main', branches: ['main'] });
  multiple.agents[0].projects.push({
    key: 'docs-local',
    name: 'Documentation',
    repoFullName: 'team/docs',
    pathAlias: 'Projects/docs',
    readiness: null,
  });

  const ambiguous = resolveProjectCreation(multiple, {});
  assert.equal(ambiguous.values.repoFullName, '');
  assert.equal(ambiguous.canCreate, false);

  const handoff = resolveProjectCreation(multiple, {}, 'docs-local');
  assert.equal(handoff.values.repoFullName, 'team/docs');
  assert.equal(handoff.values.agentProjectKey, 'docs-local');
  assert.equal(handoff.values.name, 'Documentation');
  assert.equal(handoff.canCreate, true);
  assert.equal(handoff.handoffUnavailable, false);

  const staleHandoff = resolveProjectCreation(setup, {}, 'removed-project');
  assert.equal(staleHandoff.handoffUnavailable, true);
  assert.equal(staleHandoff.selectedAgentProject, null);
  assert.equal(staleHandoff.values.repoFullName, '');
  assert.equal(staleHandoff.canCreate, false);
  assert.equal(resolveProjectCreation(null, {}, 'docs-local').handoffUnavailable, false);

  multiple.agents[0].projects.push({ ...multiple.agents[0].projects[1], key: 'storefront-local' });
  const duplicateKey = resolveProjectCreation(multiple, {}, 'storefront-local');
  assert.equal(duplicateKey.handoffUnavailable, true);
  assert.equal(duplicateKey.selectedRepository, null);
});

test('only the repository with a local project is inferred without choosing between multiple local projects', () => {
  const choices = structuredClone(setup);
  choices.repositories.push({ fullName: 'team/docs', name: 'docs', defaultBranch: 'main', branches: ['main'] });
  assert.equal(resolveProjectCreation(choices, {}).values.repoFullName, 'team/storefront');

  choices.agents[0].projects.push({ ...choices.agents[0].projects[0], key: 'second-clone' });
  const ambiguous = resolveProjectCreation(choices, {});
  assert.equal(ambiguous.values.repoFullName, 'team/storefront');
  assert.equal(ambiguous.values.agentProjectKey, '');
  assert.equal(ambiguous.canCreate, false);

  const explicit = resolveProjectCreation(choices, { agentProjectKey: 'second-clone' });
  assert.equal(explicit.canCreate, true);
  assert.equal(explicit.values.agentProjectKey, 'second-clone');
  assert.equal(resolveProjectCreation(choices, { repoFullName: '' }).selectedRepository, null);

  const noLocalProject = resolveProjectCreation({ repositories: setup.repositories, agents: [] }, {});
  assert.equal(noLocalProject.values.repoFullName, 'team/storefront');
  assert.equal(noLocalProject.values.name, 'storefront');
  assert.equal(noLocalProject.canCreate, false);
});

test('unavailable branch defaults are replaced only by a real branch and stale edits cannot be submitted', () => {
  const changed = structuredClone(setup);
  changed.agents[0].projects[0].defaultBranch = 'removed-local-branch';
  assert.equal(resolveProjectCreation(changed, {}).values.defaultBranch, 'main');

  changed.repositories[0].defaultBranch = 'removed-remote-branch';
  assert.equal(resolveProjectCreation(changed, {}).values.defaultBranch, '');
  assert.equal(resolveProjectCreation(changed, {}).canCreate, false);
  changed.repositories[0].branches = ['release'];
  assert.equal(resolveProjectCreation(changed, {}).values.defaultBranch, 'release');

  for (const edits of [
    { defaultBranch: 'deleted' },
    { defaultModelId: 'unpublished' },
    { defaultReasoningEffort: 'unsupported' },
    { agentProjectKey: 'missing' },
    { repoFullName: 'team/inaccessible' },
    { defaultModelId: '' },
    { defaultReasoningEffort: '' },
  ]) {
    const stale = resolveProjectCreation(setup, edits);
    assert.equal(stale.canCreate, false, JSON.stringify(edits));
    for (const [key, value] of Object.entries(edits)) {
      assert.equal(Reflect.get(stale.values, key), value);
    }
  }
});

test('published model restrictions and reasoning choices never invent an arbitrary default', () => {
  const choices = structuredClone(setup);
  choices.agents[0].models.push({ ...choices.agents[0].models[0], id: 'agent/other-model' });
  assert.deepEqual(
    resolveProjectCreation(choices, {}).modelOptions.map((model) => model.id),
    ['agent/model'],
  );
  assert.equal(resolveProjectCreation(choices, { defaultModelId: 'agent/other-model' }).canCreate, false);

  delete choices.agents[0].projects[0].models;
  assert.equal(resolveProjectCreation(choices, {}).values.defaultModelId, '');
  assert.equal(resolveProjectCreation(choices, {}).canCreate, false);

  choices.agents[0].models[1].defaultReasoningEffort = 'medium';
  const edits = { defaultModelId: 'agent/other-model' };
  const unsupportedDefault = resolveProjectCreation(choices, edits);
  assert.equal(unsupportedDefault.values.defaultReasoningEffort, '');
  assert.equal(unsupportedDefault.canCreate, false);
  assert.deepEqual(
    unsupportedDefault.reasoningOptions.map((effort) => effort.id),
    ['low', 'high'],
  );

  delete choices.agents[0].models[1].defaultReasoningEffort;
  assert.equal(resolveProjectCreation(choices, edits).values.defaultReasoningEffort, '');
  choices.agents[0].models[1].reasoningEfforts = [{ id: 'high', label: 'High' }];
  assert.equal(resolveProjectCreation(choices, edits).values.defaultReasoningEffort, 'high');
  assert.equal(resolveProjectCreation(choices, edits).canCreate, true);
});

test('legacy models without reasoning metadata use the API compatibility choice only when a model exists', () => {
  const legacy = structuredClone(setup);
  delete legacy.agents[0].models[0].reasoningEfforts;
  delete legacy.agents[0].models[0].defaultReasoningEffort;
  const resolved = resolveProjectCreation(legacy, {});
  assert.equal(resolved.values.defaultReasoningEffort, 'medium');
  assert.equal(resolved.canCreate, true);

  legacy.agents[0].models[0].reasoningEfforts = [];
  assert.equal(resolveProjectCreation(legacy, {}).values.defaultReasoningEffort, 'medium');
  legacy.agents[0].models = [];
  const unavailable = resolveProjectCreation(legacy, {});
  assert.equal(unavailable.values.defaultModelId, '');
  assert.equal(unavailable.values.defaultReasoningEffort, '');
  assert.equal(unavailable.canCreate, false);
});
