import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_SCREENSHOT_BYTES,
  validateScreenshots,
} from '../../../../../apps/api/src/attachments/screenshot-validation.js';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

test('screenshot validation accepts structurally valid PNG, JPEG, and WebP payloads', () => {
  const screenshots = validateScreenshots([
    file('capture.png', 'image/png', validPng()),
    file('capture.jpg', 'image/jpeg', Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0xff, 0xd9])),
    file('capture.webp', 'image/webp', validWebp()),
  ]);

  assert.deepEqual(
    screenshots.map(({ extension, mimeType }) => ({ extension, mimeType })),
    [
      { extension: 'png', mimeType: 'image/png' },
      { extension: 'jpg', mimeType: 'image/jpeg' },
      { extension: 'webp', mimeType: 'image/webp' },
    ],
  );
});

test('screenshot validation rejects spoofed content types and oversized payloads', () => {
  assert.throws(
    () => validateScreenshots([file('fake.png', 'image/png', Buffer.from('not a png'))]),
    /does not match its image content/i,
  );
  assert.throws(
    () => validateScreenshots([file('huge.png', 'image/png', Buffer.alloc(MAX_SCREENSHOT_BYTES + 1))]),
    /must not exceed 5 MB/i,
  );
  assert.throws(
    () => validateScreenshots([file('truncated.png', 'image/png', PNG_SIGNATURE)]),
    /does not match its image content/i,
  );
  assert.throws(
    () => validateScreenshots([file('truncated.jpg', 'image/jpeg', Buffer.from([0xff, 0xd8, 0xff, 0xdb]))]),
    /does not match its image content/i,
  );
  assert.throws(
    () => validateScreenshots([file('truncated.webp', 'image/webp', Buffer.from('RIFF0000WEBP', 'ascii'))]),
    /does not match its image content/i,
  );
});

function file(originalname: string, mimetype: string, buffer: Buffer) {
  return { originalname, mimetype, buffer, size: buffer.byteLength };
}

function validPng(): Buffer {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );
}

function validWebp(): Buffer {
  const buffer = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 '), Buffer.alloc(8)]);
  buffer.writeUInt32LE(buffer.length - 8, 4);
  return buffer;
}
