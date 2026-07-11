# session-runner.ts

> 25 nodes · cohesion 0.17

## Key Concepts

- **session-runner.ts** (35 connections) — `packages/local-agent/src/session/session-runner.ts`
- **SessionRunner** (26 connections) — `packages/local-agent/src/session/session-runner.ts`
- **SessionCloseCommandEnvelope** (11 connections) — `packages/shared-contracts/src/protocol/commands.ts`
- **SessionPrepareCommandEnvelope** (10 connections) — `packages/shared-contracts/src/protocol/commands.ts`
- **session-registry.ts** (9 connections) — `packages/local-agent/src/session/session-registry.ts`
- **SessionWorkspace** (9 connections) — `packages/local-agent/src/session/session-registry.ts`
- **GitPushBranchCommandEnvelope** (8 connections) — `packages/shared-contracts/src/protocol/commands.ts`
- **SessionRegistry** (7 connections) — `packages/local-agent/src/session/session-registry.ts`
- **.prepareUnlocked()** (7 connections) — `packages/local-agent/src/session/session-runner.ts`
- **.constructor()** (6 connections) — `packages/local-agent/src/session/session-runner.ts`
- **.cleanupWorkspace()** (6 connections) — `packages/local-agent/src/session/session-runner.ts`
- **.prepare()** (5 connections) — `packages/local-agent/src/session/session-runner.ts`
- **.closeUnlocked()** (5 connections) — `packages/local-agent/src/session/session-runner.ts`
- **.close()** (4 connections) — `packages/local-agent/src/session/session-runner.ts`
- **.pushBranch()** (4 connections) — `packages/local-agent/src/session/session-runner.ts`
- **.withSessionLock()** (4 connections) — `packages/local-agent/src/session/session-runner.ts`
- **PreparedWorktree** (3 connections) — `packages/local-agent/src/git/worktree.service.ts`
- **.pushBranchUnlocked()** (3 connections) — `packages/local-agent/src/session/session-runner.ts`
- **errorMessage()** (3 connections) — `packages/local-agent/src/session/session-runner.ts`
- **.findWorkspace()** (2 connections) — `packages/local-agent/src/session/session-runner.ts`
- **.register()** (1 connections) — `packages/local-agent/src/session/session-registry.ts`
- **.find()** (1 connections) — `packages/local-agent/src/session/session-registry.ts`
- **.unregister()** (1 connections) — `packages/local-agent/src/session/session-registry.ts`
- **info()** (1 connections) — `packages/local-agent/src/session/session-runner.ts`
- **SessionCloseResult** (1 connections) — `packages/local-agent/src/session/session-runner.ts`

## Relationships

- [session-runner.integration.test.ts](session-runner.integration.test.ts.md) (11 shared connections)
- [WorktreeService](WorktreeService.md) (10 shared connections)
- [ProjectPreviewConfig](ProjectPreviewConfig.md) (9 shared connections)
- [AgentClient](AgentClient.md) (6 shared connections)
- [SandboxRef](SandboxRef.md) (5 shared connections)
- [example-project.integration.test.ts](example-project.integration.test.ts.md) (5 shared connections)
- [agent-client.ts](agent-client.ts.md) (5 shared connections)
- [index.ts](index.ts.md) (3 shared connections)
- [create-draft-review-request.use-case.ts](create-draft-review-request.use-case.ts.md) (3 shared connections)
- [events.ts](events.ts.md) (3 shared connections)
- [docker-sandbox.adapter.ts](docker-sandbox.adapter.ts.md) (2 shared connections)
- [mvp-flow.e2e.test.ts](mvp-flow.e2e.test.ts.md) (2 shared connections)

## Source Files

- `packages/local-agent/src/git/worktree.service.ts`
- `packages/local-agent/src/session/session-registry.ts`
- `packages/local-agent/src/session/session-runner.ts`
- `packages/shared-contracts/src/protocol/commands.ts`

## Audit Trail

- EXTRACTED: 168 (98%)
- INFERRED: 4 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*