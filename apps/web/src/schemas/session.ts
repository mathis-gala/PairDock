import { z } from 'zod';

export const validationSummarySchema = z
  .object({
    status: z.string(),
    buildStatus: z.string().nullable().optional(),
    lintStatus: z.string().nullable().optional(),
    testStatus: z.string().nullable().optional(),
    previewStatus: z.string().nullable().optional(),
    summary: z.string().nullable().optional(),
    logExcerpt: z.string().nullable().optional(),
  })
  .catchall(z.unknown());

export const sessionSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  createdByUserId: z.string().uuid(),
  status: z.string(),
  modelId: z.string(),
  reasoningEffort: z.string(),
  branchName: z.string().nullable(),
  worktreeRef: z.string().nullable(),
  previewUrl: z.string().nullable(),
  lastError: z.string().nullable(),
  project: z.object({
    id: z.string().uuid(),
    name: z.string(),
    defaultBranch: z.string(),
    ownerDisplayName: z.string(),
    owningAgentId: z.string(),
    agentAvailability: z.enum(['online', 'offline']),
  }),
  participants: z.array(
    z.object({
      userId: z.string().uuid(),
      role: z.string(),
      displayName: z.string(),
    }),
  ),
  latestDiff: z
    .object({
      diff: z.string(),
      changedFiles: z.array(z.string()),
    })
    .nullable(),
  latestValidation: validationSummarySchema.nullable(),
  reviewRequest: z
    .object({
      url: z.string().nullable(),
      number: z.number().nullable(),
      status: z.string(),
    })
    .nullable()
    .optional(),
  createdAt: z.string(),
  closedAt: z.string().nullable(),
});

export const sessionMessageSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  role: z.string(),
  content: z.string(),
  createdAt: z.string(),
});

export const sessionEventRecordSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid().nullable(),
  agentId: z.string().nullable(),
  type: z.string(),
  payload: z.unknown(),
  createdAt: z.string(),
});

export type SessionView = z.infer<typeof sessionSchema>;
export type SessionMessageView = z.infer<typeof sessionMessageSchema>;
export type SessionEventRecordView = z.infer<typeof sessionEventRecordSchema>;
export type ValidationSummaryView = z.infer<typeof validationSummarySchema>;
