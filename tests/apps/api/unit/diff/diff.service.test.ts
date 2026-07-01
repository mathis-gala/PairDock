import assert from 'node:assert/strict';
import test from 'node:test';
import type { AgentEventRecord } from '@pairdock/domain';
import { DiffService } from '../../../../../apps/api/src/diff/diff.service.js';
import type { AgentEventsRepository } from '../../../../../apps/api/src/persistence/ports/agent-events.repository.js';

function buildAgentEventRecord(input: {
  type: string;
  payload: Record<string, unknown>;
  id?: string;
}): AgentEventRecord {
  return {
    id: input.id ?? `event-${Math.random()}`,
    sessionId: 'e87b1d4f-f0e4-4f61-b13a-b33a3d1a0b6d',
    agentId: 'agent-local-1',
    type: input.type,
    payload: input.payload,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
  };
}

test('Task 10: DiffService returns the latest git.diff payload for a session', async () => {
  const repository: AgentEventsRepository = {
    create: async () => {
      throw new Error('not implemented');
    },
    listBySessionId: async () => [
      buildAgentEventRecord({ type: 'agent.output', payload: { text: 'hello' }, id: '1' }),
      buildAgentEventRecord({
        type: 'git.diff',
        payload: {
          sessionId: 'e87b1d4f-f0e4-4f61-b13a-b33a3d1a0b6d',
          diff: 'old diff',
          changedFiles: ['README.md'],
        },
        id: '2',
      }),
      buildAgentEventRecord({
        type: 'git.diff',
        payload: {
          sessionId: 'e87b1d4f-f0e4-4f61-b13a-b33a3d1a0b6d',
          diff: 'new diff',
          changedFiles: ['README.md', '.env'],
        },
        id: '3',
      }),
    ],
  };

  const service = new DiffService(repository);
  const latestDiff = await service.getLatestDiff('e87b1d4f-f0e4-4f61-b13a-b33a3d1a0b6d');

  assert.deepEqual(latestDiff, {
    diff: 'new diff',
    changedFiles: ['README.md', '.env'],
  });
});

test('Task 10: DiffService returns null when a session has no valid git.diff payload', async () => {
  const repository: AgentEventsRepository = {
    create: async () => {
      throw new Error('not implemented');
    },
    listBySessionId: async () => [
      buildAgentEventRecord({ type: 'agent.output', payload: { text: 'hello' } }),
      buildAgentEventRecord({ type: 'git.diff', payload: { diff: 42, changedFiles: 'README.md' } }),
    ],
  };

  const service = new DiffService(repository);

  assert.equal(await service.getLatestDiff('e87b1d4f-f0e4-4f61-b13a-b33a3d1a0b6d'), null);
});
