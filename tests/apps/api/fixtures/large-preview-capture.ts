import { Readable } from 'node:stream';
import { crc32, createDeflate } from 'node:zlib';
import { validatePreviewCapture } from '../../../../apps/api/src/attachments/preview-capture-validation.js';

async function main() {
  // Generate a 128 MiB decoded PNG without allocating its bitmap in the test process.
  const scanline = Buffer.alloc(4096 * 8 + 1);
  const compressor = Readable.from(
    (function* () {
      for (let row = 0; row < 4096; row++) yield scanline;
    })(),
  ).pipe(createDeflate());
  const compressed: Buffer[] = [];
  for await (const chunk of compressor) compressed.push(chunk);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(4096, 0);
  header.writeUInt32BE(4096, 4);
  header[8] = 16;
  header[9] = 6;
  const buffer = Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    pngChunk('IHDR', header),
    pngChunk('IDAT', Buffer.concat(compressed)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
  global.gc?.();
  const baseline = process.resourceUsage().maxRSS;
  const dimensions = await validatePreviewCapture({
    buffer,
    size: buffer.length,
    mimetype: 'image/png',
    originalname: 'large.png',
  });
  process.stdout.write(
    JSON.stringify({
      dimensions,
      compressedBytes: buffer.length,
      maxRssDeltaKiB: process.resourceUsage().maxRSS - baseline,
    }),
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

function pngChunk(type: string, data: Buffer) {
  const result = Buffer.alloc(data.length + 12);
  result.writeUInt32BE(data.length, 0);
  result.write(type, 4);
  data.copy(result, 8);
  result.writeUInt32BE(crc32(result.subarray(4, -4)), result.length - 4);
  return result;
}
