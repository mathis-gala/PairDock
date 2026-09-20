import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AgentAuthenticationService,
  hashAgentSecret,
} from '../../../../../apps/api/src/agent-gateway/agent-authentication.service.js';
import { AttachmentsController } from '../../../../../apps/api/src/attachments/attachments.controller.js';
import type { SessionAttachmentsService } from '../../../../../apps/api/src/attachments/session-attachments.service.js';
import type {
  AgentCredentialRecord,
  AgentEnrollmentRepository,
} from '../../../../../apps/api/src/persistence/ports/agent-enrollment.repository.js';
import type { ProjectsRepository } from '../../../../../apps/api/src/persistence/ports/projects.repository.js';
import type { SessionsRepository } from '../../../../../apps/api/src/persistence/ports/sessions.repository.js';

test('paired attachment access requires both its device namespace and developer owner and honors revocation', async () => {
  const token = 'private-device-token-with-more-than-32-bytes';
  const credential: AgentCredentialRecord = {
    agentId: 'agent-device',
    ownerUserId: 'developer-a',
    projectKeyPrefix: 'agent-device-',
    revokedAt: null,
  };
  const enrollment = {
    async findCredentialByHash(hash: string) {
      return hash === hashAgentSecret(token) ? credential : null;
    },
  } as AgentEnrollmentRepository;
  const authentication = new AgentAuthenticationService({ nodeEnv: 'production', credentials: {} }, enrollment);
  let reads = 0;
  const attachments = {
    async find() {
      return { sessionId: 'session-a' };
    },
    async readObject() {
      reads += 1;
      return { body: Buffer.from('capture'), mimeType: 'image/png' };
    },
  } as unknown as SessionAttachmentsService;
  const project = { ownerUserId: 'developer-a', agentProjectKey: 'agent-device-repo' };
  const controller = new AttachmentsController(
    attachments,
    authentication,
    {
      async findById() {
        return { projectId: 'project-a' };
      },
    } as unknown as SessionsRepository,
    {
      async findById() {
        return project;
      },
    } as unknown as ProjectsRepository,
  );
  const response = { setHeader() {}, send() {} };
  const request = { headers: { authorization: `Bearer ${token}` }, params: {} };

  await controller.readAgentAttachment('capture-a', request, response);
  assert.equal(reads, 1);

  project.ownerUserId = 'developer-b';
  await assert.rejects(() => controller.readAgentAttachment('capture-a', request, response), /not authorized/);
  project.ownerUserId = 'developer-a';
  project.agentProjectKey = 'another-device-repo';
  await assert.rejects(() => controller.readAgentAttachment('capture-a', request, response), /not authorized/);
  project.agentProjectKey = 'agent-device-repo';
  credential.revokedAt = new Date();
  await assert.rejects(
    () => controller.readAgentAttachment('capture-a', request, response),
    /Invalid agent authentication token/,
  );
  assert.equal(reads, 1, 'Unauthorized requests must not read capture bytes.');
});
