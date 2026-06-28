import { z } from 'zod';
import { AGENT_PROTOCOL_VERSION } from './constants.js';

export const uuidSchema = z.uuid();
export const isoDateTimeSchema = z.iso.datetime();
export const sessionStatusSchema = z.enum([
  'CREATED',
  'AGENT_CONNECTING',
  'WORKTREE_CREATING',
  'DOCKER_STARTING',
  'PREVIEW_STARTING',
  'READY',
  'AGENT_RUNNING',
  'CHECKS_RUNNING',
  'AWAITING_PM_VALIDATION',
  'REVIEW_REQUEST_CREATING',
  'REVIEW_REQUEST_CREATED',
  'CLOSING',
  'CLOSED',
  'FAILED',
]);

export const checkResultSchema = z.object({
  status: z.enum(['passed', 'failed', 'skipped']),
  command: z.string().min(1).optional(),
  logs: z.string().optional(),
});

export const envelopeBaseSchema = z.object({
  protocolVersion: z.literal(AGENT_PROTOCOL_VERSION),
  messageId: uuidSchema,
  sessionId: uuidSchema.optional(),
  sentAt: isoDateTimeSchema,
});

export const sessionEnvelope = <TType extends string, TPayload extends z.ZodTypeAny>(type: TType, payload: TPayload) =>
  envelopeBaseSchema.extend({
    sessionId: uuidSchema,
    type: z.literal(type),
    payload,
  });
