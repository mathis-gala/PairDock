# PairDock

PairDock MVP monorepo described in `docs/architecture/pairdock-mvp/`.

Production release, Raspberry Pi, Caddy, and Cloudflare Tunnel instructions: [`deploy/README.md`](deploy/README.md).

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
bun run db:migrate:test
bun run dev:web
bun run dev:api
bun run dev:agent
```

## V1 developer setup

PairDock V1 creates projects from real GitHub App repositories and real connected local agents.

### 1. GitHub App

Create a GitHub App and configure these exact URLs:

- **Callback URL**: `http://127.0.0.1:3000/auth/developer/callback`
- **Setup URL**: `http://127.0.0.1:3000/auth/developer/setup`
- Enable **Redirect on update** so repository-access changes return to PairDock after they are saved.
- Leave **Request user authorization (OAuth) during installation** disabled. PairDock performs the OAuth authorization itself after the setup redirect.
- Repository permissions: **Contents: Read-only**, **Metadata: Read-only**, and **Pull requests: Read and write**.

Install the App only on the repositories PairDock may use. For the TCG Collection test, grant access to `mathis-gala/Booster-Break`.
PairDock authorizes the GitHub user first and discovers every installation accessible to that user. Existing installations therefore do not reopen `/settings/installations/<id>`. When no installation exists yet, PairDock automatically continues through GitHub App installation and the setup URL.

Configure the backend:

```env
GITHUB_APP_ID=<app-id>
GITHUB_APP_SLUG=<app-slug>
GITHUB_CLIENT_ID=<client-id>
GITHUB_CLIENT_SECRET=<client-secret>
GITHUB_REDIRECT_URI=http://127.0.0.1:3000/auth/developer/callback
GITHUB_APP_PRIVATE_KEY="<pem contents or escaped pem>"
AUTH_STATE_SECRET=<random-secret-of-at-least-32-bytes>
AUTH_TOKEN_SECRET=<different-random-secret-of-at-least-32-bytes>
AGENT_AUTH_CREDENTIALS_JSON={"agent-local-1":{"token":"<different-random-secret-of-at-least-32-bytes>","projectKeys":["tcg-collection"]}}
DEV_AUTH_ENABLED=false
```

Generate all authentication secrets independently, for example with `openssl rand -base64 48`. Keep them stable between API restarts and never commit them. `AGENT_AUTH_CREDENTIALS_JSON` maps each local agent id to its unique token and exact project-key allowlist; one project key cannot be assigned to multiple credentials. Pass only that agent's token to its CLI. `DEV_AUTH_ENABLED` must remain `false` outside automated tests or explicit local fixture testing.

Use `http://localhost:5173` for `FRONTEND_URL` unless you intentionally run the web app on another origin. The configured origin is also the only origin allowed by API CORS.

### 2. Slack App

Slack is used for PM authentication only in V1. No Slack notification bot is required.

```env
SLACK_CLIENT_ID=<client-id>
SLACK_CLIENT_SECRET=<client-secret>
SLACK_REDIRECT_URI=http://127.0.0.1:3000/auth/pm/callback
```

Create a Slack App from `api.slack.com/apps`, add the redirect URL above under **OAuth & Permissions**, and add only these user token scopes:

- `users:read`
- `users:read.email`

You do not need a bot token, event subscriptions, slash commands, or incoming webhooks for V1 PM auth.

### 3. Start PairDock

Keep application and automated-test data isolated. Create a dedicated `pairdock_test` database, then configure both URLs in `apps/api/.env`:

```env
DATABASE_URL=postgresql://postgres:pairdockdev@127.0.0.1:55432/pairdock
TEST_DATABASE_URL=postgresql://postgres:pairdockdev@127.0.0.1:55432/pairdock_test
```

Apply test migrations once before running database-backed tests:

```bash
bun run db:migrate:test
```

PairDock refuses to start database-backed tests when `TEST_DATABASE_URL` is missing, points to the same physical database as `DATABASE_URL`, or its database name lacks an explicit `test` marker. A separate PostgreSQL schema is intentionally rejected because the runtime adapter does not guarantee schema isolation. Integration and E2E cleanup can therefore never fall back to the application database.

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
sandbox:
  workdir: /workspace
  network: host-services
  env:
    DATABASE_URL: "postgresql://postgres:pairdockdev@host.docker.internal:55432/pairdock"
  ports:
    - "127.0.0.1:{{hostPort}}:4000"
preview:
  start: "pnpm install --frozen-lockfile && pnpm dev --host 0.0.0.0 --port 4000"
  healthcheck: "http://127.0.0.1:{{hostPort}}"
  healthcheckTimeoutMs: 60000
  tunnel: cloudflare
