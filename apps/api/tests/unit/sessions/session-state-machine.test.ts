import assert from 'node:assert/strict';
import test from 'node:test';
import type { Session } from '@pairdock/domain';
import { InvalidSessionTransitionError, SessionStateMachine } from '../../../src/sessions/session-state-machine.js';

function buildSession(status: Session['status']): Session {
  return {
    id: 'b6f03fa4-f7ec-4f1f-bd46-27c163f0b7c2',
    projectId: '863bdcc7-76ab-4c5d-a4c0-b62475455466',
    createdByUserId: '0a598fe2-0cfb-4470-a7a1-248f20467aa6',
    status,
    modelId: 'codex-cli/gpt-5.4',
    branchName: null,
    worktreeRef: null,
    previewUrl: null,
    lastError: null,
    createdAt: new Date('2026-06-28T10:00:00.000Z'),
    closedAt: null,
  };
}

test('BT-006: SessionStateMachine reaches READY when prepare success events arrive in order', () => {
  const stateMachine = new SessionStateMachine();

  let session = buildSession('CREATED');
  session = stateMachine.applyAgentEvent(session, {
    type: 'session.progress',
    payload: { status: 'AGENT_CONNECTING' },
  });
  session = stateMachine.applyAgentEvent(session, {
    type: 'session.progress',
    payload: { status: 'WORKTREE_CREATING' },
  });
  session = stateMachine.applyAgentEvent(session, {
    type: 'session.progress',
    payload: { status: 'DOCKER_STARTING' },
  });
  session = stateMachine.applyAgentEvent(session, {
    type: 'session.progress',
    payload: { status: 'PREVIEW_STARTING' },
  });
  session = stateMachine.applyAgentEvent(session, {
    type: 'session.ready',
    payload: { previewUrl: 'https://preview.pairdock.test' },
  });

  assert.equal(session.status, 'READY');
  assert.equal(session.previewUrl, 'https://preview.pairdock.test');
});

test('BT-007: SessionStateMachine rejects an invalid transition from CREATED to agent.done', () => {
  const stateMachine = new SessionStateMachine();

  assert.throws(
    () =>
      stateMachine.applyAgentEvent(buildSession('CREATED'), {
        type: 'agent.done',
        payload: { exitCode: 0 },
      }),
    InvalidSessionTransitionError,
  );
});
