# MVP E2E scenario

Task: T15 — MVP E2E

This scenario is automated by `tests/apps/api/e2e/mvp-flow.e2e.test.ts` and uses only disposable local fixtures.

## What it proves

- A developer authenticates and creates a PairDock project against a test source-control connection.
- The project is shared with a PM identity.
- A connected local agent receives `session.prepare` when the developer starts a session.
- The agent prepares a dedicated git worktree for the fixture repository and exposes a preview URL.
- The PM sends a prompt; a simulated agent harness writes a change in the worktree.
- Build, test, lint, and preview checks pass.
- The PM creates a draft review request through the provider-agnostic source-control port.
- The session branch is pushed to a disposable bare git remote before review completion.
- The developer closes the session and the local worktree, sandbox, and tunnel resources are cleaned up.

## Fixtures

- Example repository: `tests/fixtures/mvp-e2e/example-repository/`
- The test copies that repository into a temp directory, initializes git, and pushes to a temp bare remote.
- Source-control uses a `test-*` provider connection id so no real GitHub repository or token is used.
- Sandbox, tunnel, and agent harness are local test doubles; no Docker, Cloudflare, Codex, Slack webhook, or real GitHub service is required.

## Reproduce locally

From the repository root:

1. Ensure a local PostgreSQL database is available and export `DATABASE_URL`.
2. Generate Prisma client and apply migrations:
   - `bun run prisma:generate`
   - `bun run db:migrate`
3. Run the scenario:
   - `bun run --filter @pairdock/api test:e2e`

The test leaves the real checkout untouched. All repositories, remotes, worktrees, and preview processes are created under the OS temp directory and removed or abandoned as disposable test artifacts.
