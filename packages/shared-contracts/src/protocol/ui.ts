import { z } from 'zod';
import { uuidSchema } from './common.js';

export const uiSessionSubscriptionSchema = z.object({
  sessionId: uuidSchema,
});

export const sharedProjectSummarySchema = z.object({
  id: uuidSchema,
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  ownerDisplayName: z.string().min(1),
  repoFullName: z.string().min(1),
  defaultBranch: z.string().min(1),
  defaultModelId: z.string().min(1),
  agentAvailability: z.enum(['online', 'offline', 'unknown']),
  canStartSession: z.boolean(),
  unavailableReason: z.string().min(1).nullable().optional(),
});

export const sharedProjectSummaryListSchema = z.array(sharedProjectSummarySchema);

export const developerProjectSessionSummarySchema = z.object({
  id: uuidSchema,
  status: z.string().min(1),
  modelId: z.string().min(1),
  createdAt: z.string().min(1),
  closedAt: z.string().nullable(),
});

export const developerProjectSummarySchema = z.object({
  id: uuidSchema,
  name: z.string().min(1),
  description: z.string().nullable(),
  repoFullName: z.string().min(1),
  defaultBranch: z.string().min(1),
  defaultModelId: z.string().min(1),
  agentProjectKey: z.string().min(1),
  sourceControlAccountLogin: z.string().min(1),
  pmCanStartSessions: z.boolean(),
  pmMemberCount: z.number().int().nonnegative(),
  agentAvailability: z.enum(['online', 'offline']),
  sessions: z.array(developerProjectSessionSummarySchema),
});

export const developerProjectSummaryListSchema = z.array(developerProjectSummarySchema);

export const createDeveloperProjectInputSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  repoFullName: z.string().trim().min(1),
  defaultBranch: z.string().trim().min(1),
  defaultModelId: z.string().trim().min(1),
  agentProjectKey: z.string().trim().min(1),
  pmCanStartSessions: z.boolean().optional(),
  sourceControl: z.object({
    providerConnectionId: z.string().trim().min(1),
    accountLogin: z.string().trim().min(1),
  }),
});

export const shareDeveloperProjectInputSchema = z.object({
  pmEmail: z.string().trim().email(),
});

export type UiSessionSubscription = z.infer<typeof uiSessionSubscriptionSchema>;
export type SharedProjectSummary = z.infer<typeof sharedProjectSummarySchema>;
export type DeveloperProjectSessionSummary = z.infer<typeof developerProjectSessionSummarySchema>;
export type DeveloperProjectSummary = z.infer<typeof developerProjectSummarySchema>;
export type CreateDeveloperProjectInput = z.infer<typeof createDeveloperProjectInputSchema>;
export type ShareDeveloperProjectInput = z.infer<typeof shareDeveloperProjectInputSchema>;
