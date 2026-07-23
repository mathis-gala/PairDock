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
const MAX_AGENT_OUTPUT_LENGTH = 64 * 1024;
export const MAX_DIFF_LENGTH = 192 * 1024;

export const agentConnectedEventEnvelopeSchema = envelopeBaseSchema.extend({
  type: z.literal('agent.connected'),
  payload: z.object({
    agentId: z.string().min(1).max(128),
    capabilities: z.array(z.string().min(1).max(128)).max(64),
    models: z
      .array(
        z.object({
          id: z.string().min(1).max(128),
          label: z.string().min(1).max(128),
          provider: z.string().min(1).max(128),
          reasoningEfforts: z
            .array(
              z.object({
                id: z.string().min(1).max(64),
                label: z.string().min(1).max(128),
                description: z.string().min(1).max(512).optional(),
              }),
            )
            .max(16)
            .optional(),
          defaultReasoningEffort: z.string().min(1).max(64).optional(),
        }),
      )
      .max(64)
      .default([]),
    projects: z
      .array(
        z.object({
          key: z.string().min(1).max(128),
          name: z.string().min(1).max(256),
          repoFullName: z.string().min(1).max(256),
          pathAlias: z.string().min(1).max(256),
          defaultBranch: z.string().min(1).max(255).optional(),
          models: z.array(z.string().min(1).max(128)).max(64).optional(),
        }),
      )
      .max(128)
      .default([]),
  }),
});

export const readinessResultEventEnvelopeSchema = envelopeBaseSchema.extend({
  type: z.literal('readiness.result'),
  payload: z.object({
    projectKey: z.string().min(1).max(128),
    sessionId: uuidSchema.optional(),
    ok: z.boolean(),
    checks: z.array(toolReadinessCheckSchema).max(16),
  }),
});

export const sessionProgressEventEnvelopeSchema = sessionEnvelope(
  'session.progress',
  z.object({
    sessionId: uuidSchema,
    status: sessionStatusSchema,
    message: z.string().min(1).max(2_048).optional(),
  }),
).refine(({ sessionId, payload }) => payload.sessionId === sessionId, sessionIdConsistencyRule);

export const sessionReadyEventEnvelopeSchema = sessionEnvelope(
  'session.ready',
  z.object({
    sessionId: uuidSchema,
    previewUrl: z.url(),
  }),
).refine(({ sessionId, payload }) => payload.sessionId === sessionId, sessionIdConsistencyRule);

export const sessionRecoveredEventEnvelopeSchema = sessionEnvelope(
  'session.recovered',
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
    kind: z.enum(['progress', 'final']).optional(),
    text: z.string().max(MAX_AGENT_OUTPUT_LENGTH),
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
    diff: z.string().max(MAX_DIFF_LENGTH),
    changedFiles: z.array(z.string().min(1).max(1_024)).max(2_048),
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
    branchName: z.string().min(1).max(255),
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
      code: z.string().min(1).max(128),
      message: z.string().min(1).max(4_096),
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
  sessionRecoveredEventEnvelopeSchema,
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
export type SessionRecoveredEventEnvelope = z.infer<typeof sessionRecoveredEventEnvelopeSchema>;
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
    lines.find((line) => /^not ok\b|assertionerror|expected values? to|expected .* (?:but|received)/i.test(line)) ??
    lines.find((line) => /cannot find|not found|error:|exception|failed on|timed out/i.test(line)) ??
    lines.find((line) => /fail|error/i.test(line));

  if (!usefulLine) {
    return null;
  }

  return usefulLine.length > 320 ? `${usefulLine.slice(0, 317)}...` : usefulLine;
}
