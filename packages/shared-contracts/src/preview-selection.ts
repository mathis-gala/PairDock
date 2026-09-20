import { z } from 'zod';

export const PREVIEW_SELECTION_CHANNEL = 'pairdock:preview-selection:v1';

export const PREVIEW_SELECTION_LIMITS = {
  tagName: 64,
  selector: 1_000,
  text: 500,
  html: 2_000,
  url: 2_048,
  selections: 5,
} as const;

const previewPageUrlSchema = z
  .string()
  .max(PREVIEW_SELECTION_LIMITS.url)
  .url()
  .refine((value) => {
    if (!URL.canParse(value)) {
      return false;
    }
    const url = new URL(value);
    const isHttp = url.protocol === 'https:' || url.protocol === 'http:';
    return isHttp && !url.username && !url.password && !url.search && !url.hash;
  }, 'Preview context must use an HTTP(S) page URL without credentials, query or fragment.');

export const previewElementSelectionSchema = z.object({
  tagName: z.string().min(1).max(PREVIEW_SELECTION_LIMITS.tagName),
  selector: z.string().min(1).max(PREVIEW_SELECTION_LIMITS.selector),
  text: z.string().max(PREVIEW_SELECTION_LIMITS.text),
  html: z.string().max(PREVIEW_SELECTION_LIMITS.html),
  url: previewPageUrlSchema,
  rect: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
    width: z.number().finite().nonnegative(),
    height: z.number().finite().nonnegative(),
  }),
  viewport: z.object({
    width: z.number().finite().positive(),
    height: z.number().finite().positive(),
  }),
});

export type PreviewElementSelection = z.infer<typeof previewElementSelectionSchema>;

const previewMessageEnvelope = z.object({
  channel: z.literal(PREVIEW_SELECTION_CHANNEL),
  nonce: z.string().min(1).max(128),
});

export const previewSelectionMessageSchema = z.discriminatedUnion('type', [
  previewMessageEnvelope.extend({ type: z.literal('ready') }),
  previewMessageEnvelope.extend({ type: z.literal('cancelled') }),
  previewMessageEnvelope.extend({ type: z.literal('selected'), selection: previewElementSelectionSchema }),
]);

export type PreviewSelectionMessage = z.infer<typeof previewSelectionMessageSchema>;

export type PreviewSelectionCommand =
  | { channel: typeof PREVIEW_SELECTION_CHANNEL; type: 'connect'; nonce: string }
  | { channel: typeof PREVIEW_SELECTION_CHANNEL; type: 'set-mode'; nonce: string; enabled: boolean };
