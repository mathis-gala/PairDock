import { z } from 'zod';
import {
  checkResultSchema,
  envelopeBaseSchema,
  sessionEnvelope,
  sessionStatusSchema,
  toolReadinessCheckSchema,
  uuidSchema,
} from './common.js';

const sessionIdConsistencyRule = {
  message: 'Envelope sessionId must match payload.sessionId.',
  path: ['sessionId'],
};

export const agentConnectedEventEnvelopeSchema = envelopeBaseSchema.extend({
  type: z.literal('agent.connected'),
  payload: z.object({
    agentId: z.string().min(1),
    capabilities: z.array(z.string().min(1)),
  }),
});

export const readinessResultEventEnvelopeSchema = envelopeBaseSchema.extend({
  type: z.literal('readiness.result'),
  payload: z.object({
    projectKey: z.string().min(1),
    sessionId: uuidSchema.optional(),
    ok: z.boolean(),
    checks: z.array(toolReadinessCheckSchema),
  }),
});

export const sessionProgressEventEnvelopeSchema = sessionEnvelope(
  'session.progress',
  z.object({
    sessionId: uuidSchema,
    status: sessionStatusSchema,
    message: z.string().min(1).optional(),
  }),
).refine(({ sessionId, payload }) => payload.sessionId === sessionId, sessionIdConsistencyRule);

export const sessionReadyEventEnvelopeSchema = sessionEnvelope(
  'session.ready',
  z.object({
    sessionId: uuidSchema,
    previewUrl: z.url(),
  }),
).refine(({ sessionId, payload }) => payload.sessionId === sessionId, sessionIdConsistencyRule);

export const agentOutputEventEnvelopeSchema = sessionEnvelope(
  'agent.output',
  z.object({
    sessionId: uuidSchema,
    stream: z.enum(['stdout', 'stderr']),
    text: z.string(),
  }),
).refine(({ sessionId, payload }) => payload.sessionId === sessionId, sessionIdConsistencyRule);

export const agentDoneEventEnvelopeSchema = sessionEnvelope(
  'agent.done',
  z.object({
    sessionId: uuidSchema,
    exitCode: z.int(),
  }),
).refine(({ sessionId, payload }) => payload.sessionId === sessionId, sessionIdConsistencyRule);

export const gitDiffEventEnvelopeSchema = sessionEnvelope(
  'git.diff',
  z.object({
    sessionId: uuidSchema,
    diff: z.string(),
    changedFiles: z.array(z.string().min(1)),
  }),
).refine(({ sessionId, payload }) => payload.sessionId === sessionId, sessionIdConsistencyRule);

export const checksResultEventEnvelopeSchema = sessionEnvelope(
  'checks.result',
  z.object({
    sessionId: uuidSchema,
    ok: z.boolean(),
    build: checkResultSchema,
    tests: checkResultSchema,
    lint: checkResultSchema,
    preview: checkResultSchema,
  }),
).refine(({ sessionId, payload }) => payload.sessionId === sessionId, sessionIdConsistencyRule);

export const gitBranchPushedEventEnvelopeSchema = sessionEnvelope(
  'git.branchPushed',
  z.object({
    sessionId: uuidSchema,
    branchName: z.string().min(1),
  }),
).refine(({ sessionId, payload }) => payload.sessionId === sessionId, sessionIdConsistencyRule);

export const sessionClosedEventEnvelopeSchema = sessionEnvelope(
  'session.closed',
  z.object({
    sessionId: uuidSchema,
    cleaned: z.boolean(),
  }),
).refine(({ sessionId, payload }) => payload.sessionId === sessionId, sessionIdConsistencyRule);

export const errorEventEnvelopeSchema = envelopeBaseSchema
  .extend({
    type: z.literal('error'),
    payload: z.object({
      sessionId: uuidSchema.optional(),
      code: z.string().min(1),
      message: z.string().min(1),
      retryable: z.boolean(),
    }),
  })
  .superRefine(({ sessionId, payload }, context) => {
    if (sessionId && payload.sessionId && sessionId !== payload.sessionId) {
      context.addIssue({
        code: 'custom',
        message: 'Envelope sessionId must match payload.sessionId.',
        path: ['sessionId'],
      });
    }
  });

export const agentEventEnvelopeSchema = z.discriminatedUnion('type', [
  agentConnectedEventEnvelopeSchema,
  readinessResultEventEnvelopeSchema,
  sessionProgressEventEnvelopeSchema,
  sessionReadyEventEnvelopeSchema,
  agentOutputEventEnvelopeSchema,
  agentDoneEventEnvelopeSchema,
  gitDiffEventEnvelopeSchema,
  checksResultEventEnvelopeSchema,
  gitBranchPushedEventEnvelopeSchema,
  sessionClosedEventEnvelopeSchema,
  errorEventEnvelopeSchema,
]);

export type AgentConnectedEventEnvelope = z.infer<typeof agentConnectedEventEnvelopeSchema>;
export type ReadinessResultEventEnvelope = z.infer<typeof readinessResultEventEnvelopeSchema>;
export type SessionProgressEventEnvelope = z.infer<typeof sessionProgressEventEnvelopeSchema>;
export type SessionReadyEventEnvelope = z.infer<typeof sessionReadyEventEnvelopeSchema>;
export type AgentOutputEventEnvelope = z.infer<typeof agentOutputEventEnvelopeSchema>;
export type AgentDoneEventEnvelope = z.infer<typeof agentDoneEventEnvelopeSchema>;
export type GitDiffEventEnvelope = z.infer<typeof gitDiffEventEnvelopeSchema>;
export type ChecksResultEventEnvelope = z.infer<typeof checksResultEventEnvelopeSchema>;
export type GitBranchPushedEventEnvelope = z.infer<typeof gitBranchPushedEventEnvelopeSchema>;
export type SessionClosedEventEnvelope = z.infer<typeof sessionClosedEventEnvelopeSchema>;
export type ErrorEventEnvelope = z.infer<typeof errorEventEnvelopeSchema>;
export type AgentEventEnvelope = z.infer<typeof agentEventEnvelopeSchema>;
