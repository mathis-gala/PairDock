# Behavior test plan — PairDock MVP

Target ratio: 80% unit, 15% integration, 5% E2E.

## BT-001 — Installable workspace

Level: integration
Priority: P0
Public interface: workspace commands
Behavior: the Bun workspace installs and typechecks without runtime features.
Given a clean checkout
When `bun install`, `bun run typecheck`, Tailwind build integration, and `bun run prisma:generate` are executed
Then they pass without errors
Why: healthy foundation for implementation agents
Do not test: package manager internals beyond the official Bun commands

## BT-002 — Session creation is persisted

Level: integration
Priority: P0
Public interface: SessionsRepository backed by Prisma
Given an existing project
When a session is created
Then it is persisted as `CREATED` with model_id and project_id
Why: base of the session lifecycle
Do not test: exact timestamp values

## BT-003 — Agent event is persisted

Level: integration
Priority: P0
Public interface: AgentEventsRepository backed by Prisma
Given a session
When a valid agent event arrives
Then it is stored with type and payload
Why: audit and session recovery
Do not test: internal SQL ordering

## BT-004 — PM member access is allowed

Level: unit/integration
Priority: P0
Public interface: SessionAccessGuard
Given a PM member of a session
When they read the session
Then access is allowed
Why: controlled collaboration
Do not test: NestJS decorator mechanics

## BT-005 — Non-member access is denied

Level: unit/integration
Priority: P0
Public interface: SessionAccessGuard
Given a non-member user
When they try to read or prompt a session
Then the backend returns 403
Why: project confidentiality
Do not test: exact error wording

## BT-006 — Valid session transitions

Level: unit
Priority: P0
Public interface: SessionStateMachine
Given a `CREATED` session
When prepare success events arrive in order
Then the state ends as `READY`
Why: predictable orchestration
Do not test: DB persistence

## BT-007 — Invalid transition is rejected

Level: unit
Priority: P0
Public interface: SessionStateMachine
Given a `CREATED` session
When an `agent.done` event arrives
Then the transition is rejected
Why: avoid inconsistent states
Do not test: WebSocket transport

## BT-008 — Backend close session is idempotent

Level: unit
Priority: P0
Public interface: SessionCloseUseCase
Given a session already `CLOSED`
When close is requested again
Then the operation succeeds without a new dangerous command
Why: safe cleanup
Do not test: real worktree deletion

## BT-009 — Agent command is validated

Level: unit
Priority: P0
Public interface: shared Zod command codecs
Given a valid `agent.prompt` payload
When it is parsed
Then the codec returns a typed command
Why: stable contract
Do not test: TypeScript runtime details beyond schema

## BT-010 — Invalid agent event is rejected

Level: unit
Priority: P0
Public interface: shared Zod event codecs
Given an event without protocolVersion
When it is received
Then it is rejected
Why: never trust the agent client
Do not test: exact logs

## BT-011 — Agent event is streamed to authorized UI

Level: integration
Priority: P0
Public interface: AgentGateway + UiGateway
Given a PM member connected to the session
When the agent sends `agent.output`
Then the PM receives the streamed event
Why: collaborative experience
Do not test: React rendering

## BT-012 — Agent announces capabilities

Level: integration
Priority: P0
Public interface: AgentClient
Given a configured agent
When it connects
Then it sends `agent.connected` with capabilities
Why: backend can route commands
Do not test: exact config file format

## BT-013 — Worktree created per session

Level: integration
Priority: P0
Public interface: WorktreeService
Given a temporary git repository
When `session.prepare` is executed
Then a dedicated branch and worktree are created
Why: change isolation
Do not test: git performance

## BT-014 — Main repository is protected

Level: integration
Priority: P0
Public interface: WorktreeService
Given a session cleanup
When the worktree is removed
Then the main repository still exists
Why: avoid data loss
Do not test: exact shell implementation

## BT-015 — Local cleanup is idempotent

Level: integration
Priority: P0
Public interface: SessionRunner.close
Given a session already cleaned up
When close runs again
Then no destructive error occurs
Why: safe retry and reconnection
Do not test: exact logs

## BT-016 — Preview ready is emitted

