import { z } from 'zod';

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string | null;
  kind: 'developer' | 'pm';
}

export interface AuthSession {
  accessToken: string;
  provider: 'github' | 'slack';
  user: AuthenticatedUser;
}

export const authResponseSchema = z.object({
  accessToken: z.string().min(1),
  created: z.boolean(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    displayName: z.string().nullable(),
    kind: z.enum(['developer', 'pm']),
  }),
});
