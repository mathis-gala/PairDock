# DatabaseExecutor

> 19 nodes · cohesion 0.11

## Key Concepts

- **DatabaseExecutor** (28 connections) — `apps/api/src/persistence/client.ts`
- **.constructor()** (3 connections) — `apps/api/src/persistence/adapters/agent-events.repository.ts`
- **.constructor()** (3 connections) — `apps/api/src/persistence/adapters/agent-registrations.repository.ts`
- **.constructor()** (3 connections) — `apps/api/src/persistence/adapters/messages.repository.ts`
- **.constructor()** (3 connections) — `apps/api/src/persistence/adapters/project-members.repository.ts`
- **.constructor()** (3 connections) — `apps/api/src/persistence/adapters/project-readiness.repository.ts`
- **.constructor()** (3 connections) — `apps/api/src/persistence/adapters/projects.repository.ts`
- **.constructor()** (3 connections) — `apps/api/src/persistence/adapters/review-requests.repository.ts`
- **.constructor()** (3 connections) — `apps/api/src/persistence/adapters/sessions.repository.ts`
- **.constructor()** (3 connections) — `apps/api/src/persistence/adapters/validation-runs.repository.ts`
- **Inject** (1 connections)
- **Inject** (1 connections)
- **Inject** (1 connections)
- **Inject** (1 connections)
- **Inject** (1 connections)
- **Inject** (1 connections)
- **Inject** (1 connections)
- **Inject** (1 connections)
- **Inject** (1 connections)

## Relationships

- [index.ts](index.ts.md) (4 shared connections)
- [create-draft-review-request.use-case.ts](create-draft-review-request.use-case.ts.md) (3 shared connections)
- [agent-events.repository.ts](agent-events.repository.ts.md) (2 shared connections)
- [agent-registrations.repository.ts](agent-registrations.repository.ts.md) (2 shared connections)
- [mappers.ts](mappers.ts.md) (2 shared connections)
- [ProjectMembersRepository](ProjectMembersRepository.md) (2 shared connections)
- [json-parsers.ts](json-parsers.ts.md) (2 shared connections)
- [ReviewRequestsRepository](ReviewRequestsRepository.md) (2 shared connections)
- [external-identities.repository.ts](external-identities.repository.ts.md) (2 shared connections)
- [SessionMember](SessionMember.md) (2 shared connections)
- [source-control-connections.repository.ts](source-control-connections.repository.ts.md) (2 shared connections)
- [PairDockUser](PairDockUser.md) (2 shared connections)

## Source Files

- `apps/api/src/persistence/adapters/agent-events.repository.ts`
- `apps/api/src/persistence/adapters/agent-registrations.repository.ts`
- `apps/api/src/persistence/adapters/messages.repository.ts`
- `apps/api/src/persistence/adapters/project-members.repository.ts`
- `apps/api/src/persistence/adapters/project-readiness.repository.ts`
- `apps/api/src/persistence/adapters/projects.repository.ts`
- `apps/api/src/persistence/adapters/review-requests.repository.ts`
- `apps/api/src/persistence/adapters/sessions.repository.ts`
- `apps/api/src/persistence/adapters/validation-runs.repository.ts`
- `apps/api/src/persistence/client.ts`

## Audit Trail

- EXTRACTED: 64 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*