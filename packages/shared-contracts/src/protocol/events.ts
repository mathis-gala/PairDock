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
    models: z
      .array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          provider: z.string().min(1),
          reasoningEfforts: z
            .array(
              z.object({
                id: z.string().min(1),
                label: z.string().min(1),
                description: z.string().min(1).optional(),
              }),
            )
            .optional(),
          defaultReasoningEffort: z.string().min(1).optional(),
        }),
      )
      .default([]),
    projects: z
      .array(
        z.object({
          key: z.string().min(1),
          name: z.string().min(1),
          repoFullName: z.string().min(1),
          pathAlias: z.string().min(1),
          defaultBranch: z.string().min(1).optional(),
          models: z.array(z.string().min(1)).optional(),
        }),
      )
      .default([]),
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
    changesDetected: z.boolean().optional(),
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

export const checksResultPayloadSchema = z.object({
  sessionId: uuidSchema,
  ok: z.boolean(),
  build: checkResultSchema,
  tests: checkResultSchema,
  lint: checkResultSchema,
  preview: checkResultSchema,
});

export const checksResultEventEnvelopeSchema = sessionEnvelope('checks.result', checksResultPayloadSchema).refine(
  ({ sessionId, payload }) => payload.sessionId === sessionId,
  sessionIdConsistencyRule,
);

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

export interface ChecksFailureSummary {
  failedChecks: Array<'build' | 'tests' | 'lint' | 'preview'>;
  cause: string | null;
  message: string;
}

export function summarizeChecksFailure(payload: ChecksResultEventEnvelope['payload']): ChecksFailureSummary | null {
  const checks = [
    ['build', payload.build],
    ['tests', payload.tests],
    ['lint', payload.lint],
    ['preview', payload.preview],
  ] as const;
  const failedChecks = checks.filter(([, result]) => result.status !== 'passed').map(([name]) => name);

  if (failedChecks.length === 0) {
    return null;
  }

  const cause =
    checks
      .filter(([name]) => failedChecks.includes(name))
      .map(([, result]) => extractUsefulLogLine(result.logs))
      .find((line): line is string => Boolean(line)) ?? null;
  const labels = failedChecks.join(', ');

  return {
    failedChecks,
    cause,
    message: `Validation failed for ${labels}.${cause ? ` Cause: ${cause}` : ''}`,
  };
}

function extractUsefulLogLine(logs: string | undefined): string | null {
  if (!logs) {
    return null;
  }

  const lines = logs
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const usefulLine =
    lines.find((line) => /cannot find|not found|error:|exception|failed on|timed out/i.test(line)) ??
    lines.find((line) => /fail|error/i.test(line));

  if (!usefulLine) {
    return null;
  }

  return usefulLine.length > 320 ? `${usefulLine.slice(0, 317)}...` : usefulLine;
}