Level: integration
Priority: P0
Public interface: SessionRunner.prepare
Given Docker and tunnel are available
When preview responds to healthcheck
Then the agent emits `session.ready` with previewUrl
Why: PM must see the rendered app
Do not test: real Cloudflare in unit tests

## BT-017 — Preview failed is explicit

Level: integration
Priority: P0
Public interface: SessionRunner.prepare
Given an app that does not start
When healthcheck times out
Then the agent emits a retryable error or explicit preview failed status
Why: clear diagnosis
Do not test: real long timeout

## BT-018 — Agent prompt runs inside worktree

Level: integration
Priority: P0
Public interface: AgentHarnessPort with CodexHarnessAdapter as MVP implementation
Given a session with a worktree
When a prompt is executed
Then the agent harness process starts with cwd equal to the worktree
Why: avoid modifying the wrong directory
Do not test: provider intelligence

## BT-019 — Agent output streaming

Level: integration
Priority: P0
Public interface: AgentHarnessPort.runPrompt with CodexHarnessAdapter as MVP implementation
Given a process writing stdout/stderr
When it runs
Then chunks are emitted without waiting for completion
Why: PM feedback
Do not test: exact chunk splitting

## BT-020 — Agent cancellation

Level: integration
Priority: P1
Public interface: AgentHarnessPort.cancel
Given an active prompt
When cancel is requested
Then the process is stopped and a final event is emitted
Why: session control
Do not test: exact OS signal if abstracted

## BT-021 — Sensitive file masked from diff

Level: unit/integration
Priority: P0
Public interface: DiffService / SensitiveFilesPolicy
Given a `.env` change
When the diff is collected
Then the content is not transmitted
Why: secret safety
Do not test: every possible glob outside policy

## BT-022 — Logs are redacted

Level: unit
Priority: P0
Public interface: LogRedactor
Given a log containing an apparent token
When it is transmitted
Then the sensitive value is replaced
Why: reduce secret leakage
Do not test: perfect detection of every secret

## BT-023 — All checks OK allow review request validation

Level: unit
Priority: P0
Public interface: ValidationPolicy
Given build/test/lint/preview passed
When the PM requests review request creation
Then the policy allows the next step
Why: MVP quality gate
Do not test: GitHub API

## BT-024 — Failed check blocks review request

Level: unit
Priority: P0
Public interface: ValidationPolicy
Given lint failed
When the PM requests review request creation
Then the policy refuses with a readable reason
Why: avoid unready review requests
Do not test: exact UI wording

## BT-025 — Checks are persisted

Level: integration
Priority: P0
Public interface: ValidationModule
Given a `checks.result`
When the backend receives it
Then a validation_run is persisted
Why: audit and review request button state
Do not test: full logs if truncated

## BT-026 — PM prompt is sent

Level: E2E
Priority: P0
Public interface: PM session UI
Given PM member and READY session
When PM submits a prompt
Then they see the prompt in history and progress events
Why: core product behavior
Do not test: exact CSS style

## BT-027 — Responsive preset changes iframe

Level: unit/light E2E
Priority: P1
Public interface: Preview toolbar
Given a loaded preview
When PM chooses Mobile
Then the iframe viewport applies the 375px mobile preset
Why: responsive validation
Do not test: internal iframe content

## BT-028 — Developer creates session with model

Level: E2E
Priority: P0
Public interface: developer session creation UI
Given a configured project
When developer chooses a model and starts
Then a session is created with model_id
Why: multi-model support from MVP
Do not test: model quality

## BT-029 — Developer closes session

Level: E2E
Priority: P0
Public interface: developer close session UI
Given an open session
When developer confirms close
Then session becomes CLOSED and cleanup is visible
Why: developer control
Do not test: UI animation

## BT-030 — Review request blocked without OK validation

Level: integration
Priority: P0
Public interface: CreateDraftReviewRequestUseCase
Given a session with failed tests
When create review request is called
Then no push command or source-control adapter call is executed
Why: quality gate
Do not test: UI disabled state here

## BT-031 — Branch pushed before review request

