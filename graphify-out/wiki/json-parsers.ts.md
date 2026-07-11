# json-parsers.ts

> 25 nodes · cohesion 0.13

## Key Concepts

- **json-parsers.ts** (20 connections) — `apps/api/src/persistence/adapters/json-parsers.ts`
- **project-readiness.repository.ts** (15 connections) — `apps/api/src/persistence/adapters/project-readiness.repository.ts`
- **ProjectReadinessSnapshot** (13 connections) — `packages/domain/src/index.ts`
- **ProjectReadinessRepositoryAdapter** (9 connections) — `apps/api/src/persistence/adapters/project-readiness.repository.ts`
- **mapProjectReadinessSnapshot()** (6 connections) — `apps/api/src/persistence/adapters/mappers.ts`
- **serializeJsonObject()** (5 connections) — `apps/api/src/persistence/adapters/json-parsers.ts`
- **.upsert()** (5 connections) — `apps/api/src/persistence/adapters/project-readiness.repository.ts`
- **.updateMetadata()** (4 connections) — `apps/api/src/persistence/adapters/external-identities.repository.ts`
- **parseToolReadinessChecks()** (4 connections) — `apps/api/src/persistence/adapters/json-parsers.ts`
- **parseToolReadinessCheck()** (4 connections) — `apps/api/src/persistence/adapters/json-parsers.ts`
- **serializeChecks()** (4 connections) — `apps/api/src/persistence/adapters/json-parsers.ts`
- **UpsertProjectReadinessInput** (4 connections) — `apps/api/src/persistence/ports/project-readiness.repository.ts`
- **toInputJsonValue()** (3 connections) — `apps/api/src/persistence/adapters/json-parsers.ts`
- **toInputJsonObject()** (3 connections) — `apps/api/src/persistence/adapters/json-parsers.ts`
- **.findByProjectId()** (3 connections) — `apps/api/src/persistence/adapters/project-readiness.repository.ts`
- **.findManyByProjectIds()** (3 connections) — `apps/api/src/persistence/adapters/project-readiness.repository.ts`
- **isToolReadinessKey()** (2 connections) — `apps/api/src/persistence/adapters/json-parsers.ts`
- **isToolReadinessStatus()** (2 connections) — `apps/api/src/persistence/adapters/json-parsers.ts`
- **serializeToolReadinessCheck()** (2 connections) — `apps/api/src/persistence/adapters/json-parsers.ts`
- **.upsert()** (2 connections) — `apps/api/src/persistence/ports/project-readiness.repository.ts`
- **.findByProjectId()** (2 connections) — `apps/api/src/persistence/ports/project-readiness.repository.ts`
- **.findManyByProjectIds()** (2 connections) — `apps/api/src/persistence/ports/project-readiness.repository.ts`
- **ToolReadinessKey** (2 connections) — `packages/domain/src/index.ts`
- **ToolReadinessStatus** (2 connections) — `packages/domain/src/index.ts`
- **Injectable** (1 connections)

## Relationships

- [index.ts](index.ts.md) (16 shared connections)
- [external-identities.repository.ts](external-identities.repository.ts.md) (7 shared connections)
- [mappers.ts](mappers.ts.md) (5 shared connections)
- [agent-events.repository.ts](agent-events.repository.ts.md) (3 shared connections)
- [DatabaseClient](DatabaseClient.md) (2 shared connections)
- [DatabaseExecutor](DatabaseExecutor.md) (2 shared connections)
- [create-draft-review-request.use-case.ts](create-draft-review-request.use-case.ts.md) (2 shared connections)
- [persistence.module.ts](persistence.module.ts.md) (2 shared connections)
- [agent-registrations.repository.ts](agent-registrations.repository.ts.md) (1 shared connections)
- [sessions.service.ts](sessions.service.ts.md) (1 shared connections)
- [PairDockIdentity](PairDockIdentity.md) (1 shared connections)

## Source Files

- `apps/api/src/persistence/adapters/external-identities.repository.ts`
- `apps/api/src/persistence/adapters/json-parsers.ts`
- `apps/api/src/persistence/adapters/mappers.ts`
- `apps/api/src/persistence/adapters/project-readiness.repository.ts`
- `apps/api/src/persistence/ports/project-readiness.repository.ts`
- `packages/domain/src/index.ts`

## Audit Trail

- EXTRACTED: 118 (97%)
- INFERRED: 4 (3%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*