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

## Notes

Persistence uses Prisma from the backend workspace. Set `DATABASE_URL` before running migration, reset, status, or persistence test commands. Use `bun run db:migrate:dev -- --name <migration-name>` while developing and keep `bun run db:migrate` for applying existing migrations.

The automated MVP scenario is documented in `docs/architecture/pairdock-mvp/mvp-e2e.md` and runs through `bun run --filter @pairdock/api test:e2e` after Prisma generation and migrations are applied.
