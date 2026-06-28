import { z } from 'zod';
import { uuidSchema } from './common.js';

export const uiSessionSubscriptionSchema = z.object({
  sessionId: uuidSchema,
});

export type UiSessionSubscription = z.infer<typeof uiSessionSubscriptionSchema>;