Level: integration
Priority: P0
Public interface: CreateDraftReviewRequestUseCase
Given validations OK
When review request is requested
Then backend requests `git.pushBranch` from the agent before source-control draft review request creation
Why: review request must point to a remote branch
Do not test: git internals

## BT-032 — Draft review request created through source-control adapter

Level: integration
Priority: P0
Public interface: SourceControlPort
Given a remote branch and valid GitHub installation
When create draft review request is called
Then a draft review request is created and its URL is persisted
Why: fix delivery
Do not test: real GitHub service in unit tests; GitHub PR mapping belongs to the adapter test

## BT-033 — Full MVP flow

Level: E2E
Priority: P0
Public interface: complete application
Given developer, PM, test repo, connected agent
When developer opens session, PM prompts, checks pass, PM creates a review request, developer closes
Then draft review request exists and session is CLOSED with resources cleaned up
Why: end-to-end product proof
Do not test: exhaustive edge cases

## BT-034 — Two-column login

Level: light E2E
Priority: P0
Public interface: login screen
Given an unauthenticated user
When they open PairDock
Then they see a left Developer/GitHub block and a right PM/Slack block
Why: clarify the two product entry paths
Do not test: pixel-perfect CSS

## BT-035 — Normalized external identities

Level: integration
Priority: P0
Public interface: AuthModule + identity ports
Given a valid GitHub developer or Slack PM callback
When authentication completes
Then the backend creates or finds a PairDock `User` and `ExternalIdentity` without exposing the provider to session guards
Why: preserve hexagonal architecture and provider replaceability
Do not test: real GitHub/Slack SDKs in unit tests

## BT-036 — Use cases decoupled from external providers

Level: unit/static architecture
Priority: P0
Public interface: backend and agent use-case modules
Given session, prompt, validation, and review request modules
When their imports are inspected
Then they depend on internal ports, not GitHub/Slack SDKs, GitHub PR vocabulary, or direct Codex/Docker/Cloudflare commands
Why: providers and agent harnesses can change without rewriting core business logic
Do not test: adapters themselves in this test

## BT-037 — Prisma Client stays behind persistence adapters

Level: unit/static architecture
Priority: P0
Public interface: backend module boundaries
Given backend controllers and use cases
When their imports are inspected
Then they do not import Prisma Client or generated Prisma model types directly
Why: preserve hexagonal persistence boundaries and keep Prisma replaceable inside adapters
Do not test: Prisma adapter internals

## BT-038 — Prisma transaction persists session state atomically

Level: integration
Priority: P0
Public interface: SessionRepository / UnitOfWork backed by Prisma
Given an agent event that changes session status
When event persistence and state transition run
Then the event and updated session status commit together or rollback together
Why: prevent session state drift after partial writes
Do not test: Prisma transaction implementation details beyond observable atomicity

## BT-039 — Tailwind CSS is the web styling foundation

Level: unit/static architecture
Priority: P0
Public interface: web app build/configuration
Given the web app workspace
When its styling setup is inspected and built
Then Tailwind CSS is configured and no alternate CSS framework is required for MVP screens
Why: keep frontend styling consistent and avoid competing styling systems
Do not test: individual Tailwind utility class strings in component behavior tests

## BT-040 — Prisma migration workflow uses Bun scripts

Level: integration
Priority: P0
Public interface: root and API workspace database scripts
Given a local PostgreSQL database and configured `DATABASE_URL`
When `bun run db:migrate:dev -- --name <migration-name>`, `bun run db:migrate`, `bun run db:reset`, and `bun run db:status` are executed in the intended contexts
Then Prisma migrations are created/applied/reset/status-checked through Bun scripts without npm commands
Why: keep migration workflow explicit, reproducible, and aligned with the Bun toolchain
Do not test: Prisma migration engine internals

## BT-041 — Persistence adapters stay split by repository responsibility

Level: unit/static architecture
Priority: P1
Public interface: persistence folder structure
Given the API persistence layer
When the repository ports and Prisma adapters are inspected
Then each repository responsibility has its own port file and Prisma adapter file, with shared mapping/executor utilities isolated under `adapters/prisma/shared/`
Why: preserve SRP and prevent a monolithic persistence adapter from accumulating unrelated responsibilities
Do not test: exact line counts or private helper names

## BT-042 — Pull request CI runs repository quality gates

Level: integration/static architecture
Priority: P0
Public interface: `.github/workflows/ci.yml`
Given a pull request targeting `main`
When GitHub Actions evaluates the CI workflow
Then CI runs with Bun and executes install, Prisma generation, typecheck, lint, tests, build, and migration/status checks as configured
Why: prevent broken changes from entering main and make quality status visible on pull requests
Do not test: GitHub Actions platform internals

## BT-043 — CI uses Bun lockfile and avoids npm lockfiles

Level: unit/static architecture
Priority: P0
Public interface: repository tooling files and CI workflow
Given the repository tooling configuration
When package manager and CI commands are inspected
Then `bun.lock` and Bun commands are used, and `package-lock.json`/npm commands are absent from CI
Why: keep local and CI tooling consistent
Do not test: Bun package resolution internals

## BT-044 — Developer readiness blocks session start when required tools are missing

Level: integration
Priority: P0
Public interface: ToolReadinessModule + developer session UI
Given a developer project with missing required local readiness checks such as Docker unavailable or agent harness unauthenticated
When the developer opens the session start screen
Then the missing checks are visible with remediation and the start-session action is disabled
Why: fail before creating a broken worktree/session
Do not test: exact CLI detection implementation in UI tests

## BT-045 — PM does not need local tool readiness

Level: unit/integration
Priority: P0
Public interface: PM session access policy and UI
Given an invited PM with valid identity and session membership
When they join a ready session
Then access depends on membership and preview availability, not Git, Docker, agent harness, tunnel CLI, or local machine checks
Why: PM is a browser-only collaborator and must not be coupled to developer local tooling
Do not test: Slack OAuth provider internals

## BT-046 — PM can start a session for a shared ready project

Level: integration
Priority: P0
Public interface: SessionStartPolicy + SessionsModule
Behavior: shared-project PM session start is allowed only through project membership and readiness policy.
Given an invited PM project member, an online owning agent, passing required readiness checks, and a project policy that allows PM-started sessions
When the PM starts a session from the shared-project dashboard
Then a session is persisted as `CREATED` and both the PM and developer owner are session members
Why: matches the product flow where the PM starts from a shared project without terminal access
Do not test: React card styling

## BT-047 — PM cannot start a session for unavailable or unshared projects

Level: unit/integration
Priority: P0
Public interface: SessionStartPolicy
Behavior: unauthorized or unavailable PM session start is blocked.
Given a PM without project membership, or a shared project whose owning agent is offline, or required readiness checks are failing
When the PM requests session creation
Then the backend rejects the request and no session or worktree command is created
Why: prevents unauthorized access and broken local-agent sessions
Do not test: exact disabled-button wording

## BT-048 — PM shared-project dashboard reflects start availability

Level: light E2E
Priority: P0
Public interface: PM shared-project dashboard
Behavior: PM sees shared projects and can only start available ones.
Given a PM with one online ready shared project and one offline shared project
When they open the shared-project dashboard
Then the ready project has an enabled start-session action and the offline project is visibly unavailable
Why: the UI must guide PMs before they create sessions
Do not test: pixel-perfect card layout

## BT-049 — Developer shares a project with a PM

Level: integration/light E2E
Priority: P0
Public interface: developer project sharing flow + project membership repository
Behavior: developer-granted project access appears on the PM side.
Given a developer-owned project and a PM identity
When the developer invites or grants the PM project access
Then a project membership exists and the project appears in the PM shared-project list
Why: shared-project access is now distinct from per-session membership
Do not test: Slack invitation delivery unless the implementation explicitly sends invitations

## BT-050 — Review request notification uses notification port

Level: integration
Priority: P1
Public interface: CreateDraftReviewRequestUseCase + NotificationPort
Behavior: developer review notification is emitted after PM-submitted review request creation.
Given a PM-started or PM-submitted session with passing validations
When the draft review request is created
Then the developer owner is notified through `NotificationPort` and the notification result is persisted
Why: the UI promises the developer is notified when the review request is ready
Do not test: Slack API internals outside the Slack adapter contract test

