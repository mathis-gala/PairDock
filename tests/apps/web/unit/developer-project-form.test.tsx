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

test('a single configured local project is proposed with real values and an editable model', () => {
  const html = renderToStaticMarkup(
    createElement(DeveloperProjectForm, {
      isSetupLoading: false,
      isSubmitting: false,
      onSubmit: async () => undefined,
      setup,
    }),
  );

  assert.match(html, /value="PairDock"/);
  assert.match(html, /value="mathis-gala\/PairDock" selected=""/);
  assert.match(html, /value="pairdock" selected=""/);
  assert.match(html, /value="agent\/gpt-5" selected=""/);
  assert.match(html, /mathis-gala\/PairDock/);
  assert.match(html, /id="developer-project-agent-project"/);
  assert.match(html, /id="developer-project-model"/);
  assert.match(html, /id="developer-project-reasoning"/);
  assert.doesNotMatch(html, /codex-cli/);
  assert.doesNotMatch(html, /Codex/);
  assert.doesNotMatch(html, /PairDock local project|Local project controlled/);
});

test('V1: developer project form shows local agent empty state', () => {
  const html = renderToStaticMarkup(
    createElement(DeveloperProjectForm, {
      isSetupLoading: false,
      isSubmitting: false,
      onSubmit: async () => undefined,
      setup: { repositories: setup.repositories, agents: [] },
    }),
  );

  assert.match(html, /Aucun agent local en ligne/);
  assert.match(html, /href="#\/developer\/agents"/);
  assert.match(html, /Configurer mon agent/);
  assert.doesNotMatch(html, /pairdock-agent start|pairdock.yml|Seed local/);
});

test('ambiguous repositories remain an explicit choice with prerequisite guidance', () => {
  const html = renderToStaticMarkup(
    createElement(DeveloperProjectForm, {
      isSetupLoading: false,
      isSubmitting: false,
      onSubmit: async () => undefined,
      setup: {
        repositories: [...setup.repositories, { ...setup.repositories[0], fullName: 'team/another', name: 'Another' }],
        agents: [
          {
            ...setup.agents[0],
            projects: [
              ...setup.agents[0].projects,
              { ...setup.agents[0].projects[0], key: 'another', repoFullName: 'team/another' },
            ],
          },
        ],
      },
    }),
  );
  const branchSelect = html.match(/<select[^>]*id="developer-project-branch"[^>]*>/)?.[0] ?? '';
  const agentSelect = html.match(/<select[^>]*id="developer-project-agent-project"[^>]*>/)?.[0] ?? '';
  const modelSelect = html.match(/<select[^>]*id="developer-project-model"[^>]*>/)?.[0] ?? '';

  assert.doesNotMatch(branchSelect, /\sdisabled(?:=|\s|>)/);
  assert.doesNotMatch(agentSelect, /\sdisabled(?:=|\s|>)/);
  assert.doesNotMatch(modelSelect, /\sdisabled(?:=|\s|>)/);
  assert.match(html, /Choisis d’abord un dépôt/);
  assert.match(html, /Choisis d’abord un dossier local/);
});

test('device names distinguish local folders without exposing agent identifiers', () => {
  const html = renderToStaticMarkup(
    createElement(DeveloperProjectForm, {
      devices: [
        {
          agentId: 'local-agent-1',
          deviceName: 'Mac de Camille',
          connected: true,
          pairedAt: '2026-09-20',
          lastSeenAt: '2026-09-20',
          revokedAt: null,
        },
      ],
      isSetupLoading: false,
      isSubmitting: false,
      onSubmit: async () => undefined,
      setup,
    }),
  );
  assert.match(html, /PairDock · Mac de Camille/);
  assert.doesNotMatch(html, /local-agent-1/);
});
