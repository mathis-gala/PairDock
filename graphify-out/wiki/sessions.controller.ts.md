# sessions.controller.ts

> 19 nodes · cohesion 0.15

## Key Concepts

- **sessions.controller.ts** (18 connections) — `apps/api/src/sessions/sessions.controller.ts`
- **InvitationsService** (11 connections) — `apps/api/src/invitations/invitations.service.ts`
- **session-access.guard.ts** (9 connections) — `apps/api/src/auth/session-access.guard.ts`
- **SessionAccessGuard** (9 connections) — `apps/api/src/auth/session-access.guard.ts`
- **.canActivate()** (5 connections) — `apps/api/src/auth/session-access.guard.ts`
- **.findMembership()** (5 connections) — `apps/api/src/invitations/invitations.service.ts`
- **require-session-access.decorator.ts** (4 connections) — `apps/api/src/auth/require-session-access.decorator.ts`
- **.constructor()** (4 connections) — `apps/api/src/auth/session-access.guard.ts`
- **.constructor()** (4 connections) — `apps/api/src/ui-gateway/ui.gateway.ts`
- **RequireSessionAccess()** (3 connections) — `apps/api/src/auth/require-session-access.decorator.ts`
- **.getRequest()** (3 connections) — `apps/api/src/auth/session-access.guard.ts`
- **.findSessionMembership()** (3 connections) — `apps/api/src/invitations/invitations.service.ts`
- **.extractBearerToken()** (2 connections) — `apps/api/src/auth/session-access.guard.ts`
- **.findProjectMembership()** (2 connections) — `apps/api/src/invitations/invitations.service.ts`
- **Injectable** (1 connections)
- **Inject** (1 connections)
- **Injectable** (1 connections)
- **CreatePromptBody** (1 connections) — `apps/api/src/sessions/sessions.controller.ts`
- **Inject** (1 connections)

## Relationships

- [AuthTokenService](AuthTokenService.md) (9 shared connections)
- [sessions.service.ts](sessions.service.ts.md) (6 shared connections)
- [persistence.module.ts](persistence.module.ts.md) (4 shared connections)
- [AuthenticatedRequest](AuthenticatedRequest.md) (3 shared connections)
- [ProjectMembersRepository](ProjectMembersRepository.md) (2 shared connections)
- [SessionMember](SessionMember.md) (2 shared connections)
- [UiGateway](UiGateway.md) (2 shared connections)
- [index.ts](index.ts.md) (2 shared connections)
- [create-draft-review-request.use-case.ts](create-draft-review-request.use-case.ts.md) (1 shared connections)
- [CreateDraftReviewRequestUseCase](CreateDraftReviewRequestUseCase.md) (1 shared connections)
- [SessionPromptService](SessionPromptService.md) (1 shared connections)
- [SessionsController](SessionsController.md) (1 shared connections)

## Source Files

- `apps/api/src/auth/require-session-access.decorator.ts`
- `apps/api/src/auth/session-access.guard.ts`
- `apps/api/src/invitations/invitations.service.ts`
- `apps/api/src/sessions/sessions.controller.ts`
- `apps/api/src/ui-gateway/ui.gateway.ts`

## Audit Trail

- EXTRACTED: 85 (98%)
- INFERRED: 2 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*