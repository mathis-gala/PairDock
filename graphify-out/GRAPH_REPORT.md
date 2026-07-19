# Graph Report - PairDock  (2026-07-19)

## Corpus Check
- 262 files · ~128,793 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2446 nodes · 5334 edges · 147 communities (127 shown, 20 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 92 edges (avg confidence: 0.73)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `18309d02`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- agent-config.ts
- create-draft-review-request.use-case.ts
- Button
- events.ts
- index.ts
- index.ts
- developer-home-page.tsx
- app-shell.tsx
- SandboxRef
- persistence.module.ts
- PairDockUser
- client.ts
- sessions.service.ts
- session.ts
- scripts
- ConnectedAgentsRegistry
- PairDockIdentity
- AuthService
- ProjectPreviewConfig
- support.js
- json-parsers.ts
- pm-session-page.tsx
- includes
- package.json
- readiness-runner.ts
- agent-client.ts
- github-source-control.adapter.ts
- package.json
- mvp-flow.e2e.test.ts
- AuthTokenService
- github-developer-identity.adapter.ts
- agent-events.repository.ts
- external-identities.repository.ts
- slack-pm-identity.adapter.ts
- WorktreeService
- sessions.controller.ts
- DatabaseExecutor
- ReviewRequestsRepository
- SessionsController
- ToolReadinessService
- Implementation handoff — PairDock MVP
- docker-sandbox.adapter.ts
- session-runner.ts
- ui.ts
- tool-readiness.integration.test.ts
- tool-readiness-panel.tsx
- session-details.integration.test.ts
- diff.service.ts
- command-handling.integration.test.ts
- DatabaseClient
- example-project.integration.test.ts
- AgentClient
- test-json.ts
- agent-prompt-command.integration.test.ts
- AuthenticatedRequest
- SessionsService
- PRD — PairDock MVP
- dependencies
- include
- scripts
- source-control-connections.repository.ts
- checks-runner.ts
- compilerOptions
- UiGateway
- dependencies
- developer-project-form.tsx
- V1 developer setup
- ui-gateway.browser-auth.integration.test.ts
- session-runner.integration.test.ts
- ValidationService
- SessionPromptService
- codex-harness.adapter.ts
- package.json
- validation.integration.test.ts
- shared-projects.integration.test.ts
- pm-session-start.integration.test.ts
- session-prompts.integration.test.ts
- AgentEventEnvelope
- auth.service.ts
- BT-050 — Same-email cross-role accounts remain independent
- Screens represented
- agent-command-routing.integration.test.ts
- agent-gateway.integration.test.ts
- preview-adapters.integration.test.ts
- package.json
- CreateDraftReviewRequestUseCase
- createRuntime
- PairDock Interactive Prototype
- auth.integration.test.ts
- persistence.boundaries.test.ts
- tsconfig.json
- package.json
- SessionEventFeed
- github-app-onboarding.integration.test.ts
- Correction Workflow State
- resolve
- package.json
- HealthController
- agent-client.integration.test.ts
- tsconfig.json
- .constructor
- MVP E2E scenario
- Q: Trace all suggested graph questions using documentation only
- tsconfig.json
- validation.service.ts
- tsconfig.json
- PairDock collaborative developer/PM prototype
- ci-gates.test.ts
- main.tsx
- 01 Fixed — Nimbus Trial Button Fix Preview
- ValidationService
- CodexHarnessAdapter
- 01 Flow — PM Shared Projects Dashboard
- 01 Session 2 — Responsive Fix Session Workspace
- AGENTS.md
- @nestjs/platform-express
- @nestjs/platform-socket.io
- @nestjs/websockets
- @pairdock/domain
- Body
- prisma.config.ts
- 01 Session — Blank Capture
- 02 Session 2 — Responsive Fix Session Workspace
- ToolReadinessService
- preview-server.mjs
- auth.service.ts
- PairDock Web Application Entrypoint
- Automated Full MVP Flow
- ReadySandboxPort
- migration.sql
- mappers.ts
- Get
- Param
- Post
- RequireAuth
- ReadySandboxPort
- ReadyPreviewTunnelPort
- @pairdock/shared-contracts
- reflect-metadata
- Prototype Reference Package

## God Nodes (most connected - your core abstractions)
1. `PairDockIdentity` - 51 edges
2. `Behavior test plan — PairDock MVP` - 51 edges
3. `parseJsonResponse()` - 46 edges
4. `DatabaseClient` - 39 edges
5. `Session` - 38 edges
6. `AppModule` - 36 edges
7. `ProjectsService` - 32 edges
8. `SandboxRef` - 32 edges
9. `AgentClient` - 31 edges
10. `ConnectedAgentsRegistry` - 28 edges

## Surprising Connections (you probably didn't know these)
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/agent-gateway/agent-client.integration.test.ts → apps/api/src/app.module.ts
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/agent-gateway/agent-command-routing.integration.test.ts → apps/api/src/app.module.ts
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/agent-gateway/agent-gateway.integration.test.ts → apps/api/src/app.module.ts
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/agent-gateway/validation.integration.test.ts → apps/api/src/app.module.ts
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/auth/auth.integration.test.ts → apps/api/src/app.module.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Nimbus Trial Button Correction States** — prototype_screenshots_01_clean_blank_landing_preview, prototype_screenshots_01_fixed_nimbus_trial_button_fix, prototype_screenshots_02_clean_blank_landing_preview, prototype_screenshots_02_fixed_nimbus_trial_button_fix [INFERRED 0.85]
- **Responsive Fix Session Workspace States** — prototype_screenshots_01_sess2_responsive_session_workspace, prototype_screenshots_01_sess3_responsive_session_workspace, prototype_screenshots_02_dev_responsive_session_workspace, prototype_screenshots_02_sess2_responsive_session_workspace, prototype_screenshots_02_sess3_responsive_session_workspace [INFERRED 0.85]
- **Correction Workflow Screenshots** — prototype_screenshots_03_clean_clean_correction_prompt_state, prototype_screenshots_03_dev_developer_correction_request_state, prototype_screenshots_03_flow_correction_workflow_state, prototype_screenshots_sess4_session_correction_request_state [INFERRED 0.85]

## Communities (147 total, 20 thin omitted)

### Community 0 - "agent-config.ts"
Cohesion: 0.05
Nodes (74): ProjectChecksConfig, AgentConfig, agentConfigFileSchema, agentHarnessConfigSchema, AgentModelConfig, agentModelConfigSchema, AgentProjectDescriptor, agentProjectDescriptorSchema (+66 more)

### Community 1 - "create-draft-review-request.use-case.ts"
Cohesion: 0.08
Nodes (11): HealthcheckTimeoutError, HealthcheckWaitInput, SandboxPort, SandboxRef, ReadySandboxPort, ReadySandboxPort, ReadySandboxPort, TimeoutSandboxPort (+3 more)

### Community 2 - "Button"
Cohesion: 0.05
Nodes (40): Button(), ButtonProps, ButtonVariant, variantClasses, ConnectionActivityRail(), ConnectionActivityRailProps, RailMetricProps, DeveloperProjectCard() (+32 more)

### Community 3 - "events.ts"
Cohesion: 0.07
Nodes (30): agentCommandEnvelopeSchema, checkResultSchema, envelopeBaseSchema, isoDateTimeSchema, sessionEnvelope(), sessionStatusSchema, uuidSchema, AgentProtocolVersion (+22 more)

### Community 4 - "index.ts"
Cohesion: 0.15
Nodes (11): isExternalIdentityProvider(), isProjectMembershipRole(), mapProjectMembership(), parseExternalIdentityProvider(), parseProjectMembershipRole(), ProjectMembersRepositoryAdapter, Inject, Injectable (+3 more)

### Community 5 - "index.ts"
Cohesion: 0.18
Nodes (8): mapProject(), ProjectsRepositoryAdapter, Injectable, CreateProjectInput, DeveloperProjectRecord, ProjectsRepository, SharedProjectRecord, Project

### Community 6 - "developer-home-page.tsx"
Cohesion: 0.08
Nodes (22): authApi, DeveloperLoginCard(), PmLoginCard(), BrandIconProps, GitHubIcon(), SlackIcon(), ProductShell(), ProductShellProps (+14 more)

### Community 7 - "app-shell.tsx"
Cohesion: 0.11
Nodes (24): AppShell(), getAppRouteSnapshot(), loginRoute, openDeveloperHome(), openLogin(), openPmDashboard(), openPmReviewRequests(), openPmSession() (+16 more)

### Community 8 - "SandboxRef"
Cohesion: 0.10
Nodes (20): Architecture style, Current repository context, Dependency rules, Diagram links, External ports/adapters, Frontend styling, Local agent structure, Login interface (+12 more)

### Community 9 - "persistence.module.ts"
Cohesion: 0.15
Nodes (24): AgentGatewayModule, Module, AuthModule, Module, InvitationsModule, Module, PersistenceModule, Module (+16 more)

### Community 10 - "PairDockUser"
Cohesion: 0.24
Nodes (7): mapUser(), Injectable, UsersRepositoryAdapter, CreateUserInput, UsersRepository, PairDockUser, seedSessionFixture()

### Community 11 - "client.ts"
Cohesion: 0.13
Nodes (14): AgentCancelCommandEnvelope, agentCancelCommandEnvelopeSchema, AgentPromptCommandEnvelope, agentPromptCommandEnvelopeSchema, ChecksRunCommandEnvelope, checksRunCommandEnvelopeSchema, GitGetDiffCommandEnvelope, gitGetDiffCommandEnvelopeSchema (+6 more)

### Community 12 - "sessions.service.ts"
Cohesion: 0.09
Nodes (18): mapSession(), SessionsRepositoryAdapter, Injectable, CreateSessionInput, SessionsRepository, buildSessionCloseCommand(), SessionCloseService, Inject (+10 more)

### Community 13 - "session.ts"
Cohesion: 0.05
Nodes (44): ApiClient, authHeaders(), createApiClient(), CreateSessionInput, jsonHeaders(), RequestOptions, responseErrorSchema, ReviewRequestDialogProps (+36 more)

### Community 14 - "scripts"
Cohesion: 0.06
Nodes (32): @biomejs/biome, devDependencies, @biomejs/biome, tsx, @types/node, typescript, name, packageManager (+24 more)

### Community 15 - "ConnectedAgentsRegistry"
Cohesion: 0.12
Nodes (17): AgentGatewayModule, AuditLogModule, AuthModule, Backend NestJS modules, DiffModule, GithubModule, InvitationsModule, PersistenceModule (+9 more)

### Community 16 - "PairDockIdentity"
Cohesion: 0.16
Nodes (7): isRecord(), ProjectsService, resolveUnavailableReason(), Injectable, PairDockIdentity, CreateDeveloperProjectInput, DeveloperProjectSummary

### Community 17 - "AuthService"
Cohesion: 0.25
Nodes (15): assertStateCookie(), AuthCallbackBody, AuthController, clearStateCookie(), HeaderResponse, readCookie(), readStateFromRedirectUrl(), secureCookieSuffix() (+7 more)

### Community 18 - "ProjectPreviewConfig"
Cohesion: 0.13
Nodes (18): ProjectPreviewConfig, SessionCloseResult, SessionRecoveryResult, SessionRunnerConfig, buildCloudflareDockerCommand(), buildTunnelContainerName(), CloudflarePreviewTunnelAdapter, CloudflarePreviewTunnelDependencies (+10 more)

### Community 19 - "support.js"
Cohesion: 0.11
Nodes (15): boot(), compileTemplate(), dcNameFromPath(), encodeCase(), getReactDOM(), init(), isElementClass(), isRenderableType() (+7 more)

### Community 20 - "json-parsers.ts"
Cohesion: 0.13
Nodes (4): createTempRepository(), execFileAsync, execGit(), ReadyPreviewTunnelPort

### Community 21 - "pm-session-page.tsx"
Cohesion: 0.15
Nodes (15): isToolReadinessKey(), isToolReadinessStatus(), parseToolReadinessCheck(), parseToolReadinessChecks(), serializeChecks(), serializeToolReadinessCheck(), toInputJsonObject(), toInputJsonValue() (+7 more)

### Community 22 - "includes"
Cohesion: 0.08
Nodes (24): files, includes, formatter, enabled, indentStyle, lineWidth, quoteStyle, semicolons (+16 more)

### Community 23 - "package.json"
Cohesion: 0.08
Nodes (24): bin, pairdock-agent, dependencies, @pairdock/shared-contracts, socket.io-client, yaml, zod, devDependencies (+16 more)

### Community 24 - "readiness-runner.ts"
Cohesion: 0.23
Nodes (11): CommandResult, CommandRunner, failed(), failureMessage(), passed(), ReadinessResult, ReadinessRunner, RunReadinessInput (+3 more)

### Community 25 - "agent-client.ts"
Cohesion: 0.26
Nodes (16): isRetryableError(), AgentEventEnvelopeInput, buildAgentConnectedEvent(), buildAgentDoneEvent(), buildAgentOutputEvent(), buildChecksResultEvent(), buildEnvelope(), buildErrorEvent() (+8 more)

### Community 26 - "github-source-control.adapter.ts"
Cohesion: 0.10
Nodes (17): base64UrlEncode(), createGithubAppJwt(), deterministicReviewRequestNumber(), Fetcher, GithubBranchResponse, githubHeaders(), GithubInstallationRepositoriesResponse, GithubInstallationTokenResponse (+9 more)

### Community 27 - "package.json"
Cohesion: 0.08
Nodes (23): devDependencies, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, vite, @vitejs/plugin-react, name (+15 more)

### Community 28 - "mvp-flow.e2e.test.ts"
Cohesion: 0.08
Nodes (22): authenticateDeveloper(), authenticatePm(), closeSession(), createDeveloperProject(), createReviewRequest(), createSession(), createTestRepository(), EXAMPLE_REPOSITORY_FIXTURE (+14 more)

### Community 29 - "AuthTokenService"
Cohesion: 0.16
Nodes (11): AuthTokenOptions, AuthTokenService, hasValidSignature(), isRecord(), isUserKind(), parseTokenPayload(), resolveSecret(), TokenPayload (+3 more)

### Community 30 - "github-developer-identity.adapter.ts"
Cohesion: 0.19
Nodes (9): ExternalIdentitiesRepositoryAdapter, Inject, Injectable, parseJsonObject(), serializeJsonObject(), mapExternalIdentity(), CreateExternalIdentityInput, ExternalIdentitiesRepository (+1 more)

### Community 31 - "agent-events.repository.ts"
Cohesion: 0.19
Nodes (4): Inject, Inject, Injectable, UsersService

### Community 32 - "external-identities.repository.ts"
Cohesion: 0.33
Nodes (6): mapMessage(), MessagesRepositoryAdapter, Injectable, CreateMessageInput, MessagesRepository, SessionMessage

### Community 33 - "slack-pm-identity.adapter.ts"
Cohesion: 0.07
Nodes (25): Fetcher, GithubDeveloperIdentityAdapter, GithubDeveloperIdentityConfig, GithubEmailResponse, githubHeaders(), GithubInstallationMetadata, GithubInstallationsResponse, GithubOAuthResponse (+17 more)

### Community 34 - "WorktreeService"
Cohesion: 0.20
Nodes (8): branchExists(), execFileAsync, execGit(), pathExists(), PreparedWorktree, remoteExists(), WorktreeService, BlockingPushWorktreeService

### Community 35 - "sessions.controller.ts"
Cohesion: 0.33
Nodes (13): "agent_events", "agent_registrations", "external_identities", "github_installations", "messages", "project_members", "project_readiness_snapshots", "projects" (+5 more)

### Community 36 - "DatabaseExecutor"
Cohesion: 0.40
Nodes (5): Agent → backend events, Backend → agent commands, Backend ↔ agent WebSocket contract, Common envelope, UI session-start contract

### Community 37 - "ReviewRequestsRepository"
Cohesion: 0.40
Nodes (5): Developer dashboard, Frontend product surfaces, Login, PM dashboard, Session workspace

### Community 39 - "ToolReadinessService"
Cohesion: 0.15
Nodes (14): mapValidationRun(), Injectable, ValidationRunsRepositoryAdapter, CreateValidationRunInput, ValidationRunsRepository, Inject, Injectable, ValidationPolicy (+6 more)

### Community 40 - "Implementation handoff — PairDock MVP"
Cohesion: 0.11
Nodes (18): Implementation handoff — PairDock MVP, T01 — Monorepo and shared contracts, T02 — Prisma persistence foundation, T03 — Auth and session permissions, T04 — Backend session lifecycle, T05 — Backend ↔ agent WebSocket, T06 — Local agent: config, login, connection, T07 — Local agent: worktree and cleanup (+10 more)

### Community 41 - "docker-sandbox.adapter.ts"
Cohesion: 0.11
Nodes (17): allocateHostPort(), appendLogs(), buildDockerRunArgs(), DockerSandboxAdapter, DockerSandboxAdapterDependencies, inferPortsFromHealthcheck(), ManagedSandboxProcess, onceExit() (+9 more)

### Community 42 - "session-runner.ts"
Cohesion: 0.14
Nodes (10): DEFAULT_SESSION_STATE_PATH, FileSessionWorkspaceStore, isMissingFileError(), metadataSchema, stateSchema, toPersistedWorkspace(), workspaceSchema, SessionWorkspace (+2 more)

### Community 43 - "ui.ts"
Cohesion: 0.21
Nodes (6): SessionAccessGuard, Inject, Injectable, InvitationsService, Injectable, Inject

### Community 44 - "tool-readiness.integration.test.ts"
Cohesion: 0.16
Nodes (16): ConversationThread(), ConversationThreadProps, ReviewRequestDialog(), asRecord(), buildSessionConversation(), extractErrorMessage(), humanizeAgentError(), mergeAdjacentAgentOutput() (+8 more)

### Community 45 - "tool-readiness-panel.tsx"
Cohesion: 0.38
Nodes (6): checkLabels, statusTone(), ToolReadinessPanel(), ToolReadinessPanelProps, ToolReadinessRow(), DeveloperProjectReadiness

### Community 46 - "session-details.integration.test.ts"
Cohesion: 0.29
Nodes (4): authenticatePm(), prisma, startApplication(), sessionDetailsResponseSchema

### Community 47 - "diff.service.ts"
Cohesion: 0.19
Nodes (10): ChangedFile, CollectedDiff, DiffService, execFileAsync, execGit(), execGitAllowingDiffExitCode(), isGitDiffExitCode(), normalizeStatusPath() (+2 more)

### Community 48 - "command-handling.integration.test.ts"
Cohesion: 0.12
Nodes (6): createTempRepository(), execFileAsync, execGit(), FailOnceClosePreviewTunnelPort, ImmediateTimeoutHealthcheckService, ReadyPreviewTunnelPort

### Community 50 - "DatabaseClient"
Cohesion: 0.09
Nodes (39): AgentCommandRouterService, Injectable, AgentExecutionCapabilitiesService, SessionExecutionSelection, Injectable, isLifecycleProgressStatus(), toSessionAgentEvent(), ConnectedAgentSnapshot (+31 more)

### Community 51 - "example-project.integration.test.ts"
Cohesion: 0.20
Nodes (5): createTempRepository(), execFileAsync, execGit(), HARNESS_SCRIPT_PATH, ReadyPreviewTunnelPort

### Community 53 - "test-json.ts"
Cohesion: 0.11
Nodes (12): authenticateDeveloper(), authenticatePm(), prisma, startApplication(), developerProjectListResponseSchema, developerProjectResponseSchema, sharedProjectListResponseSchema, authenticateDeveloper() (+4 more)

### Community 54 - "agent-prompt-command.integration.test.ts"
Cohesion: 0.12
Nodes (16): mapSourceControlConnection(), SourceControlConnectionsRepositoryAdapter, Injectable, CreateSourceControlConnectionInput, SourceControlConnectionsRepository, SourceControlConnection, agentEvents, externalIdentities (+8 more)

### Community 55 - "AuthenticatedRequest"
Cohesion: 0.25
Nodes (11): AuthenticatedRequest, ProjectsController, Body, Controller, Get, Inject, Param, Post (+3 more)

### Community 56 - "SessionsService"
Cohesion: 0.13
Nodes (13): authenticatePm(), prisma, authenticatePm(), prisma, authenticateDeveloper(), prisma, startApplication(), authResponseSchema (+5 more)

### Community 57 - "PRD — PairDock MVP"
Cohesion: 0.12
Nodes (15): Actors, Assumptions, Fixed constraints, Functional requirements, Goals, Handoff summary, Non-functional requirements, Non-goals for MVP (+7 more)

### Community 59 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, dotenv, @nestjs/core, @nestjs/platform-express, @prisma/adapter-pg, @prisma/client, rxjs, socket.io (+7 more)

### Community 61 - "include"
Cohesion: 0.13
Nodes (14): compilerOptions, jsx, lib, extends, include, src/**/*.ts, ../../tsconfig.base.json, DOM (+6 more)

### Community 62 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, db:migrate, db:migrate:dev, db:migrate:test, db:reset, db:status, dev (+7 more)

### Community 64 - "source-control-connections.repository.ts"
Cohesion: 0.13
Nodes (6): Inject, DatabaseClient, Injectable, prisma, startApplication(), waitFor()

### Community 65 - "checks-runner.ts"
Cohesion: 0.13
Nodes (8): appendLogs(), CheckResult, ChecksResult, ChecksRunner, isTransientPackageExtractionFailure(), RunChecksInput, LogRedactor, RecordingChecksRunner

### Community 66 - "compilerOptions"
Cohesion: 0.14
Nodes (13): node, compilerOptions, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, noEmit (+5 more)

### Community 69 - "UiGateway"
Cohesion: 0.13
Nodes (12): assertInstallationId(), GithubAuthStateOptions, GithubAuthStatePayload, GithubAuthStatePurpose, GithubAuthStateService, hasValidSignature(), invalidState(), isInstallationId() (+4 more)

### Community 70 - "dependencies"
Cohesion: 0.16
Nodes (6): AgentHarnessPort, RunPromptInput, SimulatedAgentHarness, CancellableHarnessPort, MutatingHarnessPort, RecordingHarnessPort

### Community 71 - "developer-project-form.tsx"
Cohesion: 0.30
Nodes (5): errorMessage(), SessionRunner, GitPushBranchCommandEnvelope, SessionCloseCommandEnvelope, SessionPrepareCommandEnvelope

### Community 72 - "V1 developer setup"
Cohesion: 0.15
Nodes (12): 1. GitHub App, 2. Slack App, 3. Start PairDock, 4. Cloudflare Tunnel, 5. Add `pairdock.yml`, 6. Configure the local agent, 7. Create a PairDock project, Commands (+4 more)

### Community 73 - "ui-gateway.browser-auth.integration.test.ts"
Cohesion: 0.10
Nodes (11): ConnectedSocket, MessageBody, SubscribeMessage, AgentEventEnvelope, ErrorEventEnvelope, sessionIdResponseSchema, authenticateDeveloper(), authenticatePm() (+3 more)

### Community 74 - "session-runner.integration.test.ts"
Cohesion: 0.11
Nodes (8): HealthcheckService, SessionRegistry, createTempRepository(), execFileAsync, execGit(), FailingClosePreviewTunnelPort, FailingHealthcheckService, FakePreviewTunnelPort

### Community 75 - "ValidationService"
Cohesion: 0.16
Nodes (9): requestJson(), FeedIdentity, feedRegistry, getFeed(), SessionEventFeed, useSessionEventFeed(), getBackendUrl(), FeedConnectionState (+1 more)

### Community 76 - "SessionPromptService"
Cohesion: 0.43
Nodes (4): Body, HttpCode, Post, AuthResult

### Community 77 - "codex-harness.adapter.ts"
Cohesion: 0.10
Nodes (11): Inject, Inject, Inject, Inject, Inject, Inject, Inject, Inject (+3 more)

### Community 78 - "package.json"
Cohesion: 0.17
Nodes (11): dependencies, zod, exports, zod, name, private, scripts, build (+3 more)

### Community 79 - "validation.integration.test.ts"
Cohesion: 0.17
Nodes (4): authenticateDeveloper(), createSession(), prisma, startApplication()

### Community 80 - "shared-projects.integration.test.ts"
Cohesion: 0.15
Nodes (12): AppModule, Module, bootstrap(), startApplication(), announceAgent(), authenticatePm(), prisma, publishReadiness() (+4 more)

### Community 81 - "pm-session-start.integration.test.ts"
Cohesion: 0.21
Nodes (8): announceAgent(), authenticatePm(), prisma, publishReadiness(), sendAgentEvent(), startApplication(), waitForConnect(), sessionCreateResponseSchema

### Community 82 - "session-prompts.integration.test.ts"
Cohesion: 0.20
Nodes (11): PreviewAreaSize, PreviewFrame(), PreviewFrameProps, PreviewToolbar(), PreviewToolbarProps, getFittedPreviewScale(), getPreviewFrameStyle(), isPreviewPresetId() (+3 more)

### Community 83 - "AgentEventEnvelope"
Cohesion: 0.23
Nodes (7): ConnectedSocket, Injectable, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, UiGateway

### Community 84 - "auth.service.ts"
Cohesion: 0.25
Nodes (10): AgentRegistrationsRepositoryAdapter, isRecord(), mapAgentRegistration(), parseModels(), parseProjects(), parseStringArray(), Injectable, AgentRegistrationsRepository (+2 more)

### Community 85 - "BT-050 — Same-email cross-role accounts remain independent"
Cohesion: 0.04
Nodes (51): Behavior test plan — PairDock MVP, BT-001 — Installable workspace, BT-002 — Session creation is persisted, BT-003 — Agent event is persisted, BT-004 — PM member access is allowed, BT-005 — Non-member access is denied, BT-006 — Valid session transitions, BT-007 — Invalid transition is rejected (+43 more)

### Community 86 - "Screens represented"
Cohesion: 0.18
Nodes (10): Architecture documents reconciled, Developer dashboard, Implementation guidance, Login, PM shared-project dashboard, Prototype notes — PairDock collaborative developer/PM, Purpose, Running/fixed/review states (+2 more)

### Community 89 - "agent-command-routing.integration.test.ts"
Cohesion: 0.16
Nodes (6): createTempRepository(), execFileAsync, execGit(), prisma, ReadyPreviewTunnelPort, startApplication()

### Community 90 - "agent-gateway.integration.test.ts"
Cohesion: 0.18
Nodes (5): authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication()

### Community 91 - "preview-adapters.integration.test.ts"
Cohesion: 0.22
Nodes (6): AuthenticatedUserGuard, Injectable, RequireAuth(), RequireSessionAccess(), CreatePromptBody, createDraftReviewRequestInputSchema

### Community 92 - "package.json"
Cohesion: 0.20
Nodes (9): devDependencies, prisma, socket.io-client, socket.io-client, name, private, type, version (+1 more)

### Community 93 - "CreateDraftReviewRequestUseCase"
Cohesion: 0.22
Nodes (8): Accessibility & Inclusion, Anti-references, Brand Personality, Design Principles, Product, Product Purpose, Register, Users

### Community 94 - "createRuntime"
Cohesion: 0.19
Nodes (10): DiffService, isSessionDiffPayload(), SessionDiffView, AgentEventsRepositoryAdapter, Injectable, serializeJsonValue(), mapAgentEvent(), AgentEventsRepository (+2 more)

### Community 95 - "PairDock Interactive Prototype"
Cohesion: 0.20
Nodes (11): SharedProjectCard(), SharedProjectCardProps, SessionStarted, StartPmSessionInput, useSharedProjects(), UseSharedProjectsResult, PmDashboardPage(), PmDashboardPageProps (+3 more)

### Community 96 - "auth.integration.test.ts"
Cohesion: 0.22
Nodes (6): announceAgent(), authenticateDeveloper(), authenticatePm(), prisma, startApplication(), waitForConnect()

### Community 97 - "persistence.boundaries.test.ts"
Cohesion: 0.20
Nodes (8): apiSourceRoot, cwd, domainContractFile, generatedPrismaRoot, persistenceAdapterRoot, persistencePortRoot, persistenceRoot, persistenceSurfaceFiles

### Community 98 - "tsconfig.json"
Cohesion: 0.22
Nodes (8): compilerOptions, emitDecoratorMetadata, experimentalDecorators, extends, include, src/**/*.ts, ../../tsconfig.base.json, ../../tests/apps/api/**/*.ts

### Community 99 - "package.json"
Cohesion: 0.22
Nodes (8): exports, name, private, scripts, build, typecheck, type, version

### Community 100 - "SessionEventFeed"
Cohesion: 0.15
Nodes (13): dependencies, @pairdock/shared-contracts, react-dom, socket.io-client, @tanstack/react-form, @tanstack/react-query, zod, @pairdock/shared-contracts (+5 more)

### Community 101 - "github-app-onboarding.integration.test.ts"
Cohesion: 0.33
Nodes (4): createFakeGithubServer(), githubInstallations, json(), previousEnv

### Community 102 - "Correction Workflow State"
Cohesion: 0.25
Nodes (8): Clean Correction Prompt State, Developer Correction Request State, Correction Workflow State, Session Workspace State, Follow-up Workflow State, Follow-up Session Workspace State, Demo Navigation State, Session Correction Request State

### Community 103 - "resolve"
Cohesion: 0.15
Nodes (10): Inject, AuthProvider, AuthService, buildFrontendAuthRedirectUrl(), hasAccessibleGithubInstallation(), OAuthStartUrlConfig, readOAuthStartUrlConfig(), Injectable (+2 more)

### Community 104 - "package.json"
Cohesion: 0.25
Nodes (7): name, private, scripts, build, lint, test, type

### Community 105 - "HealthController"
Cohesion: 0.15
Nodes (10): mapReviewRequest(), ReviewRequestsRepositoryAdapter, Inject, Injectable, CreateReviewRequestInput, ReviewRequestsRepository, ReviewRequestRecord, developer (+2 more)

### Community 106 - "agent-client.integration.test.ts"
Cohesion: 0.13
Nodes (8): Inject, cloneSnapshot(), ConnectedAgentsRegistry, Injectable, Inject, SessionStartPolicy, Inject, Injectable

### Community 107 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): extends, include, src/**/*.ts, ../../tsconfig.base.json, ../../tests/packages/local-agent/**/*.ts

### Community 110 - "MVP E2E scenario"
Cohesion: 0.40
Nodes (4): Fixtures, MVP E2E scenario, Reproduce locally, What it proves

### Community 111 - "Q: Trace all suggested graph questions using documentation only"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Trace all suggested graph questions using documentation only, Source Nodes

### Community 112 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 113 - "validation.service.ts"
Cohesion: 0.40
Nodes (3): HealthController, Controller, Get

### Community 114 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 115 - "PairDock collaborative developer/PM prototype"
Cohesion: 0.40
Nodes (4): Architectural interpretation, Contents, How to view, PairDock collaborative developer/PM prototype

### Community 117 - "ci-gates.test.ts"
Cohesion: 0.40
Nodes (3): repositoryRoot, rootPackageJson, workflowPath

### Community 119 - "01 Fixed — Nimbus Trial Button Fix Preview"
Cohesion: 0.50
Nodes (4): 01 Clean — Blank Nimbus Landing Preview, 01 Fixed — Nimbus Trial Button Fix Preview, 02 Clean — Blank Nimbus Landing Preview, 02 Fixed — Nimbus Trial Button Fix Preview

### Community 120 - "ValidationService"
Cohesion: 0.13
Nodes (12): Inject, AgentGateway, Inject, Injectable, WebSocketGateway, WebSocketServer, Inject, toValidationView() (+4 more)

### Community 121 - "CodexHarnessAdapter"
Cohesion: 0.21
Nodes (7): buildCommandArgs(), isCodexCommand(), isRecord(), normalizeExitCode(), parseCodexJsonLine(), ParsedCodexJsonLine, HARNESS_SCRIPT_PATH

### Community 122 - "01 Flow — PM Shared Projects Dashboard"
Cohesion: 0.67
Nodes (3): 01 Dev — Developer Shared Projects Dashboard, 01 Flow — PM Shared Projects Dashboard, 02 Flow — PM Shared Projects Dashboard

### Community 123 - "01 Session 2 — Responsive Fix Session Workspace"
Cohesion: 0.67
Nodes (3): 01 Session 2 — Responsive Fix Session Workspace, 01 Session 3 — Responsive Fix Session Workspace, 02 Dev — Responsive Fix Session Workspace

### Community 125 - "@nestjs/platform-express"
Cohesion: 0.40
Nodes (11): collectProps(), compileAttr(), cssToObj(), hostPositionStyle(), kebabToCamel(), walk(), walkChildren(), walkComponent() (+3 more)

### Community 130 - "Body"
Cohesion: 0.06
Nodes (28): isCommandAcknowledgement(), buildConventionalCommitMessage(), buildGitPushBranchCommand(), buildSessionBranchName(), CreateDraftReviewRequestUseCase, Injectable, buildAgentCancelCommand(), buildAgentPromptCommand() (+20 more)

### Community 131 - "prisma.config.ts"
Cohesion: 0.24
Nodes (8): currentDirectory, databaseTargetEnvironment, buildAdapter(), currentDirectory, DatabaseEnvironment, DatabaseTarget, parseDatabaseTarget(), resolveDatabaseConnectionString()

### Community 137 - "preview-server.mjs"
Cohesion: 0.33
Nodes (4): port, server, createAgentServer(), createAgentServer()

### Community 143 - "ReadySandboxPort"
Cohesion: 0.16
Nodes (12): ToolReadinessController, Controller, Get, HttpCode, Inject, Param, Post, Req (+4 more)

### Community 146 - "mappers.ts"
Cohesion: 0.13
Nodes (16): Inject, mapSessionMember(), SessionMembersRepositoryAdapter, Injectable, createPersistenceRepositories(), PersistenceUnitOfWorkAdapter, Injectable, PersistenceRepositories (+8 more)

### Community 147 - "Get"
Cohesion: 0.20
Nodes (10): react, get(), createComponentFactory(), createExternalModules(), createHelmetManager(), createPseudoSheet(), createRegistry(), createRuntime() (+2 more)

### Community 149 - "Param"
Cohesion: 0.31
Nodes (4): AgentHarnessEvent, AgentHarnessEventQueue, CodexHarnessAdapter, onceExit()

### Community 150 - "Post"
Cohesion: 0.25
Nodes (8): findTopLevelEquality(), parensWrapWhole(), resolve(), resolvePath(), waitFor(), waitForReadiness(), waitForReadiness(), emitCommandWithAcknowledgement()

### Community 152 - "RequireAuth"
Cohesion: 0.50
Nodes (5): evalDcLogic(), getReact(), walkFor(), walkText(), warnUnresolved()

## Knowledge Gaps
- **554 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+549 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `resolve()` connect `Post` to `agent-config.ts`, `source-control-connections.repository.ts`, `dependencies`, `docker-sandbox.adapter.ts`, `support.js`, `Get`, `Param`, `RequireAuth`, `@nestjs/platform-express`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `dependencies` connect `SessionEventFeed` to `package.json`, `Get`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `createComponentFactory()` connect `Get` to `RequireAuth`, `support.js`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _554 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agent-config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05042016806722689 - nodes in this community are weakly interconnected._
- **Should `create-draft-review-request.use-case.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08412698412698413 - nodes in this community are weakly interconnected._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.05141242937853107 - nodes in this community are weakly interconnected._