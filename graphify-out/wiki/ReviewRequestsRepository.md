# ReviewRequestsRepository

> 19 nodes · cohesion 0.22

## Key Concepts

- **ReviewRequestsRepository** (15 connections) — `apps/api/src/persistence/ports/review-requests.repository.ts`
- **ReviewRequestRecord** (15 connections) — `packages/domain/src/index.ts`
- **review-requests.repository.ts** (13 connections) — `apps/api/src/persistence/adapters/review-requests.repository.ts`
- **ReviewRequestsRepositoryAdapter** (9 connections) — `apps/api/src/persistence/adapters/review-requests.repository.ts`
- **review-requests.repository.ts** (9 connections) — `apps/api/src/persistence/ports/review-requests.repository.ts`
- **InMemoryReviewRequestsRepository** (7 connections) — `tests/apps/api/integration/review-requests/create-draft-review-request.integration.test.ts`
- **mapReviewRequest()** (5 connections) — `apps/api/src/persistence/adapters/mappers.ts`
- **.create()** (4 connections) — `apps/api/src/persistence/adapters/review-requests.repository.ts`
- **.findBySessionId()** (3 connections) — `apps/api/src/persistence/adapters/review-requests.repository.ts`
- **.findManyBySessionIds()** (3 connections) — `apps/api/src/persistence/adapters/review-requests.repository.ts`
- **CreateReviewRequestInput** (3 connections) — `apps/api/src/persistence/ports/review-requests.repository.ts`
- **.create()** (3 connections) — `tests/apps/api/integration/review-requests/create-draft-review-request.integration.test.ts`
- **.create()** (2 connections) — `apps/api/src/persistence/ports/review-requests.repository.ts`
- **.findBySessionId()** (2 connections) — `apps/api/src/persistence/ports/review-requests.repository.ts`
- **.findManyBySessionIds()** (2 connections) — `apps/api/src/persistence/ports/review-requests.repository.ts`
- **.findBySessionId()** (2 connections) — `tests/apps/api/integration/review-requests/create-draft-review-request.integration.test.ts`
- **.findManyBySessionIds()** (2 connections) — `tests/apps/api/integration/review-requests/create-draft-review-request.integration.test.ts`
- **Injectable** (1 connections)
- **.constructor()** (1 connections) — `tests/apps/api/integration/review-requests/create-draft-review-request.integration.test.ts`

## Relationships

- [create-draft-review-request.use-case.ts](create-draft-review-request.use-case.ts.md) (9 shared connections)
- [index.ts](index.ts.md) (4 shared connections)
- [sessions.service.ts](sessions.service.ts.md) (4 shared connections)
- [mappers.ts](mappers.ts.md) (3 shared connections)
- [DatabaseClient](DatabaseClient.md) (2 shared connections)
- [DatabaseExecutor](DatabaseExecutor.md) (2 shared connections)
- [persistence.module.ts](persistence.module.ts.md) (2 shared connections)
- [SourceControlPort](SourceControlPort.md) (1 shared connections)

## Source Files

- `apps/api/src/persistence/adapters/mappers.ts`
- `apps/api/src/persistence/adapters/review-requests.repository.ts`
- `apps/api/src/persistence/ports/review-requests.repository.ts`
- `packages/domain/src/index.ts`
- `tests/apps/api/integration/review-requests/create-draft-review-request.integration.test.ts`

## Audit Trail

- EXTRACTED: 99 (98%)
- INFERRED: 2 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*