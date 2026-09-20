import type { PreviewComparison } from '@pairdock/shared-contracts';

export const comparisonSessionId = '11111111-1111-4111-8111-111111111111';
export const pngDataUrl =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
export const pngBytes = Buffer.from(pngDataUrl.split(',')[1] ?? '', 'base64');
export const comparison: PreviewComparison = {
  id: '22222222-2222-4222-8222-222222222222',
  pageUrl: 'https://preview.example.com/settings',
  viewport: { width: 1280, height: 900 },
  before: {
    attachment: {
      id: '33333333-3333-4333-8333-333333333333',
      fileName: 'before.png',
      mimeType: 'image/png',
      byteSize: pngBytes.length,
    },
    image: { width: 1, height: 1 },
    createdAt: '2026-09-20T10:00:00.000Z',
  },
  after: {
    attachment: {
      id: '44444444-4444-4444-8444-444444444444',
      fileName: 'after.png',
      mimeType: 'image/png',
      byteSize: pngBytes.length,
    },
    image: { width: 1, height: 1 },
    createdAt: '2026-09-20T10:02:00.000Z',
  },
};
