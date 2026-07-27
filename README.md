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
bun run db:seed:pm-demo
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
- **Webhook URL**: the publicly reachable API URL followed by `/webhooks/github`.
- In the GitHub App settings, enable the webhook, set its URL to
  `${PAIRDOCK_API_URL}/webhooks/github`, copy the same secret to
  `GITHUB_WEBHOOK_SECRET`, and subscribe to the **Pull request** event. Confirm
  from **Advanced → Recent deliveries** that a `pull_request` delivery receives
  HTTP `202`; PairDock does not poll GitHub for PR status.

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
GITHUB_WEBHOOK_SECRET=<different-random-secret>
AUTH_STATE_SECRET=<random-secret-of-at-least-32-bytes>
AUTH_TOKEN_SECRET=<different-random-secret-of-at-least-32-bytes>
AGENT_AUTH_CREDENTIALS_JSON={"agent-local-1":{"token":"<different-random-secret-of-at-least-32-bytes>","projectKeys":["tcg-collection"]}}
DEV_PM_AUTH_ENABLED=false
```

Generate all authentication secrets independently, for example with `openssl rand -base64 48`. Keep them stable between API restarts and never commit them. `AGENT_AUTH_CREDENTIALS_JSON` maps each local agent id to its unique token and exact project-key allowlist; one project key cannot be assigned to multiple credentials. Pass only that agent's token to its CLI.

GitHub cannot deliver real webhooks to `127.0.0.1`. For local end-to-end testing, expose the API through a temporary HTTPS tunnel and use `<tunnel-url>/webhooks/github`, or use GitHub App webhook redelivery against the production API. PairDock verifies `X-Hub-Signature-256` before parsing the event. Refresh the PM history page to load the latest pull-request states.

For local UI development only, set `DEV_PM_AUTH_ENABLED=true` to let the PM enter without Slack as `pm@pairdock.test`. The developer must still authenticate through the GitHub App. PairDock ignores this flag when `NODE_ENV=production`, where Slack remains mandatory.

To populate the local application database with PM demo history, first create at least one developer project, then run:

```bash
bun run db:seed:pm-demo
```

The command shares every existing local project with `pm@pairdock.test` and idempotently adds eight UI-only demo sessions per project. Seven are PM-created and cover ready, running, awaiting validation, failed, pull-request open, pull-request closed, and pull-request merged states. One developer-created control session verifies that the PM `Mes sessions` view excludes sessions created by someone else while the developer dashboard still lists every session for its projects. The seed also adds conversations, diffs, successful and failed checks, and GitHub-style pull-request URLs. It never deletes records, never changes project readiness, refuses `NODE_ENV=production`, and refuses non-loopback database hosts. Seeded sessions are historical UI fixtures and are not prepared on the local agent; create a new session from the PM dashboard for an end-to-end agent test.

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

### 4. Screenshot storage

PairDock accepts up to four PNG, JPEG, or WebP screenshots per chat message or draft PR, with a 5 MB limit per file. PostgreSQL stores metadata only.

Local development needs no cloud configuration. Files default to `~/.pairdock/attachments`. Override this path with `PAIRDOCK_ATTACHMENT_STORAGE_PATH`; set `PAIRDOCK_PUBLIC_API_URL` when the API's externally reachable base URL is not `http://localhost:3000`. Production fails to start without complete R2 configuration so durable PR images cannot silently fall back to an ephemeral container filesystem.

For deployment, create two Cloudflare R2 buckets:

- a private bucket for chat screenshots, downloaded only through authenticated PairDock API routes;
- a public bucket for durable screenshots embedded in GitHub PR descriptions.

Expose only the public bucket through a custom HTTPS domain, then configure the API:

```env
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<r2-api-token-access-key>
R2_SECRET_ACCESS_KEY=<r2-api-token-secret>
R2_PRIVATE_BUCKET=pairdock-private
R2_PUBLIC_BUCKET=pairdock-public
R2_PUBLIC_BASE_URL=https://assets.example.com
```

The R2 token needs object read/write/delete access to both buckets. Keep both credentials on the API process only; never forward them to the local agent or preview containers. Configuration is fail-closed: if any R2 variable is present, all six are required and the public base URL must use HTTPS.

