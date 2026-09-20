import { Readable } from 'node:stream';
import { crc32, createInflate } from 'node:zlib';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { MAX_PREVIEW_CAPTURE_BYTES, previewCaptureDimensionsSchema } from '@pairdock/shared-contracts';
import type { UploadedScreenshot } from './screenshot-validation.js';

const pngSignature = Buffer.from('89504e470d0a1a0a', 'hex');
const maxActiveDecoders = 2;
let activeDecoders = 0;
const channelsByColor = new Map([
  [0, 1],
  [2, 3],
  [3, 1],
  [4, 2],
  [6, 4],
]);

export async function validatePreviewCapture(file: UploadedScreenshot | undefined) {
  if (file?.mimetype !== 'image/png') {
    throw new BadRequestException('A PNG screenshot is required.');
  }
  if (file.size > MAX_PREVIEW_CAPTURE_BYTES || file.buffer.length > MAX_PREVIEW_CAPTURE_BYTES) {
    throw new BadRequestException('The PNG screenshot must not exceed 5 MB.');
  }
  const bytes = file.buffer;
  if (bytes.length < 57 || !bytes.subarray(0, 8).equals(pngSignature)) throw invalidPng();
  const header = bytes.subarray(16, 29);
  const dimensions = previewCaptureDimensionsSchema.safeParse({
    width: header.readUInt32BE(0),
    height: header.readUInt32BE(4),
  });
  if (!dimensions.success) throw new BadRequestException('PNG dimensions must be between 1 and 4096 pixels.');
  const depth = header[8];
  const color = header[9];
  const channels = channelsByColor.get(color);
  if (
    !channels ||
    ![1, 2, 4, 8, 16].includes(depth) ||
    (color === 3 && depth === 16) ||
    (color !== 0 && color !== 3 && depth < 8) ||
    header[10] !== 0 ||
    header[11] !== 0 ||
    header[12] > 1
  )
    throw invalidPng();

  const compressed: Buffer[] = [];
  let ended = false;
  let palette = false;
  let dataEnded = false;
  for (let offset = 8; offset < bytes.length; ) {
    if (offset + 12 > bytes.length || ended) throw invalidPng();
    const length = bytes.readUInt32BE(offset);
    const end = offset + length + 12;
    if (end > bytes.length) throw invalidPng();
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    if (!/^[A-Za-z]{4}$/.test(type) || crc32(bytes.subarray(offset + 4, end - 4)) !== bytes.readUInt32BE(end - 4)) {
      throw invalidPng();
    }
    if (offset === 8 ? type !== 'IHDR' || length !== 13 : type === 'IHDR') throw invalidPng();
    if (type === 'PLTE') {
      if (palette || compressed.length || length === 0 || length % 3 !== 0 || length > 768) throw invalidPng();
      palette = true;
    } else if (type === 'IDAT') {
      if (dataEnded || (color === 3 && !palette)) throw invalidPng();
      compressed.push(bytes.subarray(offset + 8, end - 4));
    } else if (type === 'IEND') {
      if (length !== 0 || !compressed.length) throw invalidPng();
      ended = true;
    } else if (type !== 'IHDR' && type[0] === type[0].toUpperCase()) {
      throw invalidPng();
    }
    if (compressed.length && type !== 'IDAT') dataEnded = true;
    offset = end;
  }
  if (!ended) throw invalidPng();

  const { width, height } = dimensions.data;
  const passes =
    header[12] === 0
      ? [[0, 0, 1, 1]]
      : [
          [0, 0, 8, 8],
          [4, 0, 8, 8],
          [0, 4, 4, 8],
          [2, 0, 4, 4],
          [0, 2, 2, 4],
          [1, 0, 2, 2],
          [0, 1, 1, 2],
        ];
  const rows = passes
    .map(([x, y, dx, dy]) => ({
      bytes: Math.ceil((Math.max(0, Math.ceil((width - x) / dx)) * channels * depth) / 8),
      count: Math.max(0, Math.ceil((height - y) / dy)),
    }))
    .filter((pass) => pass.bytes > 0 && pass.count > 0);
  const expectedBytes = rows.reduce((sum, pass) => sum + (pass.bytes + 1) * pass.count, 0);
  if (activeDecoders >= maxActiveDecoders) {
    throw new ServiceUnavailableException('Screenshot validation is busy. Please retry in a moment.');
  }
  activeDecoders++;
  const source = Readable.from(compressed, { objectMode: false });
  const inflater = source.pipe(createInflate({ chunkSize: 16 * 1024 }));
  let decodedBytes = 0;
  let filterOffset = 0;
  let passIndex = 0;
  let rowIndex = 0;
  try {
    // Consume and discard output with stream backpressure instead of retaining the full bitmap.
    for await (const chunk of inflater) {
      const end = decodedBytes + chunk.length;
      if (end > expectedBytes) throw invalidPng();
      while (filterOffset < end) {
        if (chunk[filterOffset - decodedBytes] > 4) throw invalidPng();
        const pass = rows[passIndex];
        filterOffset += pass.bytes + 1;
        rowIndex++;
        if (rowIndex === pass.count) {
          passIndex++;
          rowIndex = 0;
        }
      }
      decodedBytes = end;
    }
    if (
      decodedBytes !== expectedBytes ||
      inflater.bytesWritten !== compressed.reduce((sum, part) => sum + part.length, 0)
    ) {
      throw invalidPng();
    }
  } catch {
    throw invalidPng();
  } finally {
    source.destroy();
    inflater.destroy();
    activeDecoders--;
  }
  return dimensions.data;
}

function invalidPng() {
  return new BadRequestException('The screenshot must contain a complete, valid PNG image.');
}
