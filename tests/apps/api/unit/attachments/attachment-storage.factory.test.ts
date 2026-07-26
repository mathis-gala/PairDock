import assert from 'node:assert/strict';
import test from 'node:test';
import { createAttachmentStorage } from '../../../../../apps/api/src/attachments/attachment-storage.factory.js';
import { LocalAttachmentStorageAdapter } from '../../../../../apps/api/src/attachments/local-attachment-storage.adapter.js';
import { R2AttachmentStorageAdapter } from '../../../../../apps/api/src/attachments/r2-attachment-storage.adapter.js';

test('attachment storage uses the local adapter when R2 is not configured', () => {
  const storage = createAttachmentStorage({ NODE_ENV: 'development' });

  assert.ok(storage instanceof LocalAttachmentStorageAdapter);
});

test('attachment storage requires durable R2 configuration in production', () => {
  assert.throws(
    () => createAttachmentStorage({ NODE_ENV: 'production' }),
    /R2 attachment storage is required in production/,
  );
});

test('attachment storage refuses partial or non-HTTPS R2 configuration', () => {
  assert.throws(
    () => createAttachmentStorage({ R2_ACCOUNT_ID: 'account' }),
    /Incomplete R2 attachment storage configuration/,
  );
  assert.throws(
    () =>
      createAttachmentStorage({
        R2_ACCOUNT_ID: 'account',
        R2_ACCESS_KEY_ID: 'access',
        R2_SECRET_ACCESS_KEY: 'secret',
        R2_PRIVATE_BUCKET: 'private',
        R2_PUBLIC_BUCKET: 'public',
        R2_PUBLIC_BASE_URL: 'http://assets.example.com',
      }),
    /must use HTTPS/,
  );
});

test('attachment storage enables R2 only with complete configuration', () => {
  const storage = createAttachmentStorage({
    R2_ACCOUNT_ID: 'account',
    R2_ACCESS_KEY_ID: 'access',
    R2_SECRET_ACCESS_KEY: 'secret',
    R2_PRIVATE_BUCKET: 'private',
    R2_PUBLIC_BUCKET: 'public',
    R2_PUBLIC_BASE_URL: 'https://assets.example.com/',
  });

  assert.ok(storage instanceof R2AttachmentStorageAdapter);
});
