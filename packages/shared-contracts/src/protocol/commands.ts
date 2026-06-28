import { z } from 'zod';
import { sessionEnvelope, uuidSchema } from './common.js';

const sessionIdConsistencyRule = {
  message: 'Envelope sessionId must match payload.sessionId.',
  path: ['sessionId'],
};

export const sessionPrepareCommandEnvelopeSchema = sessionEnvelope(
  'session.prepare',
  z.object({
    sessionId: uuidSchema,
    projectKey: z.string().min(1),
    branchName: z.string().min(1),
    modelId: z.string().min(1),
  }),
).refine(({ sessionId, payload }) => payload.sessionId === sessionId, sessionIdConsistencyRule);

export const agentPromptCommandEnvelopeSchema = sessionEnvelope(
  'agent.prompt',
  z.object({
    sessionId: uuidSchema,
    prompt: z.string().min(1),
    modelId: z.string().min(1),
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
  agentPromptCommandEnvelopeSchema,
  agentCancelCommandEnvelopeSchema,
  gitGetDiffCommandEnvelopeSchema,
  checksRunCommandEnvelopeSchema,
  gitPushBranchCommandEnvelopeSchema,
  sessionCloseCommandEnvelopeSchema,
]);

export type SessionPrepareCommandEnvelope = z.infer<typeof sessionPrepareCommandEnvelopeSchema>;
export type AgentPromptCommandEnvelope = z.infer<typeof agentPromptCommandEnvelopeSchema>;
export type AgentCancelCommandEnvelope = z.infer<typeof agentCancelCommandEnvelopeSchema>;
export type GitGetDiffCommandEnvelope = z.infer<typeof gitGetDiffCommandEnvelopeSchema>;
export type ChecksRunCommandEnvelope = z.infer<typeof checksRunCommandEnvelopeSchema>;
export type GitPushBranchCommandEnvelope = z.infer<typeof gitPushBranchCommandEnvelopeSchema>;
export type SessionCloseCommandEnvelope = z.infer<typeof sessionCloseCommandEnvelopeSchema>;
export type AgentCommandEnvelope = z.infer<typeof agentCommandEnvelopeSchema>;
