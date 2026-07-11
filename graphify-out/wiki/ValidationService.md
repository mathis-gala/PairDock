# ValidationService

> 12 nodes · cohesion 0.27

## Key Concepts

- **ValidationService** (13 connections) — `apps/api/src/validation/validation.service.ts`
- **ChecksResultEventEnvelope** (9 connections) — `packages/shared-contracts/src/protocol/events.ts`
- **.persistEvent()** (6 connections) — `apps/api/src/agent-gateway/agent.gateway.ts`
- **.toValidationRunInput()** (5 connections) — `apps/api/src/validation/validation.service.ts`
- **.toSessionUpdate()** (5 connections) — `apps/api/src/validation/validation.service.ts`
- **.areAllChecksPassing()** (4 connections) — `apps/api/src/validation/validation.service.ts`
- **.constructor()** (3 connections) — `apps/api/src/validation/validation.service.ts`
- **.getLatestValidation()** (3 connections) — `apps/api/src/validation/validation.service.ts`
- **.buildFailureMessage()** (3 connections) — `apps/api/src/validation/validation.service.ts`
- **toValidationView()** (2 connections) — `apps/api/src/validation/validation.service.ts`
- **Injectable** (1 connections)
- **Inject** (1 connections)

## Relationships

- [create-draft-review-request.use-case.ts](create-draft-review-request.use-case.ts.md) (5 shared connections)
- [sessions.service.ts](sessions.service.ts.md) (3 shared connections)
- [ConnectedAgentsRegistry](ConnectedAgentsRegistry.md) (2 shared connections)
- [AgentEventEnvelope](AgentEventEnvelope.md) (2 shared connections)
- [agent-client.ts](agent-client.ts.md) (2 shared connections)
- [index.ts](index.ts.md) (1 shared connections)
- [persistence.module.ts](persistence.module.ts.md) (1 shared connections)
- [SessionsService](SessionsService.md) (1 shared connections)
- [checks-runner.ts](checks-runner.ts.md) (1 shared connections)
- [events.ts](events.ts.md) (1 shared connections)

## Source Files

- `apps/api/src/agent-gateway/agent.gateway.ts`
- `apps/api/src/validation/validation.service.ts`
- `packages/shared-contracts/src/protocol/events.ts`

## Audit Trail

- EXTRACTED: 55 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*