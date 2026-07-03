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

export type UiSessionSubscription = z.infer<typeof uiSessionSubscriptionSchema>;
export type SharedProjectSummary = z.infer<typeof sharedProjectSummarySchema>;
