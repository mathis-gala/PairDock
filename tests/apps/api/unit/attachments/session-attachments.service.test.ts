import assert from 'node:assert/strict';
import test from 'node:test';
import type { AttachmentStoragePort } from '../../../../../apps/api/src/attachments/attachment-storage.port.js';
import { SessionAttachmentsService } from '../../../../../apps/api/src/attachments/session-attachments.service.js';
import type { AttachmentsRepository } from '../../../../../apps/api/src/persistence/ports/attachments.repository.js';

test('attachment creation removes an uploaded object when metadata persistence fails', async () => {
  const deletedObjectKeys: string[] = [];
  const repository: AttachmentsRepository = {
    create: async () => {
      throw new Error('database unavailable');
    },
    deleteByIds: async () => undefined,
    findById: async () => null,
    listByMessageIds: async () => [],
    updateMessageId: async () => undefined,
  };
  const storage: AttachmentStoragePort = {
    delete: async (_visibility, objectKey) => {
      deletedObjectKeys.push(objectKey);
    },
    publicUrl: () => '',
    put: async () => undefined,
    read: async () => {
      throw new Error('not used');
    },
  };
  const service = new SessionAttachmentsService(repository, storage);

  await assert.rejects(
    service.create({
      sessionId: '11111111-1111-4111-8111-111111111111',
      createdByUserId: '22222222-2222-4222-8222-222222222222',
      purpose: 'prompt',
      visibility: 'private',
      files: [
        {
          buffer: validPng(),
          mimetype: 'image/png',
          originalname: 'capture.png',
          size: 8,
        },
      ],
    }),
    /database unavailable/,
  );

  assert.equal(deletedObjectKeys.length, 1);
  assert.match(deletedObjectKeys[0], /^sessions\/11111111-1111-4111-8111-111111111111\/prompt\/.+\.png$/);
});

test('attachment cleanup keeps metadata when object deletion fails', async () => {
  const deletedMetadataIds: string[][] = [];
  const repository: AttachmentsRepository = {
    create: async () => {
      throw new Error('not used');
    },
    deleteByIds: async (ids) => {
      deletedMetadataIds.push(ids);
    },
    findById: async () => null,
    listByMessageIds: async () => [],
    updateMessageId: async () => undefined,
  };
  const storage: AttachmentStoragePort = {
    delete: async () => {
      throw new Error('R2 unavailable');
    },
    publicUrl: () => '',
    put: async () => undefined,
    read: async () => {
      throw new Error('not used');
    },
  };
  const service = new SessionAttachmentsService(repository, storage);

  await service.remove([
    {
      id: '33333333-3333-4333-8333-333333333333',
      sessionId: '11111111-1111-4111-8111-111111111111',
      messageId: null,
      createdByUserId: '22222222-2222-4222-8222-222222222222',
      purpose: 'prompt',
      visibility: 'private',
      objectKey: 'sessions/11111111/prompt/33333333.png',
      originalName: 'capture.png',
      mimeType: 'image/png',
      byteSize: 68,
      createdAt: new Date('2026-07-26T12:00:00.000Z'),
    },
  ]);

  assert.deepEqual(deletedMetadataIds, []);
});

function validPng(): Buffer {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );
}
