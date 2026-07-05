# PairDock

PairDock MVP monorepo described in `docs/architecture/pairdock-mvp/`.

## Workspace

- `apps/web`: React application for the PM/developer UI.
- `apps/api`: NestJS orchestration API.
- `packages/local-agent`: Node.js/TypeScript CLI for the local agent.
- `packages/shared-contracts`: shared Zod/TypeScript contracts for backend, UI, and agent.
- `packages/domain`: business types and internal ports before provider adapters.

## Commands

```bash
bun install
bun run prisma:generate
bun run typecheck
bun run lint
bun run test
bun run build
bun run db:status
bun run db:migrate:dev -- --name init
bun run dev:web
bun run dev:api
bun run dev:agent
```

## V1 developer setup

PairDock V1 creates projects from real GitHub App repositories and real connected local agents.

1. Create/install the GitHub App on the repositories PairDock may use.
2. Start the API and web app.
3. Configure the local agent:

```bash
pairdock-agent login \
  --backend-url http://127.0.0.1:3000 \
  --agent-id local-agent-1 \
  --token <agent-token> \
  --project pairdock=/absolute/path/to/repository
pairdock-agent start
```

4. Add `pairdock.yml` at each repository root:

```yaml
version: 1
name: my-web-app
preview:
  start: "pnpm dev --host 127.0.0.1 --port 4000"
  healthcheck: "http://127.0.0.1:4000"
checks:
  build: "pnpm build"
  test: "pnpm test"
  lint: "pnpm lint"
```

The agent reads local paths and commands from the developer machine, then publishes only safe metadata to PairDock:
project key, display name, GitHub repository full name, path alias, optional default branch, and supported model IDs. Local paths never leave the machine.

Docker is optional. If a project uses Docker or Compose, put that in `preview.start`; otherwise a normal dev command is enough.

In dev mode, the project creation form should show: GitHub repository, branch, online local agent project, agent-declared model, then readiness. PM users can start sessions only after required readiness checks are green.

## Notes

Persistence uses Prisma from the backend workspace. Set `DATABASE_URL` before running migration, reset, status, or persistence test commands. Use `bun run db:migrate:dev -- --name <migration-name>` while developing and keep `bun run db:migrate` for applying existing migrations.

The automated MVP scenario is documented in `docs/architecture/pairdock-mvp/mvp-e2e.md` and runs through `bun run --filter @pairdock/api test:e2e` after Prisma generation and migrations are applied.
