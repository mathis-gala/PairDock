import assert from 'node:assert/strict';
import test from 'node:test';
import type { DeveloperProjectSummary } from '@pairdock/shared-contracts';
import { renderToStaticMarkup } from 'react-dom/server';
import { DeveloperProjectCard } from '../../../../apps/web/src/components/developer/developer-project-card.js';

const project: DeveloperProjectSummary = {
  id: '33333333-3333-4333-8333-333333333333',
  name: 'Developer project',
  description: 'Owned project',
  repoFullName: 'mathis/developer-project',
  defaultBranch: 'main',
  defaultModelId: 'codex-cli/gpt-5.5',
  agentProjectKey: 'local-developer-project',
  sourceControlAccountLogin: 'mathis',
  pmCanStartSessions: true,
  pmMemberCount: 1,
  agentAvailability: 'offline',
  sessions: [
    {
      id: '44444444-4444-4444-8444-444444444444',
      status: 'CREATED',
      modelId: 'codex-cli/gpt-5.5',
      reviewRequestUrl: 'https://github.com/mathis/developer-project/pull/14',
      createdAt: '2026-07-04T10:00:00.000Z',
      closedAt: null,
    },
  ],
};

test('BT-028/BT-029/BT-049: developer project card exposes model start, sharing, and close controls', () => {
  const html = renderToStaticMarkup(
    <DeveloperProjectCard
      closePendingSessionId={null}
      onCloseSession={async () => undefined}
      onShareProject={async () => undefined}
      onStartSession={async () => undefined}
      project={project}
      sharePendingProjectId={null}
      startPendingProjectId={null}
    />,
  );

  assert.match(html, /Model selector/);
  assert.match(html, /codex-cli\/gpt-5\.5/);
  assert.match(html, /Start developer session/);
  assert.match(html, /Share with PM/);
  assert.match(html, /PM access/);
  assert.match(html, /Open draft review request/);
  assert.match(html, /https:\/\/github\.com\/mathis\/developer-project\/pull\/14/);
  assert.match(html, /Close session/);
});
