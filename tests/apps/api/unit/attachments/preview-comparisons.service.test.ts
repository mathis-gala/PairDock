import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import type { AgentEventRecord, SessionAttachment } from '@pairdock/domain';
import type { AttachmentStoragePort } from '../../../../../apps/api/src/attachments/attachment-storage.port.js';
import { PreviewComparisonsService } from '../../../../../apps/api/src/attachments/preview-comparisons.service.js';
import { SessionAttachmentsService } from '../../../../../apps/api/src/attachments/session-attachments.service.js';
import type { AgentEventsRepository } from '../../../../../apps/api/src/persistence/ports/agent-events.repository.js';
import type { AttachmentsRepository } from '../../../../../apps/api/src/persistence/ports/attachments.repository.js';
import type { PersistenceUnitOfWork } from '../../../../../apps/api/src/persistence/ports/persistence-unit-of-work.js';
import type { SessionsRepository } from '../../../../../apps/api/src/persistence/ports/sessions.repository.js';

test('comparison persistence failure removes the private image and attachment metadata', async () => {
  const { service, sessionId, userId, attachments, objects } = createFixture();
  const buffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );
  await assert.rejects(
    service.create(
      sessionId,
      userId,
      {
        stage: 'before',
        pageUrl: 'https://preview.pairdock.test/',
        viewport: { width: 800, height: 600 },
      },
      { buffer, size: buffer.length, mimetype: 'image/png', originalname: 'before.png' },
    ),
    /event database unavailable/,
  );
  assert.equal(attachments.size, 0);
  assert.equal(objects.size, 0);
});

test('twenty comparison pairs use one attachment batch while preserving private session-scoped PNG checks', async () => {
  const records: AgentEventRecord[] = [];
  const fixture = createFixture(records);
  const baselineIds: string[] = [];
  for (let index = 0; index < 20; index++) {
    const comparisonId = randomUUID();
    for (const stage of ['before', 'after'] as const) {
      const id = randomUUID();
      if (stage === 'before') baselineIds.push(id);
      fixture.attachments.set(id, {
        id,
        sessionId: fixture.sessionId,
        messageId: null,
        createdByUserId: fixture.userId,
        purpose: 'preview_comparison',
        visibility: 'private',
        objectKey: id,
        originalName: `${stage}.png`,
        mimeType: 'image/png',
        byteSize: 100,
        createdAt: new Date(),
      });
      records.push({
        id: randomUUID(),
        sessionId: fixture.sessionId,
        agentId: null,
        type: 'preview.comparison.capture',
        createdAt: new Date(),
        payload: {
          comparisonId,
          stage,
          pageUrl: 'https://preview.pairdock.test/',
          viewport: { width: 1, height: 1 },
          image: { width: 1, height: 1 },
          attachmentId: id,
          captureSequence: records.length + 1,
        },
      });
    }
  }
  assert.equal((await fixture.service.list(fixture.sessionId)).length, 20);
  assert.equal(fixture.calls.single, 0);
  assert.equal(fixture.calls.batches.length, 1);
  assert.equal(fixture.calls.batches[0].length, 40);

  const mutations: Partial<SessionAttachment>[] = [
    { sessionId: randomUUID() },
    { purpose: 'prompt' },
    { visibility: 'public' },
    { mimeType: 'image/jpeg' },
  ];
  for (const [index, mutation] of mutations.entries()) {
    const attachment = fixture.attachments.get(baselineIds[index]);
    assert.ok(attachment);
    fixture.attachments.set(attachment.id, { ...attachment, ...mutation });
  }
  assert.equal((await fixture.service.list(fixture.sessionId)).length, 16);
  assert.equal(fixture.calls.single, 0);
  assert.equal(fixture.calls.batches.length, 2);
});

function createFixture(records: AgentEventRecord[] = []) {
  const attachments = new Map<string, SessionAttachment>();
  const objects = new Set<string>();
  const calls = { single: 0, batches: [] as string[][] };
  const attachmentRecords: AttachmentsRepository = {
    async create(input) {
      if (!input.id) throw new Error('attachment id required');
      const attachment: SessionAttachment = { ...input, id: input.id, messageId: null, createdAt: new Date() };
      attachments.set(attachment.id, attachment);
      return attachment;
    },
    async deleteByIds(ids) {
      for (const id of ids) attachments.delete(id);
    },
    async findById(id) {
      calls.single++;
      return attachments.get(id) ?? null;
    },
    async findByIds(ids) {
      calls.batches.push(ids);
      return ids.flatMap((id) => {
        const attachment = attachments.get(id);
        return attachment ? [attachment] : [];
      });
    },
    async listByMessageIds() {
      return [];
    },
    async updateMessageId() {
      throw new Error('not used');
    },
  };
  const storage: AttachmentStoragePort = {
    async put(input) {
      objects.add(input.objectKey);
    },
    async delete(_visibility, key) {
      objects.delete(key);
    },
    async read() {
      throw new Error('not used');
    },
    publicUrl() {
      throw new Error('not used');
    },
  };
  const sessionId = '11111111-1111-4111-8111-111111111111';
  const userId = '22222222-2222-4222-8222-222222222222';
  const sessions: SessionsRepository = {
    async create() {
      throw new Error('not used');
    },
    async findById() {
      return {
        id: sessionId,
        projectId: '33333333-3333-4333-8333-333333333333',
        createdByUserId: userId,
        status: 'READY',
        modelId: 'test-model',
        reasoningEffort: 'medium',
        branchName: null,
        worktreeRef: null,
        previewUrl: 'https://preview.pairdock.test',
        lastError: null,
        createdAt: new Date(),
        closedAt: null,
      };
    },
    async listByProjectIds() {
      return [];
    },
    async updateStatus() {
      throw new Error('not used');
    },
  };
  const events: AgentEventsRepository = {
    async create() {
      throw new Error('not used');
    },
    async listBySessionId() {
      return records;
    },
  };
  const transaction: PersistenceUnitOfWork = {
    async execute(_work, options) {
      assert.deepEqual(options, { lockSessionId: sessionId });
      assert.equal(attachments.size, 1);
      assert.equal(objects.size, 1);
      throw new Error('event database unavailable');
    },
  };
  const service = new PreviewComparisonsService(
    sessions,
    events,
    attachmentRecords,
    transaction,
    new SessionAttachmentsService(attachmentRecords, storage),
  );
  return { service, sessionId, userId, attachments, objects, calls };
}
