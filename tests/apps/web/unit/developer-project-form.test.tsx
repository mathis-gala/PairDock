import assert from 'node:assert/strict';
import test from 'node:test';
import type { DeveloperProjectSetup } from '@pairdock/shared-contracts';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DeveloperProjectForm } from '../../../../apps/web/src/components/developer/developer-project-form.js';

const setup: DeveloperProjectSetup = {
  repositories: [
    {
      fullName: 'mathis-gala/PairDock',
      name: 'PairDock',
      defaultBranch: 'main',
      branches: ['main', 'dev'],
    },
  ],
  agents: [
    {
      agentId: 'local-agent-1',
      capabilities: ['session.prepare'],
      models: [
        {
          id: 'agent/gpt-5',
          label: 'GPT-5',
          provider: 'local',
          reasoningEfforts: [
            { id: 'low', label: 'Low' },
            { id: 'high', label: 'High' },
          ],
          defaultReasoningEffort: 'low',
        },
      ],
      projects: [
        {
          key: 'pairdock',
          name: 'PairDock',
          repoFullName: 'mathis-gala/PairDock',
          pathAlias: 'PairDock',
          defaultBranch: 'main',
          models: ['agent/gpt-5'],
          readiness: null,
        },
      ],
    },
  ],
};

test('V1: developer project form renders setup-driven repository, agent, and model selectors', () => {
  const html = renderToStaticMarkup(
    createElement(DeveloperProjectForm, {
      developerSeed: 'dev@pairdock.test',
      isSetupLoading: false,
      isSubmitting: false,
      onSubmit: async () => undefined,
      setup,
    }),
  );

  assert.match(html, /Sélectionner un dépôt/);
  assert.match(html, /mathis-gala\/PairDock/);
  assert.match(html, /id="developer-project-agent-project"/);
  assert.match(html, /id="developer-project-model"/);
  assert.match(html, /id="developer-project-reasoning"/);
  assert.doesNotMatch(html, /codex-cli/);
  assert.doesNotMatch(html, /Codex/);
});

test('V1: developer project form shows local agent empty state', () => {
  const html = renderToStaticMarkup(
    createElement(DeveloperProjectForm, {
      developerSeed: 'dev@pairdock.test',
      isSetupLoading: false,
      isSubmitting: false,
      onSubmit: async () => undefined,
      setup: { repositories: setup.repositories, agents: [] },
    }),
  );

  assert.match(html, /Aucun agent local en ligne/);
  assert.match(html, /pairdock-agent start/);
});

test('V1: dependent project selectors stay explorable while explaining their prerequisite', () => {
  const html = renderToStaticMarkup(
    createElement(DeveloperProjectForm, {
      developerSeed: 'dev@pairdock.test',
      isSetupLoading: false,
      isSubmitting: false,
      onSubmit: async () => undefined,
      setup,
    }),
  );
  const branchSelect = html.match(/<select[^>]*id="developer-project-branch"[^>]*>/)?.[0] ?? '';
  const agentSelect = html.match(/<select[^>]*id="developer-project-agent-project"[^>]*>/)?.[0] ?? '';
  const modelSelect = html.match(/<select[^>]*id="developer-project-model"[^>]*>/)?.[0] ?? '';

  assert.doesNotMatch(branchSelect, /\sdisabled(?:=|\s|>)/);
  assert.doesNotMatch(agentSelect, /\sdisabled(?:=|\s|>)/);
  assert.doesNotMatch(modelSelect, /\sdisabled(?:=|\s|>)/);
  assert.match(html, /Choisis d’abord un dépôt/);
  assert.match(html, /Choisis d’abord un projet agent/);
});
