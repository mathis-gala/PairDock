# create-draft-review-request.use-case.ts

> 48 nodes · cohesion 0.10

## Key Concepts

- **create-draft-review-request.use-case.ts** (42 connections) — `apps/api/src/review-requests/create-draft-review-request.use-case.ts`
- **create-draft-review-request.integration.test.ts** (38 connections) — `tests/apps/api/integration/review-requests/create-draft-review-request.integration.test.ts`
- **unit-of-work.ts** (32 connections) — `apps/api/src/persistence/adapters/unit-of-work.ts`
- **persistence-unit-of-work.ts** (29 connections) — `apps/api/src/persistence/ports/persistence-unit-of-work.ts`
- **SessionMembersRepository** (16 connections) — `apps/api/src/persistence/ports/session-members.repository.ts`
- **PersistenceRepositories** (15 connections) — `apps/api/src/persistence/ports/persistence-unit-of-work.ts`
- **SourceControlConnectionsRepository** (15 connections) — `apps/api/src/persistence/ports/source-control-connections.repository.ts`
- **validation.service.ts** (15 connections) — `apps/api/src/validation/validation.service.ts`
- **ValidationRun** (15 connections) — `packages/domain/src/index.ts`
- **validation-runs.repository.ts** (13 connections) — `apps/api/src/persistence/adapters/validation-runs.repository.ts`
- **ValidationRunsRepository** (13 connections) — `apps/api/src/persistence/ports/validation-runs.repository.ts`
- **PersistenceUnitOfWork** (12 connections) — `apps/api/src/persistence/ports/persistence-unit-of-work.ts`
- **SessionStatus** (12 connections) — `packages/domain/src/index.ts`
- **.constructor()** (11 connections) — `apps/api/src/review-requests/create-draft-review-request.use-case.ts`
- **session-members.repository.ts** (10 connections) — `apps/api/src/persistence/ports/session-members.repository.ts`
- **source-control-connections.repository.ts** (9 connections) — `apps/api/src/persistence/ports/source-control-connections.repository.ts`
- **validation-runs.repository.ts** (9 connections) — `apps/api/src/persistence/ports/validation-runs.repository.ts`
- **ValidationPolicy** (9 connections) — `apps/api/src/validation/validation.policy.ts`
- **InMemoryRepositories** (9 connections) — `tests/apps/api/integration/review-requests/create-draft-review-request.integration.test.ts`
- **ValidationRunsRepositoryAdapter** (8 connections) — `apps/api/src/persistence/adapters/validation-runs.repository.ts`
- **validation.policy.ts** (8 connections) — `apps/api/src/validation/validation.policy.ts`
- **PersistenceUnitOfWorkAdapter** (7 connections) — `apps/api/src/persistence/adapters/unit-of-work.ts`
- **validation-policy.test.ts** (6 connections) — `tests/apps/api/unit/validation/validation-policy.test.ts`
- **CreateValidationRunInput** (5 connections) — `apps/api/src/persistence/ports/validation-runs.repository.ts`
- **source-control.port.ts** (5 connections) — `apps/api/src/source-control/source-control.port.ts`
- *... and 23 more nodes in this community*

## Relationships

- [index.ts](index.ts.md) (57 shared connections)
- [sessions.service.ts](sessions.service.ts.md) (24 shared connections)
- [source-control-connections.repository.ts](source-control-connections.repository.ts.md) (11 shared connections)
- [SessionMember](SessionMember.md) (10 shared connections)
- [ReviewRequestsRepository](ReviewRequestsRepository.md) (9 shared connections)
- [persistence.module.ts](persistence.module.ts.md) (9 shared connections)
- [CreateDraftReviewRequestUseCase](CreateDraftReviewRequestUseCase.md) (7 shared connections)
- [ProjectMembersRepository](ProjectMembersRepository.md) (6 shared connections)
- [DatabaseClient](DatabaseClient.md) (6 shared connections)
- [SourceControlPort](SourceControlPort.md) (6 shared connections)
- [agent-events.repository.ts](agent-events.repository.ts.md) (5 shared connections)
- [external-identities.repository.ts](external-identities.repository.ts.md) (5 shared connections)

## Source Files

- `apps/api/src/persistence/adapters/mappers.ts`
- `apps/api/src/persistence/adapters/unit-of-work.ts`
- `apps/api/src/persistence/adapters/validation-runs.repository.ts`
- `apps/api/src/persistence/persistence.tokens.ts`
- `apps/api/src/persistence/ports/persistence-unit-of-work.ts`
- `apps/api/src/persistence/ports/session-members.repository.ts`
- `apps/api/src/persistence/ports/source-control-connections.repository.ts`
- `apps/api/src/persistence/ports/validation-runs.repository.ts`
- `apps/api/src/review-requests/create-draft-review-request.use-case.ts`
- `apps/api/src/source-control/source-control.port.ts`
- `apps/api/src/validation/validation.policy.ts`
- `apps/api/src/validation/validation.service.ts`
- `packages/domain/src/index.ts`
- `packages/local-agent/src/session/session-runner.ts`
- `tests/apps/api/integration/review-requests/create-draft-review-request.integration.test.ts`
- `tests/apps/api/unit/validation/validation-policy.test.ts`

## Audit Trail

- EXTRACTED: 415 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*