Apply the attachment metadata migration before starting the updated API:

```bash
bun run db:migrate:dev
```

### 5. Cloudflare Tunnel

PairDock previews are meant to be public HTTPS URLs for PM browsers. The local agent starts the project preview, waits for the local healthcheck, then opens a Cloudflare Tunnel.

Cloudflare runs through Docker by default. You do not need to install `cloudflared` locally. Add `preview.tunnel: cloudflare` to `pairdock.yml`; the local agent starts `cloudflare/cloudflared` in Docker and publishes the generated HTTPS URL.

### 6. Add `pairdock.yml`

Add `pairdock.yml` at each repository root:

```yaml
version: 1
name: my-web-app
repoFullName: owner/repository
defaultBranch: main
setup: "pnpm install --frozen-lockfile"
preview:
  runtime: host
  start: "pnpm dev --host 127.0.0.1 --port {{hostPort}}"
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

PairDock creates one Git worktree per session. `setup`, preview, build, test, and lint commands run from that worktree on the developer machine by default, using the same runtime and dependencies as normal local development. `setup` runs before initial preview startup and again when the agent recovers that session after a restart; keep it idempotent and use it for dependency installation and generated artifacts.
Set `preview.runtime: docker` only when the preview requires container isolation or a multi-service container. Docker mode bind-mounts the worktree for hot reload but masks every workspace `node_modules`, so Linux dependencies cannot overwrite host dependencies. Add `preview.prepare` with the idempotent Docker dependency setup command to prewarm persistent Linux `node_modules` volumes before the agent publishes itself:

```yaml
preview:
  runtime: docker
  prepare: "bun install --frozen-lockfile && bun run generate"
  start: "bun install --frozen-lockfile && bun run dev --host 0.0.0.0 --port 4000"
  healthcheck: "http://127.0.0.1:4000"
```

The cache key includes the agent, project, container image, prepare command, and lockfile. New sessions therefore reuse warm Linux dependencies, while lockfile or image changes create a fresh cache. Keep dependency installation in `preview.start` as an idempotent safety net: when prewarming fails, PairDock logs the cause and starts the session with the existing cold-install path. Omit `sandbox.image` to use PairDock's pinned multi-platform default; custom images should be pinned by digest.
Install Codex CLI 0.138.0 or newer and authenticate it with `codex login` before starting the local agent. PairDock deliberately does not forward `OPENAI_API_KEY` or unrelated workstation secrets to the Codex process; the CLI must use its protected local login state. Model-generated commands use a restricted permission profile: they can read/write the session worktree, cannot read common credential files (including tracked `.env` and private keys), cannot read the rest of the developer home, and cannot access the network.
Use `{{hostPort}}` for host-side preview bindings and URLs. PairDock resolves it to a free port per session, so concurrent sessions cannot reuse another session's preview or healthcheck.
Set `preview.healthcheckTimeoutMs` when dependency installation, code generation, or migrations can make preview startup exceed the 30-second default. The accepted maximum is 10 minutes.
For same-machine development without a public tunnel, set `preview.tunnel.publicUrl` to `http://127.0.0.1:{{hostPort}}`.
In Docker preview mode, `network: host-services` lets the container reach local services such as Postgres through `host.docker.internal`. Only variables listed in `sandbox.env` are passed to that container; PairDock does not mount `.env` or the developer home directory.
Checks always run as separate host processes in the session worktree with an environment allowlist that excludes PairDock, OpenAI, GitHub, and other token-like variables. They still execute repository code with the developer user's filesystem permissions: configure only trusted local repositories. Codex may run relevant project checks during its turn; PairDock independently reruns configured checks afterward.

For a stable team URL, create a Cloudflare named tunnel outside PairDock and set `publicUrl`:

```yaml
preview:
  tunnel:
    provider: cloudflare
    publicUrl: "https://pairdock-preview.example.com"
```

### 7. Configure the local agent

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

### PairDock self-preview with a TCG companion agent

PairDock can exercise its complete PM-to-agent flow while it edits itself. Keep the PairDock production agent connected to the deployed API, and reference the existing TCG development-agent profile from that outer agent's JSON config:

