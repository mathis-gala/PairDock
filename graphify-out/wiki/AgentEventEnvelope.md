# AgentEventEnvelope

> 11 nodes · cohesion 0.25

## Key Concepts

- **AgentEventEnvelope** (21 connections) — `packages/shared-contracts/src/protocol/events.ts`
- **.handleAgentProtocolMessage()** (11 connections) — `apps/api/src/agent-gateway/agent.gateway.ts`
- **.resolveAgentId()** (5 connections) — `apps/api/src/agent-gateway/agent.gateway.ts`
- **.isAgentConnectedEvent()** (5 connections) — `apps/api/src/agent-gateway/agent.gateway.ts`
- **.resolveSessionId()** (4 connections) — `apps/api/src/agent-gateway/agent.gateway.ts`
- **.isErrorEvent()** (4 connections) — `apps/api/src/agent-gateway/agent.gateway.ts`
- **ErrorEventEnvelope** (4 connections) — `packages/shared-contracts/src/protocol/events.ts`
- **.register()** (2 connections) — `apps/api/src/agent-gateway/connected-agents.registry.ts`
- **SubscribeMessage** (1 connections)
- **MessageBody** (1 connections)
- **ConnectedSocket** (1 connections)

## Relationships

- [ConnectedAgentsRegistry](ConnectedAgentsRegistry.md) (7 shared connections)
- [sessions.service.ts](sessions.service.ts.md) (3 shared connections)
- [agent-client.ts](agent-client.ts.md) (3 shared connections)
- [ValidationService](ValidationService.md) (2 shared connections)
- [UiGateway](UiGateway.md) (2 shared connections)
- [AgentClient](AgentClient.md) (2 shared connections)
- [events.ts](events.ts.md) (2 shared connections)
- [agent-client.integration.test.ts](agent-client.integration.test.ts.md) (1 shared connections)
- [agent-gateway.integration.test.ts](agent-gateway.integration.test.ts.md) (1 shared connections)
- [validation.integration.test.ts](validation.integration.test.ts.md) (1 shared connections)
- [auth.integration.test.ts](auth.integration.test.ts.md) (1 shared connections)
- [shared-projects.integration.test.ts](shared-projects.integration.test.ts.md) (1 shared connections)

## Source Files

- `apps/api/src/agent-gateway/agent.gateway.ts`
- `apps/api/src/agent-gateway/connected-agents.registry.ts`
- `packages/shared-contracts/src/protocol/events.ts`

## Audit Trail

- EXTRACTED: 58 (98%)
- INFERRED: 1 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*