import { z } from 'zod';
import { envelopeBaseSchema, MAX_AGENT_PROMPT_LENGTH, sessionEnvelope, uuidSchema } from './common.js';

const sessionIdConsistencyRule = {
  message: 'Envelope sessionId must match payload.sessionId.',
  path: ['sessionId'],
};

export const sessionPrepareCommandEnvelopeSchema = sessionEnvelope(
  'session.prepare',
  z.object({
    sessionId: uuidSchema,
    projectKey: z.string().min(1).max(128),
    branchName: z.string().min(1).max(255),
    baseBranch: z.string().min(1).max(255),
    modelId: z.string().min(1).max(128),
    reasoningEffort: z.string().min(1).max(64).optional(),
  }),
).refine(({ sessionId, payload }) => payload.sessionId === sessionId, sessionIdConsistencyRule);

export const readinessCheckCommandEnvelopeSchema = envelopeBaseSchema.extend({
  type: z.literal('readiness.check'),
  payload: z.object({
    projectKey: z.string().min(1).max(128),
    sessionId: uuidSchema.optional(),
  }),
});

export const agentPromptCommandEnvelopeSchema = sessionEnvelope(
  'agent.prompt',
  z.object({
    sessionId: uuidSchema,
    prompt: z.string().min(1).max(MAX_AGENT_PROMPT_LENGTH),
    modelId: z.string().min(1).max(128),
    reasoningEffort: z.string().min(1).max(64).optional(),
  }),
).refine(({ sessionId, payload }) => payload.sessionId === sessionId, sessionIdConsistencyRule);

export const agentCancelCommandEnvelopeSchema = sessionEnvelope(
  'agent.cancel',
  z.object({
    sessionId: uuidSchema,
  }),
).refine(({ sessionId, payload }) => payload.sessionId === sessionId, sessionIdConsistencyRule);

export const gitGetDiffCommandEnvelopeSchema = sessionEnvelope(
  'git.getDiff',
  z.object({
    sessionId: uuidSchema,
  }),
).refine(({ sessionId, payload }) => payload.sessionId === sessionId, sessionIdConsistencyRule);

export const checksRunCommandEnvelopeSchema = sessionEnvelope(
  'checks.run',
  z.object({
    sessionId: uuidSchema,
  }),
).refine(({ sessionId, payload }) => payload.sessionId === sessionId, sessionIdConsistencyRule);

export const gitPushBranchCommandEnvelopeSchema = sessionEnvelope(
  'git.pushBranch',
  z.object({
    sessionId: uuidSchema,
    commitMessage: z.string().trim().min(1).max(72),
  }),
).refine(({ sessionId, payload }) => payload.sessionId === sessionId, sessionIdConsistencyRule);

export const sessionCloseCommandEnvelopeSchema = sessionEnvelope(
  'session.close',
  z.object({
    sessionId: uuidSchema,
    mode: z.enum(['keep-branch', 'delete-local']),
  }),
).refine(({ sessionId, payload }) => payload.sessionId === sessionId, sessionIdConsistencyRule);

export const agentCommandEnvelopeSchema = z.discriminatedUnion('type', [
  sessionPrepareCommandEnvelopeSchema,
  readinessCheckCommandEnvelopeSchema,
  agentPromptCommandEnvelopeSchema,
  agentCancelCommandEnvelopeSchema,
  gitGetDiffCommandEnvelopeSchema,
  checksRunCommandEnvelopeSchema,
  gitPushBranchCommandEnvelopeSchema,
  sessionCloseCommandEnvelopeSchema,
]);

export type SessionPrepareCommandEnvelope = z.infer<typeof sessionPrepareCommandEnvelopeSchema>;
export type ReadinessCheckCommandEnvelope = z.infer<typeof readinessCheckCommandEnvelopeSchema>;
export type AgentPromptCommandEnvelope = z.infer<typeof agentPromptCommandEnvelopeSchema>;
export type AgentCancelCommandEnvelope = z.infer<typeof agentCancelCommandEnvelopeSchema>;
export type GitGetDiffCommandEnvelope = z.infer<typeof gitGetDiffCommandEnvelopeSchema>;
export type ChecksRunCommandEnvelope = z.infer<typeof checksRunCommandEnvelopeSchema>;
export type GitPushBranchCommandEnvelope = z.infer<typeof gitPushBranchCommandEnvelopeSchema>;
export type SessionCloseCommandEnvelope = z.infer<typeof sessionCloseCommandEnvelopeSchema>;
export type AgentCommandEnvelope = z.infer<typeof agentCommandEnvelopeSchema>;
