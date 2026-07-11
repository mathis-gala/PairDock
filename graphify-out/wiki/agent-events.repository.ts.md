# agent-events.repository.ts

> 21 nodes · cohesion 0.19

## Key Concepts

- **agent-events.repository.ts** (16 connections) — `apps/api/src/persistence/adapters/agent-events.repository.ts`
- **AgentEventsRepository** (14 connections) — `apps/api/src/persistence/ports/agent-events.repository.ts`
- **agent-events.repository.ts** (10 connections) — `apps/api/src/persistence/ports/agent-events.repository.ts`
- **AgentEventsRepositoryAdapter** (9 connections) — `apps/api/src/persistence/adapters/agent-events.repository.ts`
- **AgentEventRecord** (9 connections) — `packages/domain/src/index.ts`
- **diff.service.ts** (8 connections) — `apps/api/src/diff/diff.service.ts`
- **DiffService** (7 connections) — `apps/api/src/diff/diff.service.ts`
- **diff.service.test.ts** (7 connections) — `tests/apps/api/unit/diff/diff.service.test.ts`
- **serializeJsonValue()** (6 connections) — `apps/api/src/persistence/adapters/json-parsers.ts`
- **.create()** (5 connections) — `apps/api/src/persistence/adapters/agent-events.repository.ts`
- **mapAgentEvent()** (5 connections) — `apps/api/src/persistence/adapters/mappers.ts`
- **.listBySessionId()** (3 connections) — `apps/api/src/persistence/adapters/agent-events.repository.ts`
- **CreateAgentEventInput** (3 connections) — `apps/api/src/persistence/ports/agent-events.repository.ts`
- **.constructor()** (2 connections) — `apps/api/src/diff/diff.service.ts`
- **.getLatestDiff()** (2 connections) — `apps/api/src/diff/diff.service.ts`
- **isSessionDiffPayload()** (2 connections) — `apps/api/src/diff/diff.service.ts`
- **.create()** (2 connections) — `apps/api/src/persistence/ports/agent-events.repository.ts`
- **.listBySessionId()** (2 connections) — `apps/api/src/persistence/ports/agent-events.repository.ts`
- **SessionDiffView** (1 connections) — `apps/api/src/diff/diff.service.ts`
- **Injectable** (1 connections)
- **buildAgentEventRecord()** (1 connections) — `tests/apps/api/unit/diff/diff.service.test.ts`

## Relationships

- [sessions.service.ts](sessions.service.ts.md) (6 shared connections)
- [index.ts](index.ts.md) (6 shared connections)
- [create-draft-review-request.use-case.ts](create-draft-review-request.use-case.ts.md) (5 shared connections)
- [persistence.module.ts](persistence.module.ts.md) (4 shared connections)
- [json-parsers.ts](json-parsers.ts.md) (3 shared connections)
- [mappers.ts](mappers.ts.md) (3 shared connections)
- [DatabaseClient](DatabaseClient.md) (2 shared connections)
- [DatabaseExecutor](DatabaseExecutor.md) (2 shared connections)
- [persistence.integration.test.ts](persistence.integration.test.ts.md) (2 shared connections)
- [agent-registrations.repository.ts](agent-registrations.repository.ts.md) (2 shared connections)
- [external-identities.repository.ts](external-identities.repository.ts.md) (1 shared connections)
- [ConnectedAgentsRegistry](ConnectedAgentsRegistry.md) (1 shared connections)

## Source Files

- `apps/api/src/diff/diff.service.ts`
- `apps/api/src/persistence/adapters/agent-events.repository.ts`
- `apps/api/src/persistence/adapters/json-parsers.ts`
- `apps/api/src/persistence/adapters/mappers.ts`
- `apps/api/src/persistence/ports/agent-events.repository.ts`
- `packages/domain/src/index.ts`
- `tests/apps/api/unit/diff/diff.service.test.ts`

## Audit Trail

- EXTRACTED: 113 (98%)
- INFERRED: 2 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*