```json
{
  "previewCompanions": {
    "pairdock": {
      "agentConfigPath": "/absolute/path/to/agent-tcg-local.json"
    }
  }
}
```

The `pairdock` key identifies the outer project whose preview receives the companion. The referenced profile keeps its TCG project paths, capabilities, models, and commands. PairDock ignores that profile's backend URL and token, generates a new 32-byte credential for each outer preview, injects it only into the preview API, and connects the companion through the dynamically allocated loopback port. No production, GitHub, Slack, OpenAI, or existing local-agent token enters the container.

The companion remains a host process, so Codex, Git, repositories, and Docker stay on the developer workstation. Its session state is isolated under `~/.pairdock/companion-sessions/`. Closing the outer session cleans companion previews and worktrees; restarting the outer agent preserves and rebuilds them. Companion runtimes cannot start another companion, which limits this self-preview flow to one nested level.

Build the pinned self-preview image before starting the PairDock agent:

```bash
docker build --file deploy/Dockerfile.sandbox --tag pairdock/self-preview-sandbox:node22-bun1.3.14 .
```

The tracked `pairdock.yml` keeps PairDock's multi-service preview in Docker while setup and final checks run on macOS. Only the web app is published on a dynamic loopback port; it proxies API and WebSocket traffic to the private API port `3000`. The preview API uses the local development PostgreSQL service through `host.docker.internal:55432` and enables only local PM identity. Run local migrations and optional PM demo seeds before testing, and make sure that database contains a TCG project whose agent project key matches the companion profile. Complete developer OAuth in the top-level PairDock window, not inside the sandboxed PM preview iframe.

When agents run at the same time, give every process its own config file, session-state file, and agent id:

```bash
PAIRDOCK_AGENT_CONFIG_PATH=/absolute/path/to/agent-tcg.json pairdock-agent login <tcg-options>
PAIRDOCK_AGENT_CONFIG_PATH=/absolute/path/to/agent-pairdock.json pairdock-agent login <pairdock-options>

PAIRDOCK_AGENT_CONFIG_PATH=/absolute/path/to/agent-tcg.json \
PAIRDOCK_AGENT_SESSION_STATE_PATH=/absolute/path/to/sessions-tcg.json \
pairdock-agent start

PAIRDOCK_AGENT_CONFIG_PATH=/absolute/path/to/agent-pairdock.json \
PAIRDOCK_AGENT_SESSION_STATE_PATH=/absolute/path/to/sessions-pairdock.json \
pairdock-agent start
```

Use distinct agent ids for every process running on the same workstation, including agents connected to different PairDock backends. Agent ids scope Docker preview containers and dependency caches; reusing one can make an agent stop another agent's previews or prune its warm volumes. Within one backend, also use distinct tokens and project keys, and authorize each key in the matching `AGENT_AUTH_CREDENTIALS_JSON` entry. A local-development agent therefore needs a different id from its production counterpart even when both publish the same repository to different backends.

Explicit `--model <id>=<label>=<provider>` options remain supported for non-Codex providers or as a fallback when the local Codex cache is unavailable. The developer selects the project's model and reasoning effort from the owning agent's published capabilities. Every new PM session inherits those server-side defaults; PM clients cannot override them. PairDock passes the persisted selection to Codex CLI as `--model` and `model_reasoning_effort`, and resumes the same Codex thread for follow-up prompts in that PairDock session.

Agent console logs prefix execution failures with the PairDock session ID. Agent outputs and final validation results are persisted as session events. Codex works normally inside the host worktree and may install dependencies or run project checks. PairDock independently runs the configured build, test, and lint commands on the host after each turn. When one fails, PairDock returns bounded, redacted diagnostics to the same Codex thread and reruns validation after at most two automatic repair attempts. Explicit backend rejection stops the workflow before further local work. PM users receive the final concise failed-check summary and recovery instruction in the conversation; final redacted check logs remain available in persisted events for diagnosis. Docker preview and tunnel containers are labeled by agent and session. On startup, the agent removes all of its own labeled containers, then rebuilds previews for valid persisted worktrees.

### 8. Create a PairDock project

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
