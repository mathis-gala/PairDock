import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';
import { ConflictException } from '@nestjs/common';
import type { Project, Session } from '@pairdock/domain';
import { AGENT_PROTOCOL_VERSION, type AgentCommandEnvelope } from '@pairdock/shared-contracts';
import type { AgentGateway } from '../../../../../apps/api/src/agent-gateway/agent.gateway.js';
import { AgentCommandRouterService } from '../../../../../apps/api/src/agent-gateway/agent-command-router.service.js';
import type { AgentProjectBindingService } from '../../../../../apps/api/src/agent-gateway/agent-project-binding.service.js';
import type { ProjectsRepository } from '../../../../../apps/api/src/persistence/ports/projects.repository.js';
import type { SessionsRepository } from '../../../../../apps/api/src/persistence/ports/sessions.repository.js';

test('router blocks code-changing session commands when agent project repository binding drifted', async () => {
  let delivered = false;
  const binding = {
    assertConnected() {
      throw new ConflictException('repository drift');
    },
  } as unknown as AgentProjectBindingService;
  const gateway = {
    emitToAgent() {
      delivered = true;
      return true;
    },
  } as unknown as AgentGateway;
  const router = new AgentCommandRouterService(
    repositoryReturning(session),
    repositoryReturning(project),
    gateway,
    binding,
  );

  await assert.rejects(() => router.routeToOwningAgent(session.id, command), ConflictException);
  assert.equal(delivered, false);
});

const project: Project = {
  id: 'a07f34dd-b69b-4918-b53f-e070839d90a6',
  ownerUserId: 'a725117b-e98b-4c75-8f7e-d752de92f517',
  sourceControlConnectionId: '697070e8-8ce0-423a-80ba-f1b0480055dc',
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

const session: Session = {
  id: '19098eb1-95c1-4292-a4f2-f60a738b0eb0',
  projectId: project.id,
  createdByUserId: project.ownerUserId,
  status: 'READY',
  modelId: 'gpt-5.6-sol',
  reasoningEffort: 'low',
  branchName: 'pairdock/session-test',
  worktreeRef: null,
  previewUrl: null,
  lastError: null,
  createdAt: new Date('2026-07-20T00:00:00.000Z'),
  closedAt: null,
};

const command: AgentCommandEnvelope = {
  protocolVersion: AGENT_PROTOCOL_VERSION,
  messageId: 'fdc51f78-2d7f-4ed1-b987-7f47f40f53b2',
  sessionId: session.id,
  sentAt: '2026-07-20T00:00:00.000Z',
  type: 'agent.prompt',
  payload: {
    sessionId: session.id,
    prompt: 'Change the navbar.',
    modelId: 'gpt-5.6-sol',
    reasoningEffort: 'low',
  },
};

function repositoryReturning<T>(value: T) {
  return {
    async findById() {
      return value;
    },
  } as unknown as T extends Session ? SessionsRepository : ProjectsRepository;
}
