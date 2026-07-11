# SessionPromptService

> 12 nodes · cohesion 0.24

## Key Concepts

- **SessionPromptService** (12 connections) — `apps/api/src/sessions/session-prompt.service.ts`
- **.createPrompt()** (5 connections) — `apps/api/src/sessions/session-prompt.service.ts`
- **.cancelPrompt()** (5 connections) — `apps/api/src/sessions/session-prompt.service.ts`
- **.constructor()** (5 connections) — `apps/api/src/sessions/sessions.controller.ts`
- **.createPromptResponse()** (4 connections) — `apps/api/src/sessions/session-prompt.service.ts`
- **.cancelPromptResponse()** (3 connections) — `apps/api/src/sessions/session-prompt.service.ts`
- **.requireSession()** (3 connections) — `apps/api/src/sessions/session-prompt.service.ts`
- **.requirePromptActor()** (2 connections) — `apps/api/src/sessions/session-prompt.service.ts`
- **buildAgentPromptCommand()** (2 connections) — `apps/api/src/sessions/session-prompt.service.ts`
- **buildAgentCancelCommand()** (2 connections) — `apps/api/src/sessions/session-prompt.service.ts`
- **Injectable** (1 connections)
- **Inject** (1 connections)

## Relationships

- [index.ts](index.ts.md) (4 shared connections)
- [SessionsController](SessionsController.md) (3 shared connections)
- [ConnectedAgentsRegistry](ConnectedAgentsRegistry.md) (2 shared connections)
- [sessions.controller.ts](sessions.controller.ts.md) (1 shared connections)
- [persistence.module.ts](persistence.module.ts.md) (1 shared connections)
- [CreateDraftReviewRequestUseCase](CreateDraftReviewRequestUseCase.md) (1 shared connections)
- [SessionsService](SessionsService.md) (1 shared connections)

## Source Files

- `apps/api/src/sessions/session-prompt.service.ts`
- `apps/api/src/sessions/sessions.controller.ts`

## Audit Trail

- EXTRACTED: 45 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*