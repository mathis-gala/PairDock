# PRD — PairDock MVP

## Summary

PairDock lets a developer open a working session on a local project, then invite a PM to drive a local development agent through a collaborative interface. The PM writes prompts, observes the running web app in a responsive iframe, reviews changes, validates the result, and triggers a draft review request. The developer keeps control of the repository, local machine, and session cleanup.

The product/UI reference prototype is stored in `prototype/`, with notes in `docs/prototypes/pairdock-collaborative-developer-pm.md`.

## Goals

- Let an authorized PM request fixes on an existing project without terminal access.
- Provide a two-column login interface: Developer via GitHub on the left, PM via Slack on the right.
- Let an invited PM start a session from a shared project when the developer agent is online and the project is ready.
- Run the configured agent harness locally on the developer machine inside a dedicated Git worktree per session. Codex CLI is the MVP adapter.
- Show a remote preview through Cloudflare Tunnel inside a responsive iframe.
- Block review request creation until build, tests, linter, and preview checks pass.
- Create a draft review request through the source-control adapter after PM validation. GitHub App creates a draft PR in the MVP.
- Let the developer close a session and clean up the worktree, container, and tunnel.

## Non-goals for MVP

- Replace the configured agent harness with a custom AI agent.
- Give the PM an interactive shell.
- Resolve the final merge or merge review requests automatically.
- Support multiple concurrent local agents for the same project.
- Manage production environments or remote secrets.
- Build a full CI platform. MVP still includes repository CI gates for PairDock itself.

## Actors

- Developer: owns the local project, GitHub connection, and local agent.
- Invited PM: signs in through Slack, can see shared projects, start allowed sessions, prompt, inspect preview/diff, and request a draft review request.
- Local Agent: Node.js/TypeScript CLI connected to the backend over WebSocket.
- PairDock Backend: NestJS API, session orchestration, DB, GitHub App integration, WebSockets.
- GitHub App: developer connection, repository access, and draft review request creation as the MVP source-control adapter; internally maps to GitHub draft PRs.
- Slack App/OAuth: PM login and invitation/session identity binding only.
- Codex CLI: MVP local agent harness adapter.

## Functional requirements

### P0

- The login screen displays two separate paths: left block for Developer/GitHub, right block for PM/Slack.
- The developer can connect the GitHub App and register a project linked to a repository and local project alias/path.
- The developer sees a setup/readiness screen before starting a session, showing required local tools and provider configuration.
- The developer can share a project with invited PMs.
- The PM can sign in through Slack and access only projects/sessions where they are a member.
- The PM can see shared projects with online/offline agent availability and can start a session only for projects they can access.
- The developer can also create a session for a project.
- A session creates an isolated branch and worktree.
- The local agent connects to the backend and receives session commands.
- The invited PM can join only sessions where they are a member.
- The PM can send a prompt to the configured agent harness through the backend.
- The PM receives streamed agent output and progress events.
- The agent publishes a readable diff after execution.
- The agent runs build, tests, linter, and preview availability checks.
- The draft review request button is disabled until all P0 validations pass.
- The draft review request is created through `SourceControlPort` after PM validation; GitHub App creates a draft PR in the MVP.
- After a draft review request is created, its URL and status are visible in the shared session.
- The developer can close a session and trigger local cleanup.
- A session cannot start while required developer-side checks are failing: local agent online, Git repository available, GitHub App/repository access, agent harness configured, Docker available, preview tunnel available or explicitly marked optional, and project commands discoverable.
- PairDock repository pull requests run CI gates before merge: install, typecheck, lint, tests, build, Prisma generate, and Prisma migration status/checks.

### P1

- The PM can choose a responsive preview preset: desktop, laptop, tablet, mobile.
- The developer can choose a compatible model when starting a session or sending a prompt.
- The PM can cancel an active agent execution.
- The backend keeps an audit log for key events.
- The system handles local agent reconnection without losing DB state.
- CI status is visible on GitHub pull requests and should be treated as a merge protection signal.
- PM setup is limited to identity/session access checks: Slack login, invitation membership, and browser access to the preview URL. PM does not need local tools.
- The PM can browse previous sessions and draft review requests for projects shared with them.

