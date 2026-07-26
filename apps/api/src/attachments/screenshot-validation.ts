import { basename } from 'node:path';
import { BadRequestException } from '@nestjs/common';

export const MAX_SCREENSHOT_COUNT = 4;
export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;

export interface UploadedScreenshot {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export interface ValidatedScreenshot extends UploadedScreenshot {
  extension: 'jpg' | 'png' | 'webp';
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  originalName: string;
}

export function validateScreenshots(files: UploadedScreenshot[] | undefined): ValidatedScreenshot[] {
  const screenshots = files ?? [];

  if (screenshots.length > MAX_SCREENSHOT_COUNT) {
    throw new BadRequestException(`A maximum of ${MAX_SCREENSHOT_COUNT} screenshots is allowed.`);
  }

  return screenshots.map(validateScreenshot);
}

function validateScreenshot(file: UploadedScreenshot): ValidatedScreenshot {
  if (file.size <= 0 || file.buffer.byteLength <= 0) {
    throw new BadRequestException('Screenshots must not be empty.');
  }

  if (file.size > MAX_SCREENSHOT_BYTES || file.buffer.byteLength > MAX_SCREENSHOT_BYTES) {
    throw new BadRequestException('Each screenshot must not exceed 5 MB.');
  }

  const detected = detectImageType(file.buffer);
  if (!detected || detected.mimeType !== file.mimetype) {
    throw new BadRequestException(
      `Screenshot "${safeOriginalName(file.originalname)}" does not match its image content.`,
    );
  }

  return {
    ...file,
    ...detected,
    originalName: safeOriginalName(file.originalname),
  };
}

function detectImageType(buffer: Buffer): Pick<ValidatedScreenshot, 'extension' | 'mimeType'> | null {
  if (isPng(buffer)) {
    return { extension: 'png', mimeType: 'image/png' };
  }

  if (isJpeg(buffer)) {
    return { extension: 'jpg', mimeType: 'image/jpeg' };
  }

  if (isWebp(buffer)) {
    return { extension: 'webp', mimeType: 'image/webp' };
  }

  return null;
}

function isPng(buffer: Buffer): boolean {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return (
    buffer.length >= 45 &&
    buffer.subarray(0, 8).equals(signature) &&
    buffer.readUInt32BE(8) === 13 &&
    buffer.subarray(12, 16).toString('ascii') === 'IHDR' &&
    buffer.readUInt32BE(16) > 0 &&
    buffer.readUInt32BE(20) > 0 &&
    buffer.indexOf(Buffer.from('IDAT'), 24) > 24 &&
    buffer.readUInt32BE(buffer.length - 12) === 0 &&
    buffer.subarray(buffer.length - 8, buffer.length - 4).toString('ascii') === 'IEND'
  );
}

function isJpeg(buffer: Buffer): boolean {
  return (
    buffer.length >= 6 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff &&
    buffer[buffer.length - 2] === 0xff &&
    buffer[buffer.length - 1] === 0xd9
  );
}

function isWebp(buffer: Buffer): boolean {
  if (
    buffer.length < 20 ||
    buffer.subarray(0, 4).toString('ascii') !== 'RIFF' ||
    buffer.readUInt32LE(4) !== buffer.length - 8 ||
    buffer.subarray(8, 12).toString('ascii') !== 'WEBP'
  ) {
    return false;
  }

  const format = buffer.subarray(12, 16).toString('ascii');
  return format === 'VP8 ' || format === 'VP8L' || format === 'VP8X';
}

function safeOriginalName(value: string): string {
  return basename(value.trim()).slice(0, 255) || 'screenshot';
}
