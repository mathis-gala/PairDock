# Technical architecture — PairDock MVP

## Current repository context

The repository is early-stage. Technical choices are defined by the provided product decisions: Bun workspaces, React/TanStack/Zod/Tailwind CSS, NestJS/zodValidatorPipe/PostgreSQL with Prisma ORM, local Node.js/TypeScript agent, Codex CLI, Docker, Cloudflare Tunnel, GitHub App, and Slack PM login.

## Architecture style

Hexagonal modular architecture driven by contracts:

- NestJS backend as product orchestrator and source of state.
- Local agent as the privileged adapter to the developer machine, Git, Docker, configured agent harness, and tunnel.
- React frontend as the PM/developer surface without direct local-machine capabilities.
- Versioned WebSocket contracts between backend and agent.
- Common agent harness interface to avoid coupling use cases to Codex.
- Stable business ports for every external tool; replaceable adapters for GitHub, Slack, Codex, Docker, Cloudflare, and future agent harnesses.

The critical boundary is `Backend ↔ Local Agent`. Every local side effect goes through explicit commands and persisted events.

Hexagonal rule: use-case modules never depend directly on a provider SDK, CLI, tunnel, or transport. They depend on internal ports; adapters implement those ports at the edge.

## Containers

- React web app: two-column login screen, developer project/control dashboard, PM shared-project dashboard, chat, diff, validation, responsive preview, developer session controls, styled with Tailwind CSS.
- NestJS API: public REST, UI WebSocket, agent WebSocket, permissions, orchestration.
- PostgreSQL: durable state for users, projects, sessions, events, validations, review requests.
- Prisma ORM: schema, migrations, generated client, and persistence adapter implementation.
- Local Agent CLI: resident service connected to the backend.
- Docker sandbox: runtime for the target project per session.
- Codex CLI: MVP agent harness launched inside the worktree.
- Cloudflare Tunnel: temporary preview exposure.
- GitHub App: developer login, repository installation, and draft review request creation as the MVP source-control adapter; internally maps to GitHub draft PRs.
- Slack App/OAuth: PM login, invitation identity, and MVP notification adapter for developer review-request notifications.
- Bun: package manager and workspace command runner for install, typecheck, Prisma commands, and local dev scripts.

## Backend NestJS modules

### AuthModule

Responsibilities:
- Authenticate developers through GitHub and PMs through Slack.
- Issue API/UI tokens.
- Identify the current user.

Ports:
- `DeveloperIdentityPort`, implemented in MVP by `GithubDeveloperIdentityAdapter`.
- `PmIdentityPort`, implemented in MVP by `SlackPmIdentityAdapter`.

### UsersModule

Responsibilities:
- User profiles.
- Minimal global role/kind.

### PersistenceModule

Responsibilities:
- Own PrismaClient lifecycle in NestJS.
- Provide repository adapters backed by Prisma.
- Own transaction boundaries for multi-entity writes.
- Keep Prisma types out of controllers and public API contracts.

Constraint:
- Use cases depend on repository ports; only persistence adapters import Prisma Client.

Repository structure:
- Repository ports live under `apps/api/src/persistence/ports/`, one file per aggregate/repository responsibility.
- Prisma adapters live under `apps/api/src/persistence/adapters/prisma/<repository>/`, one adapter per repository.
- Shared Prisma adapter utilities live under `apps/api/src/persistence/adapters/prisma/shared/`.
- Unit-of-work lives behind `PersistenceUnitOfWork` and is implemented by `PrismaPersistenceUnitOfWork`.

### GithubModule

Responsibilities:
- OAuth/GitHub App installation.
- Installation/repository resolution.
- Draft review request creation. The GitHub adapter maps this to a draft PR.
- Repository permission checks.

Domain port:
- `SourceControlPort`.

MVP adapter:
- `GithubSourceControlAdapter`.

### SlackModule

Responsibilities:
- PM login through Slack OAuth/App.
- Resolve Slack identity into a PairDock user.
- Bind PM invitations.

Domain port:
- `PmIdentityPort`.

