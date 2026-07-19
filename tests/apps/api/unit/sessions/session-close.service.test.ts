import assert from 'node:assert/strict';
import test from 'node:test';
import type { Session } from '@pairdock/domain';
import type { AgentCommandRouterService } from '../../../../../apps/api/src/agent-gateway/agent-command-router.service.js';
import type { SessionsRepository } from '../../../../../apps/api/src/persistence/ports/sessions.repository.js';
import { SessionCloseService } from '../../../../../apps/api/src/sessions/session-close.service.js';

function buildSession(status: Session['status']): Session {
  return {
    id: 'a2bd57df-5b87-4524-9241-6dc41ceccb6a',
    projectId: '85d75767-4f44-4900-9f70-fdd9f6d5c38d',
    createdByUserId: '80ce6c4f-9219-4dd4-a345-f71f6438b7e6',
    status,
    modelId: 'codex-cli/gpt-5.4',
    reasoningEffort: 'medium',
    branchName: null,
    worktreeRef: null,
    previewUrl: null,
    lastError: null,
    createdAt: new Date('2026-06-28T10:00:00.000Z'),
    closedAt: status === 'CLOSED' ? new Date('2026-06-28T10:10:00.000Z') : null,
  };
}

test('BT-008: SessionCloseService is idempotent when the session is already CLOSED', async () => {
  const closedSession = buildSession('CLOSED');
  let updateCalls = 0;

  const sessionsRepository: SessionsRepository = {
    create: async () => {
      throw new Error('not implemented');
    },
    findById: async () => closedSession,
    listByProjectIds: async () => [],
    updateStatus: async () => {
      updateCalls += 1;
      return closedSession;
    },
  };

  const service = new SessionCloseService(sessionsRepository);
  const result = await service.closeSession(closedSession.id);

  assert.equal(result.status, 'CLOSED');
  assert.equal(result.closedAt?.toISOString(), '2026-06-28T10:10:00.000Z');
  assert.equal(updateCalls, 0);
});

test('V1: SessionCloseService leaves a failed session open when local cleanup fails so close can be retried', async () => {
  const failedSession = buildSession('FAILED');
  let updateCalls = 0;
  const sessionsRepository: SessionsRepository = {
    create: async () => {
      throw new Error('not implemented');
    },
    findById: async () => failedSession,
    listByProjectIds: async () => [],
    updateStatus: async () => {
      updateCalls += 1;
      return failedSession;
    },
  };
  const agentCommandRouter = {
    routeToOwningAgent: async () => {
      throw new Error('local cleanup failed');
    },
  } as unknown as AgentCommandRouterService;
  const service = new SessionCloseService(sessionsRepository, agentCommandRouter);

  await assert.rejects(() => service.closeSession(failedSession.id), /local cleanup failed/);
  assert.equal(updateCalls, 0);
});
