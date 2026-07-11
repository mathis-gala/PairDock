# SessionMember

> 15 nodes · cohesion 0.20

## Key Concepts

- **SessionMember** (17 connections) — `packages/domain/src/index.ts`
- **session-members.repository.ts** (14 connections) — `apps/api/src/persistence/adapters/session-members.repository.ts`
- **SessionMembersRepositoryAdapter** (10 connections) — `apps/api/src/persistence/adapters/session-members.repository.ts`
- **mapSessionMember()** (5 connections) — `apps/api/src/persistence/adapters/mappers.ts`
- **.add()** (5 connections) — `apps/api/src/persistence/adapters/session-members.repository.ts`
- **.constructor()** (3 connections) — `apps/api/src/persistence/adapters/session-members.repository.ts`
- **.listBySessionId()** (3 connections) — `apps/api/src/persistence/adapters/session-members.repository.ts`
- **.findBySessionIdAndUserId()** (3 connections) — `apps/api/src/persistence/adapters/session-members.repository.ts`
- **AddSessionMemberInput** (3 connections) — `apps/api/src/persistence/ports/session-members.repository.ts`
- **CreatePromptRequest** (3 connections) — `apps/api/src/sessions/session-prompt.service.ts`
- **.add()** (2 connections) — `apps/api/src/persistence/ports/session-members.repository.ts`
- **.listBySessionId()** (2 connections) — `apps/api/src/persistence/ports/session-members.repository.ts`
- **.findBySessionIdAndUserId()** (2 connections) — `apps/api/src/persistence/ports/session-members.repository.ts`
- **Injectable** (1 connections)
- **Inject** (1 connections)

## Relationships

- [create-draft-review-request.use-case.ts](create-draft-review-request.use-case.ts.md) (10 shared connections)
- [index.ts](index.ts.md) (4 shared connections)
- [mappers.ts](mappers.ts.md) (3 shared connections)
- [DatabaseClient](DatabaseClient.md) (2 shared connections)
- [DatabaseExecutor](DatabaseExecutor.md) (2 shared connections)
- [persistence.module.ts](persistence.module.ts.md) (2 shared connections)
- [persistence.integration.test.ts](persistence.integration.test.ts.md) (2 shared connections)
- [sessions.controller.ts](sessions.controller.ts.md) (2 shared connections)
- [external-identities.repository.ts](external-identities.repository.ts.md) (1 shared connections)
- [PairDockIdentity](PairDockIdentity.md) (1 shared connections)
- [AuthTokenService](AuthTokenService.md) (1 shared connections)
- [AuthenticatedRequest](AuthenticatedRequest.md) (1 shared connections)

## Source Files

- `apps/api/src/persistence/adapters/mappers.ts`
- `apps/api/src/persistence/adapters/session-members.repository.ts`
- `apps/api/src/persistence/ports/session-members.repository.ts`
- `apps/api/src/sessions/session-prompt.service.ts`
- `packages/domain/src/index.ts`

## Audit Trail

- EXTRACTED: 72 (97%)
- INFERRED: 2 (3%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*