# CreateDraftReviewRequestUseCase

> 10 nodes · cohesion 0.29

## Key Concepts

- **CreateDraftReviewRequestUseCase** (12 connections) — `apps/api/src/review-requests/create-draft-review-request.use-case.ts`
- **.create()** (12 connections) — `apps/api/src/review-requests/create-draft-review-request.use-case.ts`
- **.assertActorCanCreateReviewRequest()** (4 connections) — `apps/api/src/review-requests/create-draft-review-request.use-case.ts`
- **.requireSession()** (3 connections) — `apps/api/src/review-requests/create-draft-review-request.use-case.ts`
- **.requireProject()** (3 connections) — `apps/api/src/review-requests/create-draft-review-request.use-case.ts`
- **.requireSourceControlConnection()** (3 connections) — `apps/api/src/review-requests/create-draft-review-request.use-case.ts`
- **buildGitPushBranchCommand()** (2 connections) — `apps/api/src/review-requests/create-draft-review-request.use-case.ts`
- **buildSessionBranchName()** (2 connections) — `apps/api/src/review-requests/create-draft-review-request.use-case.ts`
- **buildReviewRequestBody()** (2 connections) — `apps/api/src/review-requests/create-draft-review-request.use-case.ts`
- **Injectable** (1 connections)

## Relationships

- [create-draft-review-request.use-case.ts](create-draft-review-request.use-case.ts.md) (7 shared connections)
- [index.ts](index.ts.md) (3 shared connections)
- [PairDockIdentity](PairDockIdentity.md) (2 shared connections)
- [persistence.module.ts](persistence.module.ts.md) (1 shared connections)
- [sessions.controller.ts](sessions.controller.ts.md) (1 shared connections)
- [SessionPromptService](SessionPromptService.md) (1 shared connections)
- [ConnectedAgentsRegistry](ConnectedAgentsRegistry.md) (1 shared connections)
- [SessionsController](SessionsController.md) (1 shared connections)
- [source-control-connections.repository.ts](source-control-connections.repository.ts.md) (1 shared connections)

## Source Files

- `apps/api/src/review-requests/create-draft-review-request.use-case.ts`

## Audit Trail

- EXTRACTED: 44 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*