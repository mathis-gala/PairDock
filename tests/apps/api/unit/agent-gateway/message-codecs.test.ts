import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import {
  AGENT_PROTOCOL_VERSION,
  agentCommandEnvelopeSchema,
  agentConnectedEventEnvelopeSchema,
  agentEventEnvelopeSchema,
} from '@pairdock/shared-contracts';

test('BT-009: shared Zod command codecs parse a valid agent.prompt payload', () => {
  const sessionId = randomUUID();

  const parsed = agentCommandEnvelopeSchema.parse({
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: randomUUID(),
    sessionId,
    type: 'agent.prompt',
    payload: {
      sessionId,
      prompt: 'Refactor the preview route',
      modelId: 'codex-cli/gpt-5.4',
    },
    sentAt: new Date().toISOString(),
  });

  if (parsed.type !== 'agent.prompt') {
    assert.fail(`Expected agent.prompt, received ${parsed.type}`);
  }

  assert.equal(parsed.type, 'agent.prompt');
  assert.equal(parsed.payload.prompt, 'Refactor the preview route');
  assert.equal(parsed.payload.modelId, 'codex-cli/gpt-5.4');
});

test('BT-010: shared Zod event codecs reject an event without protocolVersion', () => {
  const result = agentEventEnvelopeSchema.safeParse({
    messageId: randomUUID(),
    sessionId: randomUUID(),
    type: 'agent.output',
    payload: {
      sessionId: randomUUID(),
      stream: 'stdout',
      text: 'hello from the local agent',
    },
    sentAt: new Date().toISOString(),
  });

  assert.equal(result.success, false);
});

test('shared Zod codecs reject oversized prompt and agent output payloads', () => {
  const sessionId = randomUUID();
  const envelope = {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: randomUUID(),
    sessionId,
    sentAt: new Date().toISOString(),
  };

  const prompt = agentCommandEnvelopeSchema.safeParse({
    ...envelope,
    type: 'agent.prompt',
    payload: {
      sessionId,
      prompt: 'x'.repeat(20 * 1024 + 1),
      modelId: 'codex-cli/gpt-5.4',
    },
  });
  const output = agentEventEnvelopeSchema.safeParse({
    ...envelope,
    type: 'agent.output',
    payload: {
      sessionId,
      stream: 'stdout',
      text: 'x'.repeat(64 * 1024 + 1),
    },
  });

  assert.equal(prompt.success, false);
  assert.equal(output.success, false);
});

test('BT-042: shared Zod codecs reject mismatched envelope and payload session ids', () => {
  const result = agentCommandEnvelopeSchema.safeParse({
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: randomUUID(),
    sessionId: randomUUID(),
    type: 'agent.prompt',
    payload: {
      sessionId: randomUUID(),
      prompt: 'Refactor the preview route',
      modelId: 'codex-cli/gpt-5.4',
    },
    sentAt: new Date().toISOString(),
  });

  assert.equal(result.success, false);
});

test('V1: shared Zod codecs parse extended agent.connected metadata', () => {
  const parsed = agentConnectedEventEnvelopeSchema.parse({
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: randomUUID(),
    type: 'agent.connected',
    payload: {
      agentId: 'local-agent-1',
      capabilities: ['session.prepare'],
      models: [{ id: 'agent/gpt-5', label: 'GPT-5', provider: 'local' }],
      projects: [
        {
          key: 'pairdock',
          name: 'PairDock',
          repoFullName: 'mathis-gala/PairDock',
          pathAlias: 'PairDock',
          defaultBranch: 'main',
          models: ['agent/gpt-5'],
        },
      ],
    },
    sentAt: new Date().toISOString(),
  });

  assert.equal(parsed.payload.models[0]?.id, 'agent/gpt-5');
  assert.equal(parsed.payload.projects[0]?.repoFullName, 'mathis-gala/PairDock');
});
