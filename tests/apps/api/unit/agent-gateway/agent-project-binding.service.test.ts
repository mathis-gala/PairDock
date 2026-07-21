import assert from 'node:assert/strict';
import test from 'node:test';
import { ConflictException, ServiceUnavailableException } from '@nestjs/common';
import type { Project } from '@pairdock/domain';
import { AgentProjectBindingService } from '../../../../../apps/api/src/agent-gateway/agent-project-binding.service.js';
import { ConnectedAgentsRegistry } from '../../../../../apps/api/src/agent-gateway/connected-agents.registry.js';

const project: Project = {
  id: '51b924dd-d130-47df-bec8-5b32329b7d1e',
  ownerUserId: '529f4fde-54e1-4a62-b75f-c5a963c3de21',
  sourceControlConnectionId: 'd02991f0-fb91-4cf5-878f-6b6468e44264',
  name: 'PairDock',
  description: null,
  repoFullName: 'mathis-gala/PairDock',
  defaultBranch: 'main',
  defaultModelId: 'gpt-5.6-sol',
  defaultReasoningEffort: 'low',
  pmCanStartSessions: true,
  agentProjectKey: 'tcg',
  createdAt: new Date('2026-07-20T00:00:00.000Z'),
};

test('matching published repository is an active project binding', () => {
  const service = createService('mathis-gala/pairdock');

  assert.equal(service.isConnected(project), true);
  assert.doesNotThrow(() => service.assertConnected(project));
  assert.doesNotThrow(() => service.assertCompatibleIfConnected(project));
});

test('repository drift is rejected before commands can reach the remapped agent project', () => {
  const service = createService('mathis-gala/Booster-Break');

  assert.equal(service.isConnected(project), false);
  assert.throws(() => service.assertConnected(project), ConflictException);
  assert.throws(() => service.assertCompatibleIfConnected(project), ConflictException);
});

test('missing owning agent remains distinguishable from repository drift', () => {
  const service = new AgentProjectBindingService(new ConnectedAgentsRegistry());

  assert.equal(service.isConnected(project), false);
  assert.throws(() => service.assertConnected(project), ServiceUnavailableException);
  assert.doesNotThrow(() => service.assertCompatibleIfConnected(project));
});

function createService(repoFullName: string): AgentProjectBindingService {
  const registry = new ConnectedAgentsRegistry();
  registry.register('socket-tcg', {
    agentId: 'tcg-local-agent',
    capabilities: ['session.prepare'],
    models: [],
    projects: [
      {
        key: 'tcg',
        name: 'PairDock',
        repoFullName,
        pathAlias: 'PairDock',
        defaultBranch: 'main',
      },
    ],
  });
  return new AgentProjectBindingService(registry);
}