MVP adapter:
- `SlackPmIdentityAdapter`.

### ProjectsModule

Responsibilities:
- PairDock project linked to a source-control repository, local agent project alias/path, and owning developer.
- Shared project access for invited PMs.
- Repository metadata, default branch, declared commands, default model, and current agent availability summary.

Access rule:
- Project membership decides who can see a project and start sessions for it.
- Session membership decides who can access a specific session after it exists.

### SessionsModule

Responsibilities:
- Session lifecycle.
- Business state transitions.
- Session authorization.
- Prepare, close, prompt, and review request operations.
- Session start policy for both developer-owned and PM-started sessions.

Session start rule:
- a developer owner can start a session for their project;
- an invited PM can start a session for a shared project only when the owning local agent is online, required developer readiness checks are passing, and the project policy allows PM-started sessions;
- a PM-started session creates session membership for the PM and developer owner.

### InvitationsModule

Responsibilities:
- PM invitations.
- Project membership and role.
- Session membership and role.

### NotificationsModule

Responsibilities:
- Send provider-neutral product notifications such as review-request-created and session-needs-attention.
- Keep notification delivery out of session and review-request use cases.

Domain port:
- `NotificationPort`.

MVP adapter:
- `SlackNotificationAdapter`.

### AgentGatewayModule

Responsibilities:
- Backend ↔ local agent WebSocket.
- Route commands to the connected agent.
- Validate agent messages with Zod.
- Persist agent events.

### UiGatewayModule

Responsibilities:
- Stream session events to PM/developer browsers.
- Broadcast only according to permissions.

### PromptsModule

Responsibilities:
- Persist prompts.
- Reject prompts if the session is not ready or already running.
- Send `agent.prompt` to the local agent.

### DiffModule

Responsibilities:
- Store diff snapshots.
- Mask sensitive files.
- Provide readable diffs to the UI.

### ValidationModule

Responsibilities:
- Aggregate build/test/lint/preview results.
- Allow or block draft review request creation.

### PreviewModule

Responsibilities:
- Store preview URL and availability state.
- Expose responsive preview presets to the UI.

### ToolReadinessModule

Responsibilities:
- Store normalized developer-side readiness checks reported by the local agent.
- Expose readiness status to the developer project/session UI.
- Block session start when required checks are failing.
- Expose PM-side access readiness only for identity/session/preview access, not local tools.

Required developer-side checks for MVP:
- local agent connected and version compatible,
- target path is a Git repository with a clean-enough baseline for a worktree,
- Git CLI available,
- GitHub App/repository access available through `SourceControlPort`,
- configured agent harness available and authenticated; Codex CLI is the MVP adapter check,
- Docker daemon available,
- Cloudflare Tunnel binary/config available or marked optional by project policy,
- project commands discoverable from PairDock config or `AGENTS.md`: dev, build, test, lint.

PM-side checks:
- authenticated through the PM identity adapter,
- session membership exists,
- browser can load the preview URL when the session is ready.

Rule: PM readiness never requires local tools, CLI credentials, Docker, Git, agent harness, or tunnel credentials.

### AuditLogModule

Responsibilities:
- Log user actions and security-sensitive events.

## Frontend styling

- Tailwind CSS is the MVP styling system.
- Shared layout primitives should use Tailwind utility classes and project-level design tokens/configuration, not ad hoc CSS frameworks.
- Component behavior remains tested through public UI behavior; do not test Tailwind class strings except for project-level static checks that verify the Tailwind setup exists.

## Frontend product surfaces

### Login

- Centered dark landing screen with two explicit cards:
  - developer card: GitHub entry path and local-tool expectations;
  - product card: Slack entry path and invitation-only expectation.

### Developer dashboard

- Left navigation: projects, active sessions, models, connections.
- Main project list: local project alias/path, default branch/model, active-session state, PM presence, open/configure action.
- Project creation/configuration captures local project alias/path, default model, and base branch.
- Right rail exposes provider connection state and recent project/session activity.
- Developer can close sessions and see cleanup status from the session control surfaces.

### PM dashboard

