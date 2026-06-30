# Implementation handoff — PairDock MVP

## T01 — Monorepo and shared contracts

Owner: Software Engineer

Purpose: create the repository foundation without heavy business logic.

Input artifacts:
- `docs/architecture/pairdock-mvp/architecture.md`
- `docs/architecture/pairdock-mvp/PRD.md`

Expected files/modules:
- workspace root
- Bun workspace configuration with `packageManager: "bun@1.3.13"`
- React web app
- Tailwind CSS configuration for the web app
- NestJS API app
- local agent Node.js/TypeScript package
- shared Zod/TypeScript contracts package
- domain/package area for ports and interfaces before provider adapters
- Prisma dependencies and API workspace scripts for generate/migrate/status

Public behavior:
- the repository installs, typechecks, and starts skeleton apps.
- root scripts use Bun for workspace commands and Prisma commands.

Related tests: BT-001, BT-039, BT-040

Constraints:
- no production feature beyond skeleton.
- all agent/UI contracts must live in shared packages.
- no external SDK may be imported by use cases; define ports/adapters from the skeleton.
- use Bun commands and `bun.lock`; do not add npm lockfiles or npm-based scripts.

Done criteria:
- install OK
- typecheck OK
- Tailwind build integration OK
- Prisma generate command available from the API workspace
- minimal developer README

Validation commands:
- `bun install`
- `bun run typecheck`
- `bun run prisma:generate`

## T02 — Prisma persistence foundation

Owner: Software Engineer

Purpose: set up Prisma as the ORM and materialize identity, project sharing, session, event, validation, review request, and notification entities.

Input artifacts:
- data model from `architecture.md`

Expected files/modules:
- `apps/api/prisma/schema.prisma`
- Prisma migrations for PostgreSQL
- PrismaModule / PersistenceModule
- generated Prisma Client
- backend repository ports split by responsibility under `apps/api/src/persistence/ports/`
- Prisma-backed adapters split by repository under `apps/api/src/persistence/adapters/prisma/<repository>/`
- shared Prisma executor/mapper/repository factory utilities

Public behavior:
- the API can create/read external identities, projects, project members, sessions, session members, events, review requests, and notification records.

Related tests: BT-002, BT-003, BT-037, BT-038, BT-040, BT-041

Constraints:
- status values aligned with the architecture.
- no local secrets stored.
- Prisma schema is the source of truth for persistence.
- controllers and use cases must not import Prisma Client directly; they depend on repository ports.
- raw SQL is allowed only in reviewed migrations or persistence adapters.

Done criteria:
- `prisma generate` OK
- `bun run db:migrate:dev -- --name <migration-name>` creates reviewed dev migrations
- `bun run db:migrate`, `bun run db:reset`, and `bun run db:status` work against local PostgreSQL
- repository adapter tests OK

## T03 — Auth and session permissions

Owner: Software Engineer

Purpose: prevent unauthorized session access.

Expected files/modules:
- AuthModule
- UsersModule
- InvitationsModule
- DeveloperIdentityPort + GithubDeveloperIdentityAdapter
- PmIdentityPort + SlackPmIdentityAdapter
- session guards
- project membership guards/policies

Public behavior:
- the login screen shows a left Developer/GitHub block and a right PM/Slack block.
- a developer signs in through GitHub.
- a PM signs in through Slack.
- developer owner can manage their projects/sessions.
- PM session member can read a session and send prompts.
- invited PM project member can see shared projects and start sessions when policy allows.
- non-member user receives 403.

Related tests: BT-004, BT-005, BT-034, BT-035, BT-049

Constraints:
- permissions are enforced for REST and UI WebSocket.
- GitHub and Slack remain adapters; guards consume normalized PairDock identity.

Done criteria:
- P0 authorization tests OK

## T04 — Backend session lifecycle

Owner: Software Engineer

Purpose: implement the backend session state machine and session-start policy.

Expected files/modules:
- SessionsModule
- SessionStateMachine
- SessionStartPolicy
- session command REST endpoints

Public behavior:
- create session
- allow developer-created sessions for owned projects
- allow PM-created sessions only for shared projects with online/ready developer agent
- transition state from agent events
- reject invalid transitions
- close session

Related tests: BT-006, BT-007, BT-008, BT-046, BT-047

Constraints:
- transitions are centralized, not scattered across controllers.

Done criteria:
- state machine unit tests OK

## T05 — Backend ↔ agent WebSocket

