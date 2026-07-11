# agent-client.ts

> 25 nodes · cohesion 0.17

## Key Concepts

- **agent-client.ts** (54 connections) — `packages/local-agent/src/websocket/agent-client.ts`
- **message-codecs.ts** (32 connections) — `packages/local-agent/src/websocket/message-codecs.ts`
- **.handleAgentPrompt()** (12 connections) — `packages/local-agent/src/websocket/agent-client.ts`
- **buildEnvelope()** (12 connections) — `packages/local-agent/src/websocket/message-codecs.ts`
- **buildSessionProgressEvent()** (5 connections) — `packages/local-agent/src/websocket/message-codecs.ts`
- **buildAgentConnectedEvent()** (4 connections) — `packages/local-agent/src/websocket/message-codecs.ts`
- **buildSessionReadyEvent()** (4 connections) — `packages/local-agent/src/websocket/message-codecs.ts`
- **buildAgentOutputEvent()** (4 connections) — `packages/local-agent/src/websocket/message-codecs.ts`
- **buildAgentDoneEvent()** (4 connections) — `packages/local-agent/src/websocket/message-codecs.ts`
- **buildGitDiffEvent()** (4 connections) — `packages/local-agent/src/websocket/message-codecs.ts`
- **buildGitBranchPushedEvent()** (4 connections) — `packages/local-agent/src/websocket/message-codecs.ts`
- **buildChecksResultEvent()** (4 connections) — `packages/local-agent/src/websocket/message-codecs.ts`
- **buildSessionClosedEvent()** (4 connections) — `packages/local-agent/src/websocket/message-codecs.ts`
- **buildErrorEvent()** (4 connections) — `packages/local-agent/src/websocket/message-codecs.ts`
- **AgentPromptCommandEnvelope** (4 connections) — `packages/shared-contracts/src/protocol/commands.ts`
- **parseAgentCommandEnvelope()** (3 connections) — `packages/local-agent/src/websocket/message-codecs.ts`
- **isRetryableError()** (2 connections) — `packages/local-agent/src/websocket/agent-client.ts`
- **ReadinessResultEventEnvelope** (2 connections) — `packages/shared-contracts/src/protocol/events.ts`
- **SessionReadyEventEnvelope** (2 connections) — `packages/shared-contracts/src/protocol/events.ts`
- **AgentOutputEventEnvelope** (2 connections) — `packages/shared-contracts/src/protocol/events.ts`
- **GitDiffEventEnvelope** (2 connections) — `packages/shared-contracts/src/protocol/events.ts`
- **GitBranchPushedEventEnvelope** (2 connections) — `packages/shared-contracts/src/protocol/events.ts`
- **SessionClosedEventEnvelope** (2 connections) — `packages/shared-contracts/src/protocol/events.ts`
- **EnvelopeMetadata** (1 connections) — `packages/local-agent/src/websocket/message-codecs.ts`
- **AgentEventEnvelopeInput** (1 connections) — `packages/local-agent/src/websocket/message-codecs.ts`

## Relationships

- [AgentClient](AgentClient.md) (18 shared connections)
- [events.ts](events.ts.md) (13 shared connections)
- [agent-config.ts](agent-config.ts.md) (6 shared connections)
- [session-runner.ts](session-runner.ts.md) (5 shared connections)
- [checks-runner.ts](checks-runner.ts.md) (4 shared connections)
- [index.ts](index.ts.md) (3 shared connections)
- [agent-client.integration.test.ts](agent-client.integration.test.ts.md) (3 shared connections)
- [AgentEventEnvelope](AgentEventEnvelope.md) (3 shared connections)
- [diff.service.ts](diff.service.ts.md) (2 shared connections)
- [codex-harness.adapter.ts](codex-harness.adapter.ts.md) (2 shared connections)
- [.constructor](constructor.md) (2 shared connections)
- [readiness-runner.ts](readiness-runner.ts.md) (2 shared connections)

## Source Files

- `packages/local-agent/src/websocket/agent-client.ts`
- `packages/local-agent/src/websocket/message-codecs.ts`
- `packages/shared-contracts/src/protocol/commands.ts`
- `packages/shared-contracts/src/protocol/events.ts`

## Audit Trail

- EXTRACTED: 173 (99%)
- INFERRED: 1 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*