- Left navigation: shared projects, my sessions, review requests.
- Shared project cards show project name, short description, owner, model, and owning-agent online/offline state.
- `Start session` is enabled only when project membership, agent availability, and developer readiness policy allow it.
- PM views never expose local file paths, CLI credentials, local diagnostic detail, or machine-level readiness checks.

### Session workspace

- Persistent top bar shows project, branch, model, participants, owning agent, and online status.
- Left pane contains the PM prompt composer, conversation, and agent progress steps.
- Right pane contains browser-like preview chrome, preview iframe, responsive preset toolbar, status bar, and review-request action.
- The review-request action remains disabled until validation policy allows it.

## Local agent structure

```text
local-agent/
  src/
    main.ts
    config/
      agent-config.ts
    websocket/
      agent-client.ts
      message-codecs.ts
    session/
      session-runner.ts
      session-registry.ts
    git/
      worktree.service.ts
      diff.service.ts
      push.service.ts
      sensitive-files.policy.ts
    docker/
      docker-compose.service.ts
      healthcheck.service.ts
    codex/
      ai-agent-adapter.ts
      codex-cli.adapter.ts
    harness/
      agent-harness.port.ts
      codex-harness.adapter.ts
    validation/
      checks-runner.ts
      command-resolver.ts
    readiness/
      readiness-runner.ts
      tool-detectors.ts
    tunnel/
      cloudflare-tunnel.service.ts
    logging/
      redactor.ts
```

Planned CLI commands:

```text
pairdock-agent login
pairdock-agent start
pairdock-agent status
pairdock-agent stop
```

## Repository tooling

- Bun is the required package manager and workspace command runner.
- Root `package.json` pins `packageManager: "bun@1.3.13"`.
- Root scripts should call workspace scripts through Bun filters/workspaces, not npm.
- `bun.lock` is the committed lockfile; `package-lock.json` should not be regenerated.

Primary commands:

```text
bun install
bun run typecheck
bun run prisma:generate
bun run db:migrate:dev -- --name <migration-name>
bun run db:migrate
bun run db:reset
bun run db:status
bun run dev:web
bun run dev:api
bun run dev:agent
```

## Repository CI

MVP repository CI is GitHub Actions. This is not a PairDock product feature or a general CI platform; it is the quality gate for the PairDock codebase itself.

Triggers:
- pull requests targeting `main`,
- pushes to `main`.

Required CI gates:
- `bun install --frozen-lockfile`,
- `bun run prisma:generate`,
- `bun run typecheck`,
- `bun run lint`,
- `bun run test`,
- `bun run build`,
- Prisma migration check/status against a CI PostgreSQL service when migrations exist.

Rules:
- CI uses Bun and `bun.lock`; it must not generate `package-lock.json`.
- CI should fail on architecture boundary tests, including provider-neutral contracts and Prisma adapter boundaries.
- Pull requests should not be considered mergeable unless required CI gates pass.

## MVP data model

Prisma is the persistence source of truth. The following schema is conceptual SQL for architectural review only; implementation must express these entities in `prisma/schema.prisma`, apply changes through Prisma migrations, and access data through repository adapters backed by Prisma Client.