checks:
  build: "pnpm build"
  test: "pnpm test"
  lint: "pnpm lint"
```

`models` is an optional project allowlist. Omit it to expose every model published by the local agent, or add model IDs to restrict this repository only:

```yaml
models:
  - gpt-5.6-sol
  - gpt-5.6-terra
```

PairDock always runs preview commands in a Docker sandbox with only the session worktree mounted at `/workspace`.
Omit `sandbox.image` to use PairDock's pinned multi-platform default. If a project needs another image, pin it by digest instead of using a mutable tag.
Install Codex CLI 0.138.0 or newer and authenticate it with `codex login` before starting the local agent. PairDock deliberately does not forward `OPENAI_API_KEY` or unrelated workstation secrets to the Codex process; the CLI must use its protected local login state. Model-generated commands use a restricted permission profile: they can read/write the session worktree, cannot read common credential files (including tracked `.env` and private keys), cannot read the rest of the developer home, and cannot access the network.
Use `{{hostPort}}` for host-side preview bindings and URLs. PairDock resolves it to a free port per session, so concurrent sessions cannot reuse another session's preview or healthcheck.
Set `preview.healthcheckTimeoutMs` when dependency installation, code generation, or migrations can make preview startup exceed the 30-second default. The accepted maximum is 10 minutes.
For same-machine development without a public tunnel, set `preview.tunnel.publicUrl` to `http://127.0.0.1:{{hostPort}}`.
`network: host-services` is the explicit opt-in that lets the container reach local services such as Postgres through `host.docker.internal`.
Only variables listed in `sandbox.env` are passed to the container; PairDock does not mount `.env` or the developer home directory.
Each check runs in its own process. A check command must therefore generate required artifacts such as Prisma Client before running migrations or tests.

For a stable team URL, create a Cloudflare named tunnel outside PairDock and set `publicUrl`:

```yaml
preview:
  tunnel:
    provider: cloudflare
    publicUrl: "https://pairdock-preview.example.com"
```

### 6. Configure the local agent

Declare the local project path. The MVP Codex adapter discovers the visible models and their supported reasoning levels from the authenticated local Codex CLI cache:

```bash
pairdock-agent login \
  --backend-url http://127.0.0.1:3000 \
  --agent-id local-agent-1 \
  --token <agent-token> \
  --capability session.prepare \
  --capability readiness.check \
  --capability agent.prompt \
  --capability git.pushBranch \
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
  --project pairdock=/absolute/path/to/repository

node --import tsx packages/local-agent/src/main.ts start
```

The agent reads local paths and commands from the developer machine, then publishes only safe metadata to PairDock:
project key, display name, GitHub repository full name, path alias, optional default branch, and supported model/reasoning IDs. Local paths never leave the machine. Restart `pairdock-agent start` after changing its configuration or a project manifest so the backend receives the new catalog.

Explicit `--model <id>=<label>=<provider>` options remain supported for non-Codex providers or as a fallback when the local Codex cache is unavailable. The developer selects the project's model and reasoning effort from the owning agent's published capabilities. Every new PM session inherits those server-side defaults; PM clients cannot override them. PairDock passes the persisted selection to Codex CLI as `--model` and `model_reasoning_effort`, and resumes the same Codex thread for follow-up prompts in that PairDock session.

Agent console logs prefix execution failures with the PairDock session ID. Agent outputs and validation results are also persisted as session events. PM users receive a concise failed-check summary and recovery instruction in the conversation; full redacted check logs remain available in persisted events for diagnosis.

### 7. Create a PairDock project

In the developer UI:

1. Sign in with GitHub.
2. Select a GitHub App repository.
3. Select the base branch.
4. Select the online local agent project.
5. Select the project agent's model and one of its supported reasoning levels. This developer-owned configuration applies to every new session.
6. Run readiness checks.
7. Create/start a session.

PM users can start sessions only after required readiness checks are green.

## Notes

Persistence uses Prisma from the backend workspace. Use `DATABASE_URL` for application migrations and `TEST_DATABASE_URL` for automated tests. Use `bun run db:migrate:dev -- --name <migration-name>` while developing, `bun run db:migrate` for applying existing application migrations, and `bun run db:migrate:test` only for the isolated test target.

When deploying the notification-removal migration, first deploy the API version that no longer accesses notifications and wait for old instances to stop before applying the table drop. A coordinated V1 deployment may stop the API, apply migrations, and then start the new version.

The automated MVP scenario is documented in `docs/architecture/pairdock-mvp/mvp-e2e.md` and runs through `bun run --filter @pairdock/api test:e2e` after Prisma generation and migrations are applied.
