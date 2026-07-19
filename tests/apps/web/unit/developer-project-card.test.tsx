import assert from 'node:assert/strict';
import test from 'node:test';
import type { DeveloperProjectSummary } from '@pairdock/shared-contracts';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DeveloperProjectCard } from '../../../../apps/web/src/components/developer/developer-project-card.js';

const project: DeveloperProjectSummary = {
  id: '33333333-3333-4333-8333-333333333333',
  name: 'Developer project',
  description: 'Owned project',
  repoFullName: 'mathis/developer-project',
  defaultBranch: 'main',
  defaultModelId: 'agent/gpt-5',
  defaultReasoningEffort: 'medium',
  models: [
    {
      id: 'agent/gpt-5',
      label: 'GPT-5',
      provider: 'codex',
      reasoningEfforts: [
        { id: 'medium', label: 'Medium' },
        { id: 'high', label: 'High' },
      ],
      defaultReasoningEffort: 'medium',
    },
  ],
  agentProjectKey: 'local-developer-project',
  sourceControlAccountLogin: 'mathis',
  pmCanStartSessions: true,
  pmMemberCount: 1,
  agentAvailability: 'offline',
  readiness: null,
  sessions: [
    {
      id: '44444444-4444-4444-8444-444444444444',
      status: 'CREATED',
      modelId: 'agent/gpt-5',
      reviewRequestUrl: 'https://github.com/mathis/developer-project/pull/14',
      createdAt: '2026-07-04T10:00:00.000Z',
      closedAt: null,
    },
  ],
};

const blockedProject: DeveloperProjectSummary = {
  ...project,
  id: '55555555-5555-4555-8555-555555555555',
  readiness: {
    ok: false,
    checks: [
      {
        key: 'docker',
        status: 'failed',
        required: true,
        message: 'Docker unavailable.',
        remediation: 'Start Docker Desktop and rerun readiness checks.',
      },
      {
        key: 'preview-tunnel',
        status: 'warning',
        required: false,
        message: 'Preview tunnel is optional for this project.',
        remediation: 'Configure a tunnel before sharing previews outside the local network.',
      },
    ],
  },
};

test('BT-028/BT-029/BT-049: developer project card exposes agent defaults, sharing, and PM session cleanup', () => {
  const html = renderToStaticMarkup(
    createElement(DeveloperProjectCard, {
      closePendingSessionId: null,
      onCloseSession: async () => undefined,
      onRequestReadiness: async () => undefined,
      onShareProject: async () => undefined,
      onUpdateExecutionDefaults: async () => undefined,
      project,
      readinessPendingProjectId: null,
      sharePendingProjectId: null,
      updateDefaultsPendingProjectId: null,
    }),
  );

  assert.match(html, /Default model/);
  assert.match(html, /agent\/gpt-5/);
  assert.doesNotMatch(html, /session développeur/i);
  assert.match(html, /Enregistrer la configuration/);
  assert.match(html, /Raisonnement/);
  assert.match(html, /High/);
  assert.match(html, /Share with PM/);
  assert.match(html, /PM access/);
  assert.match(html, /Open draft review request/);
  assert.match(html, /https:\/\/github\.com\/mathis\/developer-project\/pull\/14/);
  assert.match(html, /Close session/);
  assert.doesNotMatch(html, /codex-cli/);
});

test('BT-044: developer project card shows readiness remediation for failed required checks', () => {
  const html = renderToStaticMarkup(
    createElement(DeveloperProjectCard, {
      closePendingSessionId: null,
      onCloseSession: async () => undefined,
      onRequestReadiness: async () => undefined,
      onShareProject: async () => undefined,
      onUpdateExecutionDefaults: async () => undefined,
      project: blockedProject,
      readinessPendingProjectId: null,
      sharePendingProjectId: null,
      updateDefaultsPendingProjectId: null,
    }),
  );

  assert.match(html, /Docker unavailable\./);
  assert.match(html, /Start Docker Desktop and rerun readiness checks\./);
  assert.match(html, /Preview tunnel is optional for this project\./);
  assert.match(html, /Optional/);
});