```sql
users (
  id uuid primary key,
  email text unique not null,
  display_name text,
  kind text not null,
  created_at timestamptz not null default now()
);

external_identities (
  id uuid primary key,
  user_id uuid not null references users(id),
  provider text not null,
  provider_user_id text not null,
  provider_team_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(provider, provider_user_id, provider_team_id)
);

github_installations (
  id uuid primary key,
  owner_user_id uuid not null references users(id),
  github_installation_id text not null,
  account_login text not null,
  created_at timestamptz not null default now()
);

projects (
  id uuid primary key,
  owner_user_id uuid not null references users(id),
  github_installation_id uuid not null references github_installations(id),
  name text not null,
  repo_full_name text not null,
  default_branch text not null,
  agent_project_key text not null,
  created_at timestamptz not null default now()
);

project_members (
  id uuid primary key,
  project_id uuid not null references projects(id),
  user_id uuid not null references users(id),
  role text not null,
  invited_by_user_id uuid references users(id),
  created_at timestamptz not null default now(),
  unique(project_id, user_id)
);

sessions (
  id uuid primary key,
  project_id uuid not null references projects(id),
  created_by_user_id uuid not null references users(id),
  status text not null,
  model_id text not null,
  branch_name text,
  worktree_ref text,
  preview_url text,
  last_error text,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

session_members (
  id uuid primary key,
  session_id uuid not null references sessions(id),
  user_id uuid not null references users(id),
  role text not null,
  unique(session_id, user_id)
);

messages (
  id uuid primary key,
  session_id uuid not null references sessions(id),
  user_id uuid references users(id),
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

agent_events (
  id uuid primary key,
  session_id uuid references sessions(id),
  agent_id text,
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

validation_runs (
  id uuid primary key,
  session_id uuid not null references sessions(id),
  status text not null,
  build_status text,
  test_status text,
  lint_status text,
  preview_status text,
  logs_ref text,
  created_at timestamptz not null default now()
);

review_requests (
  id uuid primary key,
  session_id uuid not null references sessions(id),
  review_request_number int,
  review_request_url text,
  status text not null,
  created_at timestamptz not null default now()
);

notifications (
  id uuid primary key,
  user_id uuid not null references users(id),
  session_id uuid references sessions(id),
  type text not null,
  provider text,
  provider_message_id text,
  status text not null,
  created_at timestamptz not null default now()
);
```

## Session states

```text
CREATED
AGENT_CONNECTING
WORKTREE_CREATING
DOCKER_STARTING
PREVIEW_STARTING
READY
AGENT_RUNNING
CHECKS_RUNNING
AWAITING_PM_VALIDATION
REVIEW_REQUEST_CREATING
REVIEW_REQUEST_CREATED
CLOSING
CLOSED
FAILED
```

Important transitions:
- `CREATED -> AGENT_CONNECTING -> WORKTREE_CREATING -> DOCKER_STARTING -> PREVIEW_STARTING -> READY`
- `READY -> AGENT_RUNNING -> CHECKS_RUNNING -> AWAITING_PM_VALIDATION`
- `AWAITING_PM_VALIDATION -> REVIEW_REQUEST_CREATING -> REVIEW_REQUEST_CREATED`
- `* -> CLOSING -> CLOSED`
- `* -> FAILED`

Session creation entry points:
- Developer-created: developer owner chooses project/model and starts a session.
- PM-created: PM starts from a shared-project card; backend verifies project membership, owning-agent availability, readiness status, and project policy before persisting `CREATED`.

## Backend ↔ agent WebSocket contract

### Common envelope

```ts
interface AgentProtocolEnvelope<TPayload> {
  protocolVersion: "2026-06-27";
  messageId: string;
  sessionId?: string;
  type: string;
  payload: TPayload;
  sentAt: string;
}
```

### Backend → agent commands

```ts
type BackendCommand =
  | { type: "session.prepare"; payload: { sessionId: string; projectKey: string; branchName: string; modelId: string } }
  | { type: "readiness.check"; payload: { projectKey: string; sessionId?: string } }
  | { type: "agent.prompt"; payload: { sessionId: string; prompt: string; modelId: string } }
  | { type: "agent.cancel"; payload: { sessionId: string } }
  | { type: "git.getDiff"; payload: { sessionId: string } }
  | { type: "checks.run"; payload: { sessionId: string } }
  | { type: "git.pushBranch"; payload: { sessionId: string } }
  | { type: "session.close"; payload: { sessionId: string; mode: "keep-branch" | "delete-local" } };
```

### Agent → backend events