### P2

- Multi-model comparison.
- Inline comments on diffs.
- Organization-level policies.
- Enriched session history.

## Non-functional requirements

- Security: local secrets must never be exposed to the PM.
- Isolation: each session uses a separate worktree and container.
- Observability: session events must be persisted.
- Resilience: local agent reconnection must allow a session to resume or close cleanly.
- Portability: the AI model interface must allow adding providers without changing the UI or use cases.
- Replaceability: every external tool must go through a hexagonal port/adapter so GitHub, Slack, Codex, Docker, Cloudflare, or an agent harness can be replaced without changing core business logic.
- Latency: agent streaming must reach the PM without waiting for command completion.

## Fixed constraints

- Frontend: React + TanStack + Zod + Tailwind CSS + shadcn/ui components.
- Backend: NestJS + zodValidatorPipe + PostgreSQL + Prisma ORM.
- Package manager/runtime tooling: Bun, pinned through `packageManager` in root `package.json`.
- Local agent: Node.js/TypeScript CLI.
- AI: Codex CLI local for MVP.
- Repository isolation: Git worktree per session.
- Execution: Docker sandbox.
- Preview: Cloudflare Tunnel + responsive iframe.
- Developer login: GitHub App.
- PM login: Slack OAuth/App.
- GitHub: GitHub App.
- Review request type: draft review request. The GitHub adapter maps this to a draft PR; future GitLab adapters may map it to a draft MR.
- Database access: Prisma schema and Prisma Client are the source of truth for persistence access; raw SQL is reserved for exceptional migrations or performance cases with explicit review.
- Migration workflow: use `bun run db:migrate:dev -- --name <migration-name>` during development; use `bun run db:migrate` to apply existing migrations.
- CI provider for MVP: GitHub Actions, triggered on pull requests and main branch pushes.
- AGENTS.md: source for repository rules and agent harness commands.

## Assumptions

- The developer has the MVP agent harness, Codex CLI, installed and authenticated locally.
- The target project contains or can provide the required commands: dev, build, test, lint.
- Docker is available on the developer machine.
- Cloudflare Tunnel can be started locally by the agent.
- GitHub App has access to the target repository.
- Slack is the MVP PM identity provider, but the domain must not be coupled to Slack.
- Backend data access goes through repository/port abstractions backed by Prisma, not direct Prisma calls from controllers.
- Tool readiness checks run on the local agent where local capabilities can be verified; the backend only stores normalized check results.
- Shared project access is represented separately from per-session membership: project sharing controls who can start or see sessions for that project; session membership controls access to one active session.

## Open questions

- Is the repository always GitHub, or should GitLab be planned later through another adapter?
- Slack invitations are not sent proactively in V1; project access is granted inside PairDock after PM login.
- Do build/test/lint commands come only from AGENTS.md, or also from PairDock config?
- Should the SaaS backend store the local project path, or only an agent-side project alias?
- What is the exact policy for deleting or keeping the remote branch on session close?

## Risks and mitigations

- Unstable agent protocol: define a versioned event envelope from MVP.
- Secret leakage in logs/diffs: filter on the agent side, denylist files, and never expose terminal access to PMs.
- Preview unavailable behind some firewalls: represent `PREVIEW_FAILED` separately from `FAILED`.
- Agent harness, GitHub, Slack, Docker, or Cloudflare interface changes: encapsulate every provider behind a port/adapter.
- Incomplete cleanup: make session close idempotent with traceable cleanup steps.

## Handoff summary

Start with shared contracts, then backend project sharing/session/WebSocket orchestration, then local agent worktree/preview/checks, then PM/developer UI, then source-control draft review request creation.

Persistence implementation uses Prisma from the first backend slice: Prisma schema, migrations, generated client, and repository adapters are part of the MVP foundation.

Repository tooling uses Bun from the first slice: install, workspace scripts, Prisma commands, and local app commands should use `bun` commands rather than npm commands.
