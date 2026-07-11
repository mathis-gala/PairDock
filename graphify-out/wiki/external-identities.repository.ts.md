# external-identities.repository.ts

> 21 nodes · cohesion 0.19

## Key Concepts

- **external-identities.repository.ts** (16 connections) — `apps/api/src/persistence/adapters/external-identities.repository.ts`
- **ExternalIdentity** (15 connections) — `packages/domain/src/index.ts`
- **ExternalIdentitiesRepository** (14 connections) — `apps/api/src/persistence/ports/external-identities.repository.ts`
- **ExternalIdentitiesRepositoryAdapter** (12 connections) — `apps/api/src/persistence/adapters/external-identities.repository.ts`
- **mapExternalIdentity()** (9 connections) — `apps/api/src/persistence/adapters/mappers.ts`
- **external-identities.repository.ts** (8 connections) — `apps/api/src/persistence/ports/external-identities.repository.ts`
- **seedSessionFixture()** (7 connections) — `tests/apps/api/integration/persistence/persistence.integration.test.ts`
- **.create()** (6 connections) — `apps/api/src/persistence/adapters/external-identities.repository.ts`
- **parseJsonObject()** (4 connections) — `apps/api/src/persistence/adapters/json-parsers.ts`
- **CreateExternalIdentityInput** (4 connections) — `apps/api/src/persistence/ports/external-identities.repository.ts`
- **.constructor()** (3 connections) — `apps/api/src/persistence/adapters/external-identities.repository.ts`
- **.findById()** (3 connections) — `apps/api/src/persistence/adapters/external-identities.repository.ts`
- **.findByUserAndProvider()** (3 connections) — `apps/api/src/persistence/adapters/external-identities.repository.ts`
- **.findByProviderIdentity()** (3 connections) — `apps/api/src/persistence/adapters/external-identities.repository.ts`
- **.create()** (2 connections) — `apps/api/src/persistence/ports/external-identities.repository.ts`
- **.findById()** (2 connections) — `apps/api/src/persistence/ports/external-identities.repository.ts`
- **.findByUserAndProvider()** (2 connections) — `apps/api/src/persistence/ports/external-identities.repository.ts`
- **.findByProviderIdentity()** (2 connections) — `apps/api/src/persistence/ports/external-identities.repository.ts`
- **.updateMetadata()** (2 connections) — `apps/api/src/persistence/ports/external-identities.repository.ts`
- **Injectable** (1 connections)
- **Inject** (1 connections)

## Relationships

- [json-parsers.ts](json-parsers.ts.md) (7 shared connections)
- [mappers.ts](mappers.ts.md) (5 shared connections)
- [index.ts](index.ts.md) (5 shared connections)
- [create-draft-review-request.use-case.ts](create-draft-review-request.use-case.ts.md) (5 shared connections)
- [persistence.integration.test.ts](persistence.integration.test.ts.md) (3 shared connections)
- [DatabaseClient](DatabaseClient.md) (2 shared connections)
- [DatabaseExecutor](DatabaseExecutor.md) (2 shared connections)
- [persistence.module.ts](persistence.module.ts.md) (2 shared connections)
- [auth.service.ts](auth.service.ts.md) (2 shared connections)
- [sessions.service.ts](sessions.service.ts.md) (2 shared connections)
- [agent-events.repository.ts](agent-events.repository.ts.md) (1 shared connections)
- [github-developer-identity.adapter.ts](github-developer-identity.adapter.ts.md) (1 shared connections)

## Source Files

- `apps/api/src/persistence/adapters/external-identities.repository.ts`
- `apps/api/src/persistence/adapters/json-parsers.ts`
- `apps/api/src/persistence/adapters/mappers.ts`
- `apps/api/src/persistence/ports/external-identities.repository.ts`
- `packages/domain/src/index.ts`
- `tests/apps/api/integration/persistence/persistence.integration.test.ts`

## Audit Trail

- EXTRACTED: 119 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*