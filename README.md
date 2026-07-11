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

### 1. GitHub App

Create a GitHub App, install it on the repositories PairDock may use, and configure the backend:

```env
GITHUB_APP_ID=<app-id>
GITHUB_APP_SLUG=<app-slug>
GITHUB_CLIENT_ID=<client-id>
GITHUB_CLIENT_SECRET=<client-secret>
GITHUB_REDIRECT_URI=http://127.0.0.1:3000/auth/developer/callback
GITHUB_APP_PRIVATE_KEY="<pem contents or escaped pem>"
```

Use `http://localhost:5173` for `FRONTEND_URL` unless you intentionally run the web app on another origin.

### 2. Slack App

Slack is used for PM authentication only in V1. No Slack notification bot is required.

```env
SLACK_CLIENT_ID=<client-id>
SLACK_CLIENT_SECRET=<client-secret>
SLACK_REDIRECT_URI=http://127.0.0.1:3000/auth/pm/callback
```

Create a Slack App from `api.slack.com/apps`, add the redirect URL above under **OAuth & Permissions**, and add only OpenID identity scopes:

- `identity.basic`
- `identity.email`
- `identity.team`

You do not need a bot token, event subscriptions, slash commands, or incoming webhooks for V1 PM auth.

### 3. Start PairDock

```bash
bun run db:migrate:dev
bun run dev:api
bun run dev:web
```

### 4. Cloudflare Tunnel

PairDock previews are meant to be public HTTPS URLs for PM browsers. The local agent starts the project preview, waits for the local healthcheck, then opens a Cloudflare Tunnel.

Cloudflare runs through Docker by default. You do not need to install `cloudflared` locally. Add `preview.tunnel: cloudflare` to `pairdock.yml`; the local agent starts `cloudflare/cloudflared` in Docker and publishes the generated HTTPS URL.

### 5. Add `pairdock.yml`

Add `pairdock.yml` at each repository root:

```yaml
version: 1
name: my-web-app
repoFullName: owner/repository
defaultBranch: main
models:
  - gpt-5.5
sandbox:
  image: node:22-bookworm-slim
  workdir: /workspace
  network: host-services
  env:
    DATABASE_URL: "postgresql://postgres:pairdockdev@host.docker.internal:55432/pairdock"
  ports:
    - "127.0.0.1:4000:4000"
preview:
  start: "pnpm install --frozen-lockfile && pnpm dev --host 0.0.0.0 --port 4000"
  healthcheck: "http://127.0.0.1:4000"
  tunnel: cloudflare
checks:
  build: "pnpm build"
  test: "pnpm test"
  lint: "pnpm lint"
```

PairDock always runs preview commands in a Docker sandbox with only the session worktree mounted at `/workspace`.
`network: host-services` is the explicit opt-in that lets the container reach local services such as Postgres through `host.docker.internal`.
Only variables listed in `sandbox.env` are passed to the container; PairDock does not mount `.env` or the developer home directory.

For a stable team URL, create a Cloudflare named tunnel outside PairDock and set `publicUrl`:

```yaml
preview:
  tunnel:
    provider: cloudflare
    publicUrl: "https://pairdock-preview.example.com"
```

### 6. Configure the local agent

Declare the local project path and the models available through your local agent:

```bash
pairdock-agent login \
  --backend-url http://127.0.0.1:3000 \
  --agent-id local-agent-1 \
  --token <agent-token> \
  --capability session.prepare \
  --capability readiness.check \
  --capability agent.prompt \
  --capability git.pushBranch \
  --model gpt-5.5=GPT-5.5=codex \
  --project pairdock=/absolute/path/to/repository
pairdock-agent start
```

In this repository during development, use the workspace script or the package binary:

```bash
node --import tsx packages/local-agent/src/main.ts login \
  --backend-url http://127.0.0.1:3000 \
  --agent-id local-agent-1 \
  --token local-dev-token \
  --capability session.prepare \
  --capability readiness.check \
  --capability agent.prompt \
  --capability git.pushBranch \
  --model gpt-5.5=GPT-5.5=codex \
  --project pairdock=/absolute/path/to/repository

node --import tsx packages/local-agent/src/main.ts start
```

The agent reads local paths and commands from the developer machine, then publishes only safe metadata to PairDock:
project key, display name, GitHub repository full name, path alias, optional default branch, and supported model IDs. Local paths never leave the machine.

### 7. Create a PairDock project

In the developer UI:

1. Sign in with GitHub.
2. Select a GitHub App repository.
3. Select the base branch.
4. Select the online local agent project.
5. Select an agent-declared model.
6. Run readiness checks.
7. Create/start a session.

PM users can start sessions only after required readiness checks are green.

## Notes

Persistence uses Prisma from the backend workspace. Set `DATABASE_URL` before running migration, reset, status, or persistence test commands. Use `bun run db:migrate:dev -- --name <migration-name>` while developing and keep `bun run db:migrate` for applying existing migrations.

When deploying the notification-removal migration, first deploy the API version that no longer accesses notifications and wait for old instances to stop before applying the table drop. A coordinated V1 deployment may stop the API, apply migrations, and then start the new version.

The automated MVP scenario is documented in `docs/architecture/pairdock-mvp/mvp-e2e.md` and runs through `bun run --filter @pairdock/api test:e2e` after Prisma generation and migrations are applied.
