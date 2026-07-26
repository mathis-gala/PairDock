import assert from 'node:assert/strict';
import test from 'node:test';
import { DockerOrphanReconciler } from '../../../../packages/local-agent/src/docker/docker-orphan-reconciler.js';

test('DockerOrphanReconciler stops only resources owned by this agent without an active session', async () => {
  const stoppedContainers: string[][] = [];
  const reconciler = new DockerOrphanReconciler({
    async listManagedContainers(ownerId) {
      assert.equal(ownerId, 'developer-mac');
      return [
        { name: 'pairdock-active', sessionId: 'active-session' },
        { name: 'pairdock-orphan', sessionId: 'orphan-session' },
        { name: 'pairdock-tunnel-orphan', sessionId: 'orphan-session' },
      ];
    },
    async stopContainers(names) {
      stoppedContainers.push(names);
    },
  });

  await reconciler.reconcile({
    ownerId: 'developer-mac',
    activeSessionIds: new Set(['active-session']),
  });

  assert.deepEqual(stoppedContainers, [['pairdock-orphan', 'pairdock-tunnel-orphan']]);
});
