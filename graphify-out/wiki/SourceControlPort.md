# SourceControlPort

> 13 nodes · cohesion 0.19

## Key Concepts

- **SourceControlPort** (21 connections) — `packages/domain/src/index.ts`
- **.constructor()** (12 connections) — `apps/api/src/projects/projects.service.ts`
- **RecordingSourceControlPort** (7 connections) — `tests/apps/api/integration/review-requests/create-draft-review-request.integration.test.ts`
- **.listInstallationRepositories()** (2 connections) — `tests/apps/api/integration/review-requests/create-draft-review-request.integration.test.ts`
- **.listRepositoryBranches()** (2 connections) — `tests/apps/api/integration/review-requests/create-draft-review-request.integration.test.ts`
- **.createDraftReviewRequest()** (2 connections) — `tests/apps/api/integration/review-requests/create-draft-review-request.integration.test.ts`
- **Inject** (1 connections)
- **.assertProjectAccess()** (1 connections) — `packages/domain/src/index.ts`
- **.listInstallationRepositories()** (1 connections) — `packages/domain/src/index.ts`
- **.listRepositoryBranches()** (1 connections) — `packages/domain/src/index.ts`
- **.createDraftReviewRequest()** (1 connections) — `packages/domain/src/index.ts`
- **.constructor()** (1 connections) — `tests/apps/api/integration/review-requests/create-draft-review-request.integration.test.ts`
- **.assertProjectAccess()** (1 connections) — `tests/apps/api/integration/review-requests/create-draft-review-request.integration.test.ts`

## Relationships

- [create-draft-review-request.use-case.ts](create-draft-review-request.use-case.ts.md) (6 shared connections)
- [github-source-control.adapter.ts](github-source-control.adapter.ts.md) (6 shared connections)
- [index.ts](index.ts.md) (4 shared connections)
- [PairDockIdentity](PairDockIdentity.md) (1 shared connections)
- [ConnectedAgentsRegistry](ConnectedAgentsRegistry.md) (1 shared connections)
- [external-identities.repository.ts](external-identities.repository.ts.md) (1 shared connections)
- [ProjectMembersRepository](ProjectMembersRepository.md) (1 shared connections)
- [ReviewRequestsRepository](ReviewRequestsRepository.md) (1 shared connections)
- [PairDockUser](PairDockUser.md) (1 shared connections)
- [sessions.service.ts](sessions.service.ts.md) (1 shared connections)

## Source Files

- `apps/api/src/projects/projects.service.ts`
- `packages/domain/src/index.ts`
- `tests/apps/api/integration/review-requests/create-draft-review-request.integration.test.ts`

## Audit Trail

- EXTRACTED: 53 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*