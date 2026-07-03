import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import type { SessionEventFeedSnapshot } from '../../../../apps/web/src/pm-session/session-event-feed-store.js';
import type { SessionView } from '../../../../apps/web/src/pm-session/session-schemas.js';
import { SessionStatusCard } from '../../../../apps/web/src/pm-session/session-status-card.js';

const session: SessionView = {
  id: '11111111-1111-4111-8111-111111111111',
  projectId: '22222222-2222-4222-8222-222222222222',
  createdByUserId: '33333333-3333-4333-8333-333333333333',
  status: 'READY',
  modelId: 'codex-cli/gpt-5.4',
  branchName: null,
  worktreeRef: null,
  previewUrl: 'https://preview.pairdock.test',
  lastError: null,
  project: {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'PairDock',
    defaultBranch: 'main',
    ownerDisplayName: 'Owner',
    owningAgentId: 'project-agent-1',
    agentAvailability: 'online',
  },
  participants: [
    {
      userId: '33333333-3333-4333-8333-333333333333',
      role: 'developer',
      displayName: 'Owner',
    },
    {
      userId: '44444444-4444-4444-8444-444444444444',
      role: 'pm',
      displayName: 'PM Partner',
    },
  ],
  latestDiff: null,
  latestValidation: {
    status: 'passed',
    buildStatus: 'passed',
    lintStatus: 'passed',
    testStatus: 'passed',
    previewStatus: 'passed',
  },
  createdAt: '2026-07-02T20:00:00.000Z',
  closedAt: null,
};

const feed: SessionEventFeedSnapshot = {
  connectionState: 'subscribed',
  errorMessage: null,
  lastEventType: null,
};

test('Task 12: session overview renders project metadata, participants, and passed validation state', () => {
  const html = renderToStaticMarkup(<SessionStatusCard feed={feed} session={session} />);

  assert.match(html, /Session overview/);
  assert.match(html, /PairDock/);
  assert.match(html, /main/);
  assert.match(html, /project-agent-1/);
  assert.match(html, /Owner \(developer\) · PM Partner \(pm\)/);
  assert.match(html, /Agent online/);
  assert.match(html, /Validation passed/);
});
