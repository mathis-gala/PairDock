# DatabaseClient

> 17 nodes · cohesion 0.13

## Key Concepts

- **DatabaseClient** (38 connections) — `apps/api/src/persistence/client.ts`
- **client.ts** (35 connections) — `apps/api/src/persistence/client.ts`
- **session-details.integration.test.ts** (13 connections) — `tests/apps/api/integration/sessions/session-details.integration.test.ts`
- **.constructor()** (3 connections) — `apps/api/src/persistence/adapters/unit-of-work.ts`
- **buildAdapter()** (2 connections) — `apps/api/src/persistence/client.ts`
- **.constructor()** (2 connections) — `apps/api/src/persistence/client.ts`
- **startApplication()** (2 connections) — `tests/apps/api/integration/sessions/session-details.integration.test.ts`
- **authenticatePm()** (2 connections) — `tests/apps/api/integration/sessions/session-details.integration.test.ts`
- **sessionDetailsResponseSchema** (2 connections) — `tests/apps/api/integration/test-json.ts`
- **Inject** (1 connections)
- **currentDirectory** (1 connections) — `apps/api/src/persistence/client.ts`
- **Injectable** (1 connections)
- **.onModuleInit()** (1 connections) — `apps/api/src/persistence/client.ts`
- **.onModuleDestroy()** (1 connections) — `apps/api/src/persistence/client.ts`
- **prisma** (1 connections) — `tests/apps/api/integration/sessions/session-details.integration.test.ts`
- **resetDatabase()** (1 connections) — `tests/apps/api/integration/sessions/session-details.integration.test.ts`
- **createSessionFixture()** (1 connections) — `tests/apps/api/integration/sessions/session-details.integration.test.ts`

## Relationships

- [test-json.ts](test-json.ts.md) (7 shared connections)
- [create-draft-review-request.use-case.ts](create-draft-review-request.use-case.ts.md) (6 shared connections)
- [index.ts](index.ts.md) (4 shared connections)
- [mvp-flow.e2e.test.ts](mvp-flow.e2e.test.ts.md) (4 shared connections)
- [AppModule](AppModule.md) (4 shared connections)
- [tool-readiness.integration.test.ts](tool-readiness.integration.test.ts.md) (4 shared connections)
- [persistence.module.ts](persistence.module.ts.md) (3 shared connections)
- [agent-events.repository.ts](agent-events.repository.ts.md) (2 shared connections)
- [agent-registrations.repository.ts](agent-registrations.repository.ts.md) (2 shared connections)
- [external-identities.repository.ts](external-identities.repository.ts.md) (2 shared connections)
- [mappers.ts](mappers.ts.md) (2 shared connections)
- [ProjectMembersRepository](ProjectMembersRepository.md) (2 shared connections)

## Source Files

- `apps/api/src/persistence/adapters/unit-of-work.ts`
- `apps/api/src/persistence/client.ts`
- `tests/apps/api/integration/sessions/session-details.integration.test.ts`
- `tests/apps/api/integration/test-json.ts`

## Audit Trail

- EXTRACTED: 106 (99%)
- INFERRED: 1 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*