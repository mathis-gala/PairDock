import assert from 'node:assert/strict';
import test from 'node:test';
import { ConnectedAgentsRegistry } from '../../../../../apps/api/src/agent-gateway/connected-agents.registry.js';

test('ConnectedAgentsRegistry resolves sockets by agent id and published project key', () => {
  const registry = new ConnectedAgentsRegistry();

  registry.register('socket-1', {
    agentId: 'tcg-local-agent',
    capabilities: ['session.prepare'],
    models: [{ id: 'gpt-5', label: 'GPT-5', provider: 'codex' }],
    projects: [
      {
        key: 'tcg',
        name: 'TCG Collection',
        repoFullName: 'mathis-gala/Booster-Break',
        pathAlias: 'TCG Collection',
        defaultBranch: 'main',
        models: ['gpt-5'],
      },
    ],
  });

  assert.equal(registry.findSocketId('tcg-local-agent'), 'socket-1');
  assert.equal(registry.findSocketId('tcg'), 'socket-1');
});
