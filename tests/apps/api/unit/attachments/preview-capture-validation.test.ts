import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import test from 'node:test';
import { promisify } from 'node:util';
import { crc32, deflateSync } from 'node:zlib';
import { validatePreviewCapture } from '../../../../../apps/api/src/attachments/preview-capture-validation.js';

test('comparison captures derive pixel dimensions from complete PNG bytes', async () => {
  const image = png(2, 1);
  assert.deepEqual(await validatePreviewCapture(file(image)), { width: 2, height: 1 });
});

test('large compressed captures validate without retaining the decoded bitmap', async () => {
  const { stdout } = await promisify(execFile)(process.execPath, [
    '--expose-gc',
    '--import',
    'tsx',
    '../../tests/apps/api/fixtures/large-preview-capture.ts',
  ]);
  const result = JSON.parse(stdout);
  assert.deepEqual(result.dimensions, { width: 4096, height: 4096 });
  assert.ok(result.compressedBytes < 200_000);
  // Allow allocator/GC variance while rejecting the former ~256 MiB bitmap retention.
  assert.ok(result.maxRssDeltaKiB < 96 * 1024, `PNG decoding grew peak RSS by ${result.maxRssDeltaKiB} KiB`);
});

test('PNG validation limits active decoders without retaining a waiting queue', async () => {
  const capture = file(png(2, 1));
  const results = await Promise.allSettled(Array.from({ length: 3 }, () => validatePreviewCapture(capture)));
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 2);
  const rejected = results.find((result) => result.status === 'rejected');
  assert.ok(rejected && rejected.status === 'rejected');
  assert.equal(rejected.reason.getStatus(), 503);
  assert.match(rejected.reason.message, /retry/);
  assert.deepEqual(await validatePreviewCapture(capture), { width: 2, height: 1 });
});

test('streamed PNG validation checks filters across chunk boundaries and releases failed decoders', async () => {
  const pixels = Buffer.alloc((4096 * 4 + 1) * 2);
  assert.deepEqual(await validatePreviewCapture(file(png(4096, 2, pixels))), { width: 4096, height: 2 });
  pixels[4096 * 4 + 1] = 5;
  for (let attempt = 0; attempt < 3; attempt++) {
    await assert.rejects(validatePreviewCapture(file(png(4096, 2, pixels))), /valid PNG/);
  }
  pixels[4096 * 4 + 1] = 0;
  assert.deepEqual(await validatePreviewCapture(file(png(4096, 2, pixels))), { width: 4096, height: 2 });
});

test('comparison captures reject absent, disguised, oversized, and malformed PNG uploads', async () => {
  await assert.rejects(validatePreviewCapture(undefined), /PNG screenshot is required/);
  await assert.rejects(validatePreviewCapture({ ...file(png(1, 1)), mimetype: 'image/jpeg' }), /PNG/);
  await assert.rejects(validatePreviewCapture(file(Buffer.alloc(5 * 1024 * 1024 + 1))), /5 MB/);
  await assert.rejects(validatePreviewCapture(file(png(4097, 1))), /dimensions/);
  const corrupt = png(1, 1);
  corrupt[20] = 1;
  await assert.rejects(validatePreviewCapture(file(corrupt)), /PNG/);
  await assert.rejects(validatePreviewCapture(file(png(1, 1).subarray(0, 40))), /PNG/);
  await assert.rejects(validatePreviewCapture(file(Buffer.concat([png(1, 1), Buffer.from('trailing')]))), /PNG/);
  await assert.rejects(validatePreviewCapture(file(png(2, 2, Buffer.from([0, 0])))), /PNG/);
});

function file(buffer: Buffer) {
  return { buffer, size: buffer.length, mimetype: 'image/png', originalname: 'capture.png' };
}

function png(width: number, height: number, pixels = Buffer.alloc((width * 4 + 1) * height)) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(pixels)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type: string, data: Buffer) {
  const result = Buffer.alloc(data.length + 12);
  result.writeUInt32BE(data.length, 0);
  result.write(type, 4);
  data.copy(result, 8);
  result.writeUInt32BE(crc32(result.subarray(4, -4)), result.length - 4);
  return result;
}