```ts
type AgentEvent =
  | { type: "agent.connected"; payload: { agentId: string; capabilities: string[] } }
  | { type: "readiness.result"; payload: { projectKey: string; sessionId?: string; ok: boolean; checks: ToolReadinessCheck[] } }
  | { type: "session.progress"; payload: { sessionId: string; status: string; message?: string } }
  | { type: "session.ready"; payload: { sessionId: string; previewUrl: string } }
  | { type: "agent.output"; payload: { sessionId: string; stream: "stdout" | "stderr"; text: string } }
  | { type: "agent.done"; payload: { sessionId: string; exitCode: number } }
  | { type: "git.diff"; payload: { sessionId: string; diff: string; changedFiles: string[] } }
  | { type: "checks.result"; payload: { sessionId: string; ok: boolean; build: CheckResult; tests: CheckResult; lint: CheckResult; preview: CheckResult } }
  | { type: "git.branchPushed"; payload: { sessionId: string; branchName: string } }
  | { type: "session.closed"; payload: { sessionId: string; cleaned: boolean } }
  | { type: "error"; payload: { sessionId?: string; code: string; message: string; retryable: boolean } };

interface CheckResult {
  status: "passed" | "failed" | "skipped";
  command?: string;
  logs?: string;
}

interface ToolReadinessCheck {
  key: "agent" | "git" | "repository" | "source-control" | "agent-harness" | "docker" | "preview-tunnel" | "project-commands";
  status: "passed" | "failed" | "warning" | "skipped";
  required: boolean;
  message?: string;
  remediation?: string;
}
```

### UI session-start contract

```ts
interface SharedProjectSummary {
  projectId: string;
  name: string;
  description?: string;
  ownerDisplayName: string;
  defaultModelId: string;
  agentAvailability: "online" | "offline" | "unknown";
  canStartSession: boolean;
  unavailableReason?: string;
}

interface StartSessionInput {
  projectId: string;
  requestedByUserId: string;
  modelId?: string;
  startSource: "developer" | "pm";
}
```

## Multi-model interface

The backend exposes models through `ModelRegistry`, but only the agent executes the local provider.

```ts
interface AiModelDescriptor {
  id: string;
  label: string;
  provider: "codex-cli" | "openai-compatible" | "custom";
  supportsStreaming: boolean;
}

interface AiAgentAdapter {
  runPrompt(input: RunPromptInput): AsyncIterable<AgentRunEvent>;
  cancel(sessionId: string): Promise<void>;
}
```

Rule: session/prompt modules never know Codex CLI details.

## External ports/adapters

Every external provider is behind an internal port. Adapters are the only components allowed to import provider SDKs or launch provider CLIs.

```ts
interface DeveloperIdentityPort {
  startLogin(input: LoginStartInput): Promise<LoginRedirect>;
  completeLogin(input: LoginCallbackInput): Promise<ExternalIdentity>;
}

interface PmIdentityPort {
  startLogin(input: LoginStartInput): Promise<LoginRedirect>;
  completeLogin(input: LoginCallbackInput): Promise<ExternalIdentity>;
}

interface SourceControlPort {
  createDraftReviewRequest(input: CreateDraftReviewRequestInput): Promise<ReviewRequestRef>;
  verifyRepositoryAccess(input: RepositoryAccessInput): Promise<RepositoryAccessResult>;
}

interface NotificationPort {
  send(input: NotificationInput): Promise<NotificationRef>;
}

interface PreviewTunnelPort {
  open(input: PreviewTunnelInput): Promise<PreviewTunnelRef>;
  close(ref: PreviewTunnelRef): Promise<void>;
}

interface SandboxPort {
  start(input: SandboxStartInput): Promise<SandboxRef>;
  stop(ref: SandboxRef): Promise<void>;
  check(ref: SandboxRef): Promise<HealthcheckResult>;
}

interface AgentHarnessPort {
  runPrompt(input: RunPromptInput): AsyncIterable<AgentRunEvent>;
  cancel(sessionId: string): Promise<void>;
}
```

MVP adapters:
- `GithubDeveloperIdentityAdapter` for developer login.
- `SlackPmIdentityAdapter` for PM login.
- `GithubSourceControlAdapter` for repositories and draft review requests. Internally it maps to GitHub draft PR APIs.
- `SlackNotificationAdapter` for developer notifications after PM-created review requests.
- `CodexHarnessAdapter` for Codex CLI.
- `DockerSandboxAdapter` for sandbox execution.
- `CloudflarePreviewTunnelAdapter` for preview.