Owner: Software Engineer

Purpose: connect the local agent and backend with a versioned protocol.

Expected files/modules:
- AgentGatewayModule
- shared Zod codecs
- event persistence

Public behavior:
- agent identifies itself.
- backend routes commands to the owning agent.
- invalid events are rejected.
- valid events are persisted and streamed to UI.

Related tests: BT-009, BT-010, BT-011

Constraints:
- never trust agent payloads without Zod validation.

Done criteria:
- gateway and codec tests OK

## T06 — Local agent: config, login, connection

Owner: Software Developer

Purpose: provide a minimal backend-connectable agent CLI.

Expected files/modules:
- `pairdock-agent login`
- `pairdock-agent start`
- local config
- WebSocket client

Public behavior:
- the agent starts, connects, and announces its capabilities.

Related tests: BT-012

Constraints:
- do not log tokens.

Done criteria:
- connected agent visible from backend

## T07 — Local agent: worktree and cleanup

Owner: Software Engineer

Purpose: isolate every session in Git.

Expected files/modules:
- WorktreeService
- SessionRegistry
- idempotent cleanup

Public behavior:
- `session.prepare` creates a branch and worktree.
- `session.close` stops the session and deletes local resources according to mode.

Related tests: BT-013, BT-014, BT-015

Constraints:
- never delete the main repository.
- cleanup is idempotent.

Done criteria:
- tests on a temporary repository OK

## T08 — Local agent: Docker preview and Cloudflare Tunnel

Owner: Software Engineer

Purpose: make the target web app visible to the PM.

Expected files/modules:
- DockerSandboxAdapter / SandboxPort
- HealthcheckService
- CloudflarePreviewTunnelAdapter / PreviewTunnelPort

Public behavior:
- the session starts the project inside Docker.
- preview URL is sent to the backend.
- preview failure state is explicit.

Related tests: BT-016, BT-017

Constraints:
- commands are resolved from config/AGENTS.md, not hardcoded.
- session orchestration depends on ports, not directly on Docker or Cloudflare.

Done criteria:
- preview accessible on an example project

## T09 — Local agent: agent harness adapter and streaming

Owner: Software Engineer

Purpose: execute the configured agent harness in the worktree and stream events.

Expected files/modules:
- AgentHarnessPort / AiAgentAdapter
- CodexHarnessAdapter / CodexCliAdapter
- cancellation

Public behavior:
- PM prompt becomes an agent harness command.
- stdout/stderr are streamed.
- cancellation stops the process.

Related tests: BT-018, BT-019, BT-020

Constraints:
- the agent harness is launched only inside the session worktree.
- no PM shell access.
- the session does not depend directly on Codex; it depends on the agent harness port.

Done criteria:
- dummy prompt on example project produces logs and exit code

## T10 — Diff, redaction, and sensitive files

Owner: Software Engineer

Purpose: show changes without leaking secrets.

Expected files/modules:
- backend DiffService
- agent sensitive-files policy
- log redactor

Public behavior:
- diff sent after agent execution.
- sensitive files are masked/refused.

Related tests: BT-021, BT-022

Constraints:
- denylist applied before backend transmission.

Done criteria:
- secret safety tests OK

## T11 — Build/test/lint/preview validations

Owner: Software Engineer

Purpose: block review request creation until the fix is ready.

Expected files/modules:
- agent ChecksRunner
- backend ValidationModule
- validation_run persistence

Public behavior:
- build/tests/lint/preview produce statuses.
- review request cannot be created if any check fails.

Related tests: BT-023, BT-024, BT-025

Constraints:
- logs are limited and redacted.

Done criteria:
- build failure visible in UI/API
- full success allows PM validation

## T12 — PM session UI

Owner: Software Developer

Purpose: PM surface: prompt, logs, diff, preview.

Expected files/modules:
- PM/Slack login block when unauthenticated
- PM shared-project dashboard
- PM session route
- chat/prompt panel
- event stream viewer
- diff viewer
- responsive iframe preview toolbar
- Tailwind-based layout/styling

Public behavior:
- PM can start a session from an enabled shared-project card.
- PM prompts the configured agent harness.
- PM sees progress, diff, and preview.
- responsive preset changes iframe size.

Related tests: BT-026, BT-027, BT-048

Constraints:
- no terminal control.
- use Tailwind CSS for styling; do not introduce another CSS framework.

Done criteria:
- PM flow usable locally

