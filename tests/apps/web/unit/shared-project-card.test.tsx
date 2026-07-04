import assert from 'node:assert/strict';
import test from 'node:test';
import type { SharedProjectSummary } from '@pairdock/shared-contracts';
import { renderToStaticMarkup } from 'react-dom/server';
import { SharedProjectCard } from '../../../../apps/web/src/components/pm-session/shared-project-card.js';

const readyProject: SharedProjectSummary = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Ready project',
  description: 'Agent online and ready',
  ownerDisplayName: 'Owner',
  repoFullName: 'mathis/pairdock-ready',
  defaultBranch: 'main',
  defaultModelId: 'codex-cli/gpt-5.4',
  agentAvailability: 'online',
  canStartSession: true,
  unavailableReason: null,
};

const blockedProject: SharedProjectSummary = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Offline project',
  description: 'Shared but offline',
  ownerDisplayName: 'Owner',
  repoFullName: 'mathis/pairdock-offline',
  defaultBranch: 'main',
  defaultModelId: 'codex-cli/gpt-5.4',
  agentAvailability: 'offline',
  canStartSession: false,
  unavailableReason: 'Owning agent is offline.',
};

test('BT-048: shared-project cards expose enabled and disabled PM session starts', () => {
  const readyHtml = renderToStaticMarkup(
    <SharedProjectCard onStart={() => undefined} project={readyProject} startPending={false} />,
  );
  const blockedHtml = renderToStaticMarkup(
    <SharedProjectCard onStart={() => undefined} project={blockedProject} startPending={false} />,
  );

  assert.match(readyHtml, /Start PM session/);
  assert.doesNotMatch(readyHtml, /disabled=""/);
  assert.match(blockedHtml, /Owning agent is offline\./);
  assert.match(blockedHtml, /disabled=""/);
});
