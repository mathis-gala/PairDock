# PairDock

Monorepo skeleton for the PairDock MVP described in `docs/architecture/pairdock-mvp/`.

## Workspace

- `apps/web`: React application for the PM/developer UI.
- `apps/api`: NestJS orchestration API.
- `packages/local-agent`: Node.js/TypeScript CLI for the local agent.
- `packages/shared-contracts`: shared Zod/TypeScript contracts for backend, UI, and agent.
- `packages/domain`: business types and internal ports before provider adapters.

## Commands

```bash
npm install
npm run typecheck
npm run dev:web
npm run dev:api
npm run dev:agent
```

## Notes

This skeleton does not include MVP business logic yet. It establishes the `apps/*` and `packages/*` boundaries for the next tasks.