## T13 — Developer session control UI

Owner: Software Developer

Purpose: give the developer project/session/cleanup control.

Expected files/modules:
- Developer/GitHub login block when unauthenticated
- developer project dashboard with connection/activity rail
- project creation screen
- project sharing/invitation screen or flow
- session start screen
- session close action
- model selector
- Tailwind-based layout/styling

Public behavior:
- developer shares a project with PMs.
- developer creates a session with a model.
- developer closes a session and sees cleanup status.

Related tests: BT-028, BT-029, BT-049

Constraints:
- close session requires UI confirmation.
- use Tailwind CSS for styling; do not introduce another CSS framework.

Done criteria:
- developer can create and close a session end-to-end

## T13A — Developer tool readiness UI

Owner: Software Developer

Purpose: prevent developers from starting sessions before required local tools and provider configuration are available.

Expected files/modules:
- ToolReadinessModule API surface
- local agent readiness runner
- developer setup/readiness screen
- per-check status rows with remediation text

Public behavior:
- developer sees readiness for local agent, Git repository, Git CLI, source-control access, agent harness, Docker, preview tunnel, and project commands.
- failed required checks block session start.
- warning/optional checks are visible but do not block when project policy marks them optional.
- PM UI only shows PM access state: Slack identity, session membership, and preview reachability when ready.

Related tests: BT-044, BT-045

Constraints:
- readiness checks that require local machine access run in the local agent, not in the browser or SaaS backend.
- PM must never see local paths, CLI credentials, or machine-level diagnostics.
- use provider-neutral check keys in shared contracts; Codex/GitHub/Cloudflare-specific details stay in adapters/remediation text.

Done criteria:
- session start is disabled with clear remediation when required developer-side checks fail.
- PM can join a ready session without installing any local tools.

## T14 — Source-control adapter and draft review request

Owner: Software Engineer

Purpose: create a draft review request after validation.

Expected files/modules:
- GithubModule
- SourceControlPort + GithubSourceControlAdapter
- NotificationsModule
- NotificationPort + SlackNotificationAdapter
- review request use case
- branch push command integration

Public behavior:
- backend asks the agent to push the branch.
- backend creates a draft review request through SourceControlPort.
- GitHub adapter maps the generic review request to a GitHub draft PR.
- review request URL is persisted and displayed.
- developer owner is notified when a PM-created or PM-submitted review request is ready.

Related tests: BT-030, BT-031, BT-032, BT-050

Constraints:
- review request is blocked if validations are not OK.
- review request is draft only.
- review request use case depends on SourceControlPort, not GitHub SDK or GitHub PR vocabulary.
- notification use case depends on NotificationPort, not Slack SDK or Slack vocabulary.

Done criteria:
- draft review request created on a test repository
- notification adapter called through `NotificationPort` when required

## T15 — MVP E2E

Owner: Software Engineer

Purpose: validate the full critical path.

Expected files/modules:
- local E2E scenario
- example repository fixtures

Public behavior:
- developer starts a session.
- PM prompts.
- agent-produced change is simulated or real.
- validations pass.
- draft review request is created.
- developer closes the session.

Related tests: BT-033, BT-036

Constraints:
- use a test repository, never a real user repository without confirmation.

Done criteria:
- documented and reproducible scenario

## T16 — Repository CI gates

Owner: Software Engineer

Purpose: add GitHub Actions CI for PairDock pull requests and main branch pushes.

Expected files/modules:
- `.github/workflows/ci.yml`
- root scripts for `lint`, `test`, and `build` if missing
- CI PostgreSQL service configuration when Prisma migration/status checks need a database

Public behavior:
- every pull request targeting `main` runs CI.
- pushes to `main` run CI.
- CI verifies install, Prisma generation, typecheck, lint, tests, build, and migration status/checks.

Related tests: BT-042, BT-043

Constraints:
- use Bun and `bun.lock`; do not use npm or generate `package-lock.json`.
- keep CI focused on repository quality gates, not PairDock product validation sessions.
- if a workspace has no meaningful tests yet, the script may be a no-op only temporarily and must still exist explicitly.

Done criteria:
- `bun install --frozen-lockfile` succeeds in CI.
- `bun run prisma:generate` succeeds in CI.
- `bun run typecheck`, `bun run lint`, `bun run test`, and `bun run build` succeed in CI.
- CI workflow triggers on pull requests and pushes to `main`.