Possible future adapters:
- GitLab/Bitbucket source control.
- Microsoft Teams/Google Workspace PM identity.
- Email/Slack/Teams notification adapters.
- Claude Code/OpenCode/other agent harness.
- Kubernetes/Firecracker sandbox.
- Tailscale/ngrok/other preview tunnel.

## Login interface

The MVP login screen intentionally separates the two visible entry paths:

```text
┌────────────────────────────┬────────────────────────────┐
│ Developer                  │ Product Manager             │
│ Connect with GitHub        │ Connect with Slack          │
│ GitHub App permissions     │ Slack workspace identity    │
└────────────────────────────┴────────────────────────────┘
```

Rules:
- The left block triggers `DeveloperIdentityPort` and GitHub App installation when needed.
- The right block triggers `PmIdentityPort` through Slack OAuth/App.
- The domain must not depend on GitHub or Slack to decide permissions; it consumes only `User`, `ExternalIdentity`, `SessionMember`, and policies.

## Responsive preview

The iframe loads `session.preview_url`. The UI toolbar applies only client-side dimensions.

MVP presets:

```text
Mobile 375
Tablet 768
Laptop 1024
Desktop 1280
Full responsive
```

Changing preset does not require a backend mutation.

## Validation before review request

Draft review request creation is allowed only if the latest `validation_run` for the session satisfies:

- build_status = passed
- test_status = passed
- lint_status = passed
- preview_status = passed
- session.status = AWAITING_PM_VALIDATION
- current user is a PM member or developer owner, according to the MVP policy

If a check fails, the UI displays logs and keeps the review request button disabled.

## Review request creation

MVP decision:

1. The agent pushes the branch from the local worktree.
2. The backend creates the draft review request through `SourceControlPort`.
3. The GitHub adapter maps the generic review request to a GitHub draft PR.
4. If the session was PM-started or PM-submitted, the backend emits a provider-neutral notification through `NotificationPort` to the developer owner.

Reason: the agent owns local Git operations; the backend keeps the controlled, auditable GitHub identity.

## Security and permissions

- PM never receives shell access, tokens, full local paths, or environment variables.
- Accepted local commands are only those defined by the protocol.
- Sensitive files blocked from diffs/logs:
  - `.env`
  - `.env.*`
  - `*.pem`
  - `*.key`
  - `id_rsa`
  - `id_ed25519`
  - `.aws/**`
  - `.ssh/**`
- Logs are redacted on the agent before transmission.
- Session close is idempotent.
- Events are persisted for audit.

## Dependency rules

- UI depends on APIs/contracts, not backend internals.
- Backend depends on agent contracts, not local services.
- Agent depends on backend contracts, not the DB.
- Backend use cases do not depend directly on GitHub SDK, Slack SDK, or WebSocket; they use ports/adapters.
- GitHub, Slack, Docker, Cloudflare, and every agent harness are behind ports.
- Codex CLI is behind `AgentHarnessPort`/`AiAgentAdapter`.
- Prisma Client is behind persistence adapters/repositories; controllers and use cases do not import generated Prisma model types directly.

## Persistence and transaction boundaries

- Prisma migrations own relational schema changes.
- `schema.prisma` is version-controlled and reviewed as the persistence contract.
- Repository adapters translate between Prisma records and domain/application DTOs.
- Multi-entity state changes that must be atomic use Prisma transactions.
- Important atomic boundaries:
  - create user + external identity after GitHub/Slack callback,
  - create session + first membership + audit event,
  - persist agent event + session state transition,
  - persist validation run + update session status,
  - persist review request + update session status.
- Raw SQL is exceptional and must remain inside persistence adapters or migrations.

## Observability

Each session must expose:
- current state,
- latest event,
- latest filtered logs,
- latest diff,
- latest validation result,
- review request URL if created.

## Diagram links

- `diagrams/context.mmd`
- `diagrams/component.mmd`
- `diagrams/class.mmd`
- `diagrams/sequence.mmd`
