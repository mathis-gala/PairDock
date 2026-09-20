import { z } from 'zod';
import { previewPageUrlSchema } from './preview-selection.js';
import { uuidSchema } from './protocol/common.js';
import { sessionAttachmentViewSchema } from './protocol/ui.js';

export const PREVIEW_COMPARISON_EVENT = 'preview.comparison.capture';
export const MAX_PREVIEW_COMPARISONS = 20;
export const MAX_PREVIEW_COMPARISON_CAPTURES = 80;
export const MAX_PREVIEW_CAPTURE_BYTES = 5 * 1024 * 1024;

export const previewCaptureDimensionsSchema = z.object({
  width: z.number().int().min(1).max(4096),
  height: z.number().int().min(1).max(4096),
});

const comparisonContext = {
  pageUrl: previewPageUrlSchema,
  viewport: previewCaptureDimensionsSchema,
};

export const previewComparisonInputSchema = z.discriminatedUnion('stage', [
  z.object({ stage: z.literal('before'), ...comparisonContext }).strict(),
  z.object({ stage: z.literal('after'), comparisonId: uuidSchema, ...comparisonContext }).strict(),
]);

export const previewComparisonCaptureEventSchema = z.object({
  comparisonId: uuidSchema,
  stage: z.enum(['before', 'after']),
  ...comparisonContext,
  attachmentId: uuidSchema,
  image: previewCaptureDimensionsSchema,
});

export const previewComparisonCaptureSchema = z.object({
  attachment: sessionAttachmentViewSchema,
  image: previewCaptureDimensionsSchema,
  createdAt: z.string().datetime(),
});

export const previewComparisonSchema = z.object({
  id: uuidSchema,
  ...comparisonContext,
  before: previewComparisonCaptureSchema,
  after: previewComparisonCaptureSchema.nullable(),
});

export type PreviewComparisonInput = z.infer<typeof previewComparisonInputSchema>;
export type PreviewComparisonCaptureEvent = z.infer<typeof previewComparisonCaptureEventSchema>;
export type PreviewComparisonCapture = z.infer<typeof previewComparisonCaptureSchema>;
export type PreviewComparison = z.infer<typeof previewComparisonSchema>;
