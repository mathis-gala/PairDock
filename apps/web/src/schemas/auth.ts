import { z } from 'zod';

export const authenticatedUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  kind: z.enum(['developer', 'pm']),
});

export const authSessionSchema = z.object({
  accessToken: z.string().min(1),
  provider: z.enum(['github', 'slack']),
  user: authenticatedUserSchema,
});

export const authResponseSchema = z.object({
  accessToken: z.string().min(1),
  created: z.boolean(),
  user: authenticatedUserSchema,
});

export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
