import { z } from 'zod';

export const startAgentPairingInputSchema = z.object({ deviceName: z.string().trim().min(1).max(100) }).strict();
export const claimAgentPairingInputSchema = z.object({ deviceCode: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).strict();
export const agentPairingUserCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .transform((value) => value.replaceAll('-', ''))
  .pipe(z.string().regex(/^[A-HJ-NP-Z2-9]{8}$/));
export const approveAgentPairingInputSchema = z.object({ userCode: agentPairingUserCodeSchema }).strict();

export const agentPairingStartedSchema = z.object({
  deviceCode: z.string(),
  userCode: z.string(),
  verificationUrl: z.string().url(),
  expiresAt: z.string().datetime(),
  intervalSeconds: z.number().int().positive(),
});
export const agentPairingDetailsSchema = z.object({
  deviceName: z.string(),
  userCode: z.string(),
  expiresAt: z.string().datetime(),
});
export const agentPairingClaimSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('pending') }),
  z.object({
    status: z.literal('paired'),
    agentId: z.string(),
    authToken: z.string(),
    projectKeyPrefix: z.string(),
    ownerName: z.string(),
  }),
]);
export const developerAgentSchema = z.object({
  agentId: z.string(),
  deviceName: z.string(),
  connected: z.boolean(),
  pairedAt: z.string().datetime(),
  lastSeenAt: z.string().datetime(),
  revokedAt: z.string().datetime().nullable(),
});
export const developerAgentsSchema = z.array(developerAgentSchema);

export type StartAgentPairingInput = z.infer<typeof startAgentPairingInputSchema>;
export type AgentPairingStarted = z.infer<typeof agentPairingStartedSchema>;
export type AgentPairingDetails = z.infer<typeof agentPairingDetailsSchema>;
export type AgentPairingClaim = z.infer<typeof agentPairingClaimSchema>;
export type DeveloperAgent = z.infer<typeof developerAgentSchema>;
