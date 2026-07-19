import { z } from 'zod';

export const authResponseSchema = z.object({
  created: z.boolean(),
  accessToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    displayName: z.string().nullable(),
    kind: z.string(),
  }),
});

export const idResponseSchema = z.object({ id: z.string() });
export const sessionIdResponseSchema = z.object({ sessionId: z.string() });

export const sessionCreateResponseSchema = z
  .object({
    id: z.string(),
    status: z.string(),
    projectId: z.string(),
    createdByUserId: z.string(),
    modelId: z.string(),
    reasoningEffort: z.string(),
  })
  .passthrough();

export const sessionStateResponseSchema = z
  .object({
    status: z.string(),
    previewUrl: z.string().nullable().optional(),
    closedAt: z.string().nullable().optional(),
    lastError: z.string().nullable().optional(),
    latestValidation: z
      .object({
        status: z.string(),
        buildStatus: z.string().nullable(),
        testStatus: z.string().nullable(),
        lintStatus: z.string().nullable(),
        previewStatus: z.string().nullable(),
      })
      .nullable()
      .optional(),
  })
  .passthrough();

export const sessionDetailsResponseSchema = z
  .object({
    project: z.object({
      id: z.string(),
      name: z.string(),
      defaultBranch: z.string(),
      ownerDisplayName: z.string().nullable(),
      owningAgentId: z.string(),
      agentAvailability: z.enum(['online', 'offline']),
    }),
    participants: z.array(z.object({ userId: z.string(), role: z.string(), displayName: z.string().nullable() })),
    latestDiff: z.object({ diff: z.string(), changedFiles: z.array(z.string()) }).nullable(),
  })
  .passthrough();

export const sharedProjectListResponseSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    ownerDisplayName: z.string(),
    repoFullName: z.string(),
    defaultBranch: z.string(),
    agentAvailability: z.string(),
    canStartSession: z.boolean(),
    unavailableReason: z.string().optional(),
  }),
);

export const sharedSessionHistoryResponseSchema = z.array(
  z.object({
    id: z.string(),
    projectId: z.string(),
    projectName: z.string(),
    repoFullName: z.string(),
    status: z.string(),
    reviewRequest: z
      .object({
        url: z.string().nullable(),
        number: z.number().nullable(),
        status: z.string(),
      })
      .nullable(),
    createdAt: z.string(),
    closedAt: z.string().nullable(),
  }),
);

export const developerProjectResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  repoFullName: z.string(),
  defaultBranch: z.string(),
  defaultModelId: z.string(),
  defaultReasoningEffort: z.string(),
  agentProjectKey: z.string(),
  sourceControlAccountLogin: z.string(),
  pmCanStartSessions: z.boolean(),
  pmMemberCount: z.number(),
  agentAvailability: z.string(),
  readiness: z
    .object({
      ok: z.boolean(),
      checks: z.array(
        z.object({
          key: z.string(),
          status: z.string(),
          required: z.boolean(),
          message: z.string().nullable(),
          remediation: z.string().nullable(),
        }),
      ),
    })
    .nullable(),
  sessions: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
      modelId: z.string(),
      createdAt: z.string(),
      closedAt: z.string().nullable(),
    }),
  ),
});

export const developerProjectListResponseSchema = z.array(developerProjectResponseSchema);

export const sessionPromptResponseSchema = z.object({
  sessionId: z.string(),
  role: z.string(),
  content: z.string(),
});

export const sessionMessageListResponseSchema = z.array(z.object({ role: z.string(), content: z.string() }));
export const sessionEventListResponseSchema = z.array(z.object({ type: z.string() }));

export async function parseJsonResponse<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  return schema.parse(await response.json());
}
