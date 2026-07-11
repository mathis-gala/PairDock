# ConnectedAgentsRegistry

> 28 nodes · cohesion 0.10

## Key Concepts

- **ConnectedAgentsRegistry** (26 connections) — `apps/api/src/agent-gateway/connected-agents.registry.ts`
- **AgentGateway** (19 connections) — `apps/api/src/agent-gateway/agent.gateway.ts`
- **AgentCommandEnvelope** (17 connections) — `packages/shared-contracts/src/protocol/commands.ts`
- **connected-agents.registry.ts** (15 connections) — `apps/api/src/agent-gateway/connected-agents.registry.ts`
- **.routeToOwningAgent()** (9 connections) — `apps/api/src/agent-gateway/agent-command-router.service.ts`
- **.findSocketId()** (9 connections) — `apps/api/src/agent-gateway/connected-agents.registry.ts`
- **.constructor()** (8 connections) — `apps/api/src/agent-gateway/agent.gateway.ts`
- **.prepareSessionIfAgentOnline()** (7 connections) — `apps/api/src/sessions/sessions.service.ts`
- **.emitToAgent()** (5 connections) — `apps/api/src/agent-gateway/agent.gateway.ts`
- **.emitToAgentAndWait()** (5 connections) — `apps/api/src/agent-gateway/agent.gateway.ts`
- **RecordingAgentCommandRouter** (4 connections) — `tests/apps/api/integration/review-requests/create-draft-review-request.integration.test.ts`
- **.handleDisconnect()** (3 connections) — `apps/api/src/agent-gateway/agent.gateway.ts`
- **.findAgentId()** (3 connections) — `apps/api/src/agent-gateway/connected-agents.registry.ts`
- **cloneSnapshot()** (3 connections) — `apps/api/src/agent-gateway/connected-agents.registry.ts`
- **isCommandAcknowledgement()** (2 connections) — `apps/api/src/agent-gateway/agent.gateway.ts`
- **.unregister()** (2 connections) — `apps/api/src/agent-gateway/connected-agents.registry.ts`
- **.findSnapshot()** (2 connections) — `apps/api/src/agent-gateway/connected-agents.registry.ts`
- **.findSocketIdByProjectKey()** (2 connections) — `apps/api/src/agent-gateway/connected-agents.registry.ts`
- **buildSessionPrepareCommand()** (2 connections) — `apps/api/src/sessions/sessions.service.ts`
- **.routeToOwningAgent()** (2 connections) — `tests/apps/api/integration/review-requests/create-draft-review-request.integration.test.ts`
- **connected-agents.registry.test.ts** (2 connections) — `tests/apps/api/unit/agent-gateway/connected-agents.registry.test.ts`
- **Injectable** (1 connections)
- **WebSocketGateway** (1 connections)
- **WebSocketServer** (1 connections)
- **Inject** (1 connections)
- *... and 3 more nodes in this community*

## Relationships

- [index.ts](index.ts.md) (15 shared connections)
- [sessions.service.ts](sessions.service.ts.md) (10 shared connections)
- [AgentEventEnvelope](AgentEventEnvelope.md) (7 shared connections)
- [tool-readiness.integration.test.ts](tool-readiness.integration.test.ts.md) (7 shared connections)
- [PairDockIdentity](PairDockIdentity.md) (4 shared connections)
- [persistence.module.ts](persistence.module.ts.md) (3 shared connections)
- [create-draft-review-request.use-case.ts](create-draft-review-request.use-case.ts.md) (3 shared connections)
- [mvp-flow.e2e.test.ts](mvp-flow.e2e.test.ts.md) (3 shared connections)
- [SessionsService](SessionsService.md) (3 shared connections)
- [SessionPromptService](SessionPromptService.md) (2 shared connections)
- [ValidationService](ValidationService.md) (2 shared connections)
- [AppModule](AppModule.md) (2 shared connections)

## Source Files

- `apps/api/src/agent-gateway/agent-command-router.service.ts`
- `apps/api/src/agent-gateway/agent.gateway.ts`
- `apps/api/src/agent-gateway/connected-agents.registry.ts`
- `apps/api/src/sessions/sessions.service.ts`
- `packages/shared-contracts/src/protocol/commands.ts`
- `tests/apps/api/integration/review-requests/create-draft-review-request.integration.test.ts`
- `tests/apps/api/unit/agent-gateway/connected-agents.registry.test.ts`

## Audit Trail

- EXTRACTED: 150 (97%)
- INFERRED: 4 (3%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*