import { z } from 'zod';

export const protocolVersionSchema = z.literal('1.0');

export const codexPromptCommandSchema = z.object({
  protocolVersion: protocolVersionSchema,
  type: z.literal('codex.prompt'),
  sessionId: z.string().uuid(),
  prompt: z.string().min(1),
  requestedByUserId: z.string().uuid(),
});

export const sessionPrepareCommandSchema = z.object({
  protocolVersion: protocolVersionSchema,
  type: z.literal('session.prepare'),
  sessionId: z.string().uuid(),
  projectId: z.string().uuid(),
  branchName: z.string().min(1),
});

export const agentConnectedEventSchema = z.object({
  protocolVersion: protocolVersionSchema,
  type: z.literal('agent.connected'),
  agentId: z.string().min(1),
  capabilities: z.object({
    canPrepareSession: z.boolean(),
    canRunCodex: z.boolean(),
    canExposePreview: z.boolean(),
  }),
});

export const codexOutputEventSchema = z.object({
  protocolVersion: protocolVersionSchema,
  type: z.literal('codex.output'),
  sessionId: z.string().uuid(),
  stream: z.enum(['stdout', 'stderr']),
  chunk: z.string(),
});

export const agentCommandSchema = z.discriminatedUnion('type', [
  codexPromptCommandSchema,
  sessionPrepareCommandSchema,
]);

export const agentEventSchema = z.discriminatedUnion('type', [
  agentConnectedEventSchema,
  codexOutputEventSchema,
]);

export type ProtocolVersion = z.infer<typeof protocolVersionSchema>;
export type CodexPromptCommand = z.infer<typeof codexPromptCommandSchema>;
export type SessionPrepareCommand = z.infer<typeof sessionPrepareCommandSchema>;
export type AgentConnectedEvent = z.infer<typeof agentConnectedEventSchema>;
export type CodexOutputEvent = z.infer<typeof codexOutputEventSchema>;
export type AgentCommand = z.infer<typeof agentCommandSchema>;
export type AgentEvent = z.infer<typeof agentEventSchema>;
