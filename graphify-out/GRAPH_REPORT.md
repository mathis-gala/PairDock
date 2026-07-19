# Graph Report - PairDock  (2026-07-19)

## Corpus Check
- 259 files · ~125,507 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2411 nodes · 4764 edges · 157 communities (128 shown, 29 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 81 edges (avg confidence: 0.73)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5fea96ea`
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
- agent-registrations.repository.ts
- mappers.ts
- diff.service.ts
- command-handling.integration.test.ts
- ProjectMembersRepository
- DatabaseClient
- example-project.integration.test.ts
- AgentClient
- test-json.ts
- agent-prompt-command.integration.test.ts
- AuthenticatedRequest
- SessionsService
- PRD — PairDock MVP
- AgentHarnessPort
- dependencies
- SessionMember
- include
- scripts
- AppModule
- source-control-connections.repository.ts
- checks-runner.ts
- compilerOptions
- SourceControlPort
- session-state-machine.ts
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
- tool-readiness-panel.tsx
- walk
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
- ReadyPreviewTunnelPort
- .constructor
- MVP E2E scenario
- Q: Trace all suggested graph questions using documentation only
- tsconfig.json
- validation.service.ts
- tsconfig.json
- PairDock collaborative developer/PM prototype
- authenticated-request.ts
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
- @pairdock/shared-contracts
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
- HttpCode
- Param
- Post
- Req
- RequireAuth
- ReadyPreviewTunnelPort
- Prototype Reference Package

## God Nodes (most connected - your core abstractions)
1. `Behavior test plan — PairDock MVP` - 51 edges
2. `parseJsonResponse()` - 46 edges
3. `DatabaseClient` - 39 edges
4. `ProjectsService` - 32 edges
5. `AppModule` - 32 edges
6. `Session` - 30 edges
7. `DatabaseExecutor` - 28 edges
8. `AgentClient` - 28 edges
9. `PairDockIdentity` - 27 edges
10. `ProjectsRepository` - 26 edges

## Surprising Connections (you probably didn't know these)
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/agent-gateway/agent-command-routing.integration.test.ts → apps/api/src/app.module.ts
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/agent-gateway/agent-gateway.integration.test.ts → apps/api/src/app.module.ts
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/agent-gateway/validation.integration.test.ts → apps/api/src/app.module.ts
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/auth/auth.integration.test.ts → apps/api/src/app.module.ts
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/projects/shared-projects.integration.test.ts → apps/api/src/app.module.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Nimbus Trial Button Correction States** — prototype_screenshots_01_clean_blank_landing_preview, prototype_screenshots_01_fixed_nimbus_trial_button_fix, prototype_screenshots_02_clean_blank_landing_preview, prototype_screenshots_02_fixed_nimbus_trial_button_fix [INFERRED 0.85]
- **Responsive Fix Session Workspace States** — prototype_screenshots_01_sess2_responsive_session_workspace, prototype_screenshots_01_sess3_responsive_session_workspace, prototype_screenshots_02_dev_responsive_session_workspace, prototype_screenshots_02_sess2_responsive_session_workspace, prototype_screenshots_02_sess3_responsive_session_workspace [INFERRED 0.85]
- **Correction Workflow Screenshots** — prototype_screenshots_03_clean_clean_correction_prompt_state, prototype_screenshots_03_dev_developer_correction_request_state, prototype_screenshots_03_flow_correction_workflow_state, prototype_screenshots_sess4_session_correction_request_state [INFERRED 0.85]

## Communities (157 total, 29 thin omitted)

### Community 0 - "agent-config.ts"
Cohesion: 0.05
Nodes (74): ProjectChecksConfig, AgentConfig, agentConfigFileSchema, agentHarnessConfigSchema, AgentModelConfig, agentModelConfigSchema, AgentProjectDescriptor, agentProjectDescriptorSchema (+66 more)

### Community 1 - "create-draft-review-request.use-case.ts"
Cohesion: 0.14
Nodes (8): HealthcheckService, HealthcheckTimeoutError, HealthcheckWaitInput, HealthcheckResult, SandboxPort, SandboxRef, ReadySandboxPort, ReadySandboxPort

### Community 2 - "Button"
Cohesion: 0.09
Nodes (20): Button(), ButtonProps, ButtonVariant, variantClasses, ProjectShareFormProps, SessionControlCardProps, ConversationThread(), ConversationThreadProps (+12 more)

### Community 3 - "events.ts"
Cohesion: 0.09
Nodes (24): agentCommandEnvelopeSchema, checkResultSchema, envelopeBaseSchema, isoDateTimeSchema, sessionEnvelope(), sessionStatusSchema, toolReadinessCheckSchema, uuidSchema (+16 more)

### Community 4 - "index.ts"
Cohesion: 0.18
Nodes (15): isLifecycleProgressStatus(), toSessionAgentEvent(), AGENT_EVENTS_REPOSITORY, AGENT_REGISTRATIONS_REPOSITORY, EXTERNAL_IDENTITIES_REPOSITORY, MESSAGES_REPOSITORY, PERSISTENCE_UNIT_OF_WORK, PROJECT_MEMBERS_REPOSITORY (+7 more)

### Community 5 - "index.ts"
Cohesion: 0.15
Nodes (7): ProjectsRepositoryAdapter, Inject, Injectable, CreateProjectInput, DeveloperProjectRecord, SharedProjectRecord, isRecord()

### Community 6 - "developer-home-page.tsx"
Cohesion: 0.11
Nodes (16): ProductShell(), ProductShellProps, useAuthenticateDeveloper(), useAuthenticatePm(), useDeveloperProjects(), normalizeSeed(), AuthenticatedUser, authenticatedUserSchema (+8 more)

### Community 7 - "app-shell.tsx"
Cohesion: 0.14
Nodes (21): AppShell(), getAppRouteSnapshot(), loginRoute, openDeveloperHome(), openLogin(), openPmDashboard(), openPmReviewRequests(), openPmSession() (+13 more)

### Community 8 - "SandboxRef"
Cohesion: 0.04
Nodes (48): Agent → backend events, AgentGatewayModule, Architecture style, AuditLogModule, AuthModule, Backend → agent commands, Backend ↔ agent WebSocket contract, Backend NestJS modules (+40 more)

### Community 9 - "persistence.module.ts"
Cohesion: 0.13
Nodes (25): AgentGatewayModule, Module, AuthModule, Module, InvitationsModule, Module, PersistenceModule, Module (+17 more)

### Community 10 - "PairDockUser"
Cohesion: 0.22
Nodes (7): mapUser(), Inject, Injectable, UsersRepositoryAdapter, CreateUserInput, UsersRepository, PairDockUser

### Community 11 - "client.ts"
Cohesion: 0.07
Nodes (25): createDeveloperProjectInputSchema, CreateDraftReviewRequestInput, createDraftReviewRequestInputSchema, developerProjectReadinessSchema, developerProjectSessionSummarySchema, developerProjectSetupSchema, developerProjectSummaryListSchema, developerProjectSummarySchema (+17 more)

### Community 12 - "sessions.service.ts"
Cohesion: 0.15
Nodes (13): AgentCommandRouterService, Inject, Injectable, SESSIONS_REPOSITORY, SessionsRepository, buildSessionCloseCommand(), SessionCloseService, Inject (+5 more)

### Community 13 - "session.ts"
Cohesion: 0.07
Nodes (12): ApiClient, authApi, authHeaders(), CreateSessionInput, jsonHeaders(), RequestOptions, responseErrorSchema, DeveloperLoginCard() (+4 more)

### Community 14 - "scripts"
Cohesion: 0.06
Nodes (32): @biomejs/biome, devDependencies, @biomejs/biome, tsx, @types/node, typescript, name, packageManager (+24 more)

### Community 15 - "ConnectedAgentsRegistry"
Cohesion: 0.06
Nodes (26): buildConventionalCommitMessage(), buildGitPushBranchCommand(), buildSessionBranchName(), CreateDraftReviewRequestUseCase, DraftReviewRequestResult, Inject, Injectable, CreatePromptBody (+18 more)

### Community 16 - "PairDockIdentity"
Cohesion: 0.06
Nodes (27): AuthenticatedRequest, AuthenticatedUserGuard, Injectable, RequireAuth(), ProjectsController, Body, Controller, Get (+19 more)

### Community 17 - "AuthService"
Cohesion: 0.25
Nodes (15): assertStateCookie(), AuthCallbackBody, AuthController, clearStateCookie(), HeaderResponse, readCookie(), readStateFromRedirectUrl(), secureCookieSuffix() (+7 more)

### Community 18 - "ProjectPreviewConfig"
Cohesion: 0.22
Nodes (6): CloudflarePreviewTunnelAdapter, CloudflarePreviewTunnelDependencies, onceExit(), terminateProcess(), TunnelProcessLike, waitForPublicUrl()

### Community 19 - "support.js"
Cohesion: 0.05
Nodes (61): dependencies, @pairdock/shared-contracts, react, react-dom, socket.io-client, @tanstack/react-form, @tanstack/react-query, zod (+53 more)

### Community 20 - "json-parsers.ts"
Cohesion: 0.08
Nodes (9): AgentHarnessPort, RunPromptInput, CancellableHarnessPort, createTempRepository(), execFileAsync, execGit(), MutatingHarnessPort, ReadySandboxPort (+1 more)

### Community 21 - "pm-session-page.tsx"
Cohesion: 0.15
Nodes (17): isToolReadinessKey(), isToolReadinessStatus(), parseToolReadinessCheck(), parseToolReadinessChecks(), serializeChecks(), serializeToolReadinessCheck(), toInputJsonObject(), toInputJsonValue() (+9 more)

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
Cohesion: 0.15
Nodes (24): isRetryableError(), AgentEventEnvelopeInput, buildAgentConnectedEvent(), buildAgentDoneEvent(), buildAgentOutputEvent(), buildChecksResultEvent(), buildEnvelope(), buildErrorEvent() (+16 more)

### Community 26 - "github-source-control.adapter.ts"
Cohesion: 0.15
Nodes (15): base64UrlEncode(), createGithubAppJwt(), deterministicReviewRequestNumber(), Fetcher, GithubBranchResponse, githubHeaders(), GithubInstallationRepositoriesResponse, GithubInstallationTokenResponse (+7 more)

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
Nodes (9): ExternalIdentitiesRepositoryAdapter, Injectable, parseJsonObject(), serializeJsonObject(), mapExternalIdentity(), CreateExternalIdentityInput, ExternalIdentitiesRepository, ExternalIdentity (+1 more)

### Community 31 - "agent-events.repository.ts"
Cohesion: 0.11
Nodes (9): AppModule, Module, bootstrap(), prisma, startApplication(), waitFor(), createSession(), prisma (+1 more)

### Community 32 - "external-identities.repository.ts"
Cohesion: 0.19
Nodes (4): Inject, Inject, Injectable, UsersService

### Community 33 - "slack-pm-identity.adapter.ts"
Cohesion: 0.07
Nodes (25): Fetcher, GithubDeveloperIdentityAdapter, GithubDeveloperIdentityConfig, GithubEmailResponse, githubHeaders(), GithubInstallationMetadata, GithubInstallationsResponse, GithubOAuthResponse (+17 more)

### Community 34 - "WorktreeService"
Cohesion: 0.22
Nodes (7): branchExists(), execFileAsync, execGit(), pathExists(), remoteExists(), WorktreeService, BlockingPushWorktreeService

### Community 35 - "sessions.controller.ts"
Cohesion: 0.33
Nodes (13): "agent_events", "agent_registrations", "external_identities", "github_installations", "messages", "project_members", "project_readiness_snapshots", "projects" (+5 more)

### Community 36 - "DatabaseExecutor"
Cohesion: 0.19
Nodes (11): isExternalIdentityProvider(), isProjectMembershipRole(), mapMessage(), parseExternalIdentityProvider(), parseProjectMembershipRole(), MessagesRepositoryAdapter, Injectable, CreateMessageInput (+3 more)

### Community 37 - "ReviewRequestsRepository"
Cohesion: 0.30
Nodes (6): mapReviewRequest(), ReviewRequestsRepositoryAdapter, Injectable, CreateReviewRequestInput, ReviewRequestsRepository, ReviewRequestRecord

### Community 38 - "SessionsController"
Cohesion: 0.16
Nodes (8): buildSessionPrepareCommand(), formatUserDisplayName(), SessionsService, Injectable, ToolReadinessService, toReadinessResponse(), Injectable, PairDockIdentity

### Community 39 - "ToolReadinessService"
Cohesion: 0.11
Nodes (13): mapValidationRun(), Injectable, ValidationRunsRepositoryAdapter, CreateValidationRunInput, ValidationRunsRepository, Injectable, ValidationPolicy, Inject (+5 more)

### Community 40 - "Implementation handoff — PairDock MVP"
Cohesion: 0.11
Nodes (18): Implementation handoff — PairDock MVP, T01 — Monorepo and shared contracts, T02 — Prisma persistence foundation, T03 — Auth and session permissions, T04 — Backend session lifecycle, T05 — Backend ↔ agent WebSocket, T06 — Local agent: config, login, connection, T07 — Local agent: worktree and cleanup (+10 more)

### Community 41 - "docker-sandbox.adapter.ts"
Cohesion: 0.16
Nodes (12): allocateHostPort(), appendLogs(), buildDockerRunArgs(), DockerSandboxAdapter, DockerSandboxAdapterDependencies, inferPortsFromHealthcheck(), ManagedSandboxProcess, onceExit() (+4 more)

### Community 42 - "session-runner.ts"
Cohesion: 0.19
Nodes (5): errorMessage(), SessionCloseResult, SessionPrepareHooks, SessionRunner, SessionRunnerConfig

### Community 43 - "ui.ts"
Cohesion: 0.31
Nodes (4): RequireSessionAccess(), SessionAccessGuard, Inject, Injectable

### Community 44 - "tool-readiness.integration.test.ts"
Cohesion: 0.09
Nodes (16): createApiClient(), PreviewAreaSize, PreviewFrame(), PreviewFrameProps, PreviewToolbar(), PreviewToolbarProps, ReviewRequestDialog(), ReviewRequestDialogProps (+8 more)

### Community 45 - "agent-registrations.repository.ts"
Cohesion: 0.15
Nodes (16): PROJECTS_REPOSITORY, ProjectsRepository, resolveDeveloperReadinessFailure(), SessionStartPolicy, SessionStartSource, Inject, Injectable, compareSessionMembers() (+8 more)

### Community 46 - "mappers.ts"
Cohesion: 0.16
Nodes (12): mapSourceControlConnection(), SourceControlConnectionsRepositoryAdapter, Injectable, createPersistenceRepositories(), PersistenceUnitOfWorkAdapter, Inject, Injectable, PersistenceRepositories (+4 more)

### Community 47 - "diff.service.ts"
Cohesion: 0.19
Nodes (10): ChangedFile, CollectedDiff, DiffService, execFileAsync, execGit(), execGitAllowingDiffExitCode(), isGitDiffExitCode(), normalizeStatusPath() (+2 more)

### Community 48 - "command-handling.integration.test.ts"
Cohesion: 0.07
Nodes (8): createTempRepository(), execFileAsync, execGit(), FailOnceClosePreviewTunnelPort, ImmediateTimeoutHealthcheckService, ReadyPreviewTunnelPort, ReadySandboxPort, TimeoutSandboxPort

### Community 49 - "ProjectMembersRepository"
Cohesion: 0.14
Nodes (11): AgentGateway, isCommandAcknowledgement(), Injectable, WebSocketGateway, WebSocketServer, buildAgentCancelCommand(), buildAgentPromptCommand(), SessionPromptService (+3 more)

### Community 50 - "DatabaseClient"
Cohesion: 0.14
Nodes (8): AgentExecutionCapabilitiesService, SessionExecutionSelection, Inject, Injectable, cloneSnapshot(), ConnectedAgentSnapshot, ConnectedAgentsRegistry, Injectable

### Community 51 - "example-project.integration.test.ts"
Cohesion: 0.28
Nodes (4): createTempRepository(), execFileAsync, execGit(), HARNESS_SCRIPT_PATH

### Community 53 - "test-json.ts"
Cohesion: 0.11
Nodes (14): prisma, authenticatePm(), prisma, authResponseSchema, developerProjectListResponseSchema, developerProjectResponseSchema, sessionCreateResponseSchema, sharedProjectListResponseSchema (+6 more)

### Community 54 - "agent-prompt-command.integration.test.ts"
Cohesion: 0.13
Nodes (13): mapSession(), SessionsRepositoryAdapter, Injectable, CreateSessionInput, agentEvents, externalIdentities, prisma, projects (+5 more)

### Community 55 - "AuthenticatedRequest"
Cohesion: 0.15
Nodes (17): asRecord(), buildSessionConversation(), extractErrorMessage(), humanizeAgentError(), mergeAdjacentAgentOutput(), toConversationEvent(), sessionEventRecordSchema, SessionEventRecordView (+9 more)

### Community 56 - "SessionsService"
Cohesion: 0.25
Nodes (5): authenticatePm(), prisma, startApplication(), sessionEventListResponseSchema, sessionMessageListResponseSchema

### Community 57 - "PRD — PairDock MVP"
Cohesion: 0.12
Nodes (15): Actors, Assumptions, Fixed constraints, Functional requirements, Goals, Handoff summary, Non-functional requirements, Non-goals for MVP (+7 more)

### Community 58 - "AgentHarnessPort"
Cohesion: 0.19
Nodes (6): allowedProgressTransitions, InvalidSessionTransitionError, ProgressStatus, SessionAgentEvent, SessionStateMachine, Session

### Community 59 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @nestjs/common, @nestjs/core, @pairdock/shared-contracts, @prisma/client, reflect-metadata, rxjs, socket.io (+7 more)

### Community 60 - "SessionMember"
Cohesion: 0.22
Nodes (8): mapSessionMember(), SessionMembersRepositoryAdapter, Inject, Injectable, AddSessionMemberInput, SessionMembersRepository, CreatePromptRequest, SessionMember

### Community 61 - "include"
Cohesion: 0.13
Nodes (14): compilerOptions, jsx, lib, extends, include, src/**/*.ts, ../../tsconfig.base.json, DOM (+6 more)

### Community 62 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, db:migrate, db:migrate:dev, db:migrate:test, db:reset, db:status, dev (+7 more)

### Community 63 - "AppModule"
Cohesion: 0.33
Nodes (8): ProjectPreviewConfig, PreparedWorktree, SessionWorkspace, buildCloudflareDockerCommand(), ManagedTunnelProcess, toHostDockerUrl(), PreviewTunnelOpenInput, PreviewTunnelRef

### Community 64 - "source-control-connections.repository.ts"
Cohesion: 0.17
Nodes (6): DatabaseClient, Injectable, authenticatePm(), prisma, startApplication(), sessionDetailsResponseSchema

### Community 65 - "checks-runner.ts"
Cohesion: 0.20
Nodes (5): appendLogs(), CheckResult, ChecksResult, ChecksRunner, RunChecksInput

### Community 66 - "compilerOptions"
Cohesion: 0.14
Nodes (13): node, compilerOptions, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, noEmit (+5 more)

### Community 68 - "session-state-machine.ts"
Cohesion: 0.17
Nodes (4): PreviewTunnelPort, ReadyPreviewTunnelPort, ReadyPreviewTunnelPort, ReadyPreviewTunnelPort

### Community 69 - "UiGateway"
Cohesion: 0.15
Nodes (12): assertInstallationId(), GithubAuthStateOptions, GithubAuthStatePayload, GithubAuthStatePurpose, GithubAuthStateService, hasValidSignature(), invalidState(), isInstallationId() (+4 more)

### Community 70 - "dependencies"
Cohesion: 0.24
Nodes (7): ConnectionActivityRail(), ConnectionActivityRailProps, RailMetricProps, ShareDeveloperProjectInput, UpdateExecutionDefaultsInput, DeveloperProjectSummary, UpdateProjectExecutionDefaultsInput

### Community 71 - "developer-project-form.tsx"
Cohesion: 0.25
Nodes (4): InvitationsService, Inject, Injectable, Inject

### Community 72 - "V1 developer setup"
Cohesion: 0.15
Nodes (12): 1. GitHub App, 2. Slack App, 3. Start PairDock, 4. Cloudflare Tunnel, 5. Add `pairdock.yml`, 6. Configure the local agent, 7. Create a PairDock project, Commands (+4 more)

### Community 73 - "ui-gateway.browser-auth.integration.test.ts"
Cohesion: 0.15
Nodes (6): sessionIdResponseSchema, authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication()

### Community 74 - "session-runner.integration.test.ts"
Cohesion: 0.12
Nodes (7): createTempRepository(), execFileAsync, execGit(), FailingClosePreviewTunnelPort, FailingHealthcheckService, FakePreviewTunnelPort, FakeSandboxPort

### Community 75 - "ValidationService"
Cohesion: 0.18
Nodes (8): FeedIdentity, feedRegistry, getFeed(), SessionEventFeed, useSessionEventFeed(), getBackendUrl(), FeedConnectionState, SessionEventFeedSnapshot

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
Cohesion: 0.11
Nodes (9): authenticateDeveloper(), createSession(), prisma, startApplication(), authenticateDeveloper(), prisma, startApplication(), idResponseSchema (+1 more)

### Community 80 - "shared-projects.integration.test.ts"
Cohesion: 0.24
Nodes (7): announceAgent(), authenticatePm(), prisma, publishReadiness(), sendAgentEvent(), startApplication(), waitForConnect()

### Community 81 - "pm-session-start.integration.test.ts"
Cohesion: 0.24
Nodes (7): announceAgent(), authenticatePm(), prisma, publishReadiness(), sendAgentEvent(), startApplication(), waitForConnect()

### Community 82 - "session-prompts.integration.test.ts"
Cohesion: 0.36
Nodes (5): getFittedPreviewScale(), getPreviewFrameStyle(), PreviewPreset, PreviewPresetId, previewPresets

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

### Community 87 - "tool-readiness-panel.tsx"
Cohesion: 0.38
Nodes (5): checkLabels, statusTone(), ToolReadinessPanelProps, ToolReadinessRow(), DeveloperProjectReadiness

### Community 88 - "walk"
Cohesion: 0.12
Nodes (16): AgentCancelCommandEnvelope, agentCancelCommandEnvelopeSchema, agentPromptCommandEnvelopeSchema, ChecksRunCommandEnvelope, checksRunCommandEnvelopeSchema, GitGetDiffCommandEnvelope, gitGetDiffCommandEnvelopeSchema, GitPushBranchCommandEnvelope (+8 more)

### Community 89 - "agent-command-routing.integration.test.ts"
Cohesion: 0.22
Nodes (5): createTempRepository(), execFileAsync, execGit(), prisma, startApplication()

### Community 90 - "agent-gateway.integration.test.ts"
Cohesion: 0.18
Nodes (5): authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication()

### Community 91 - "preview-adapters.integration.test.ts"
Cohesion: 0.40
Nodes (3): createRunningProcess(), FakeRunningProcess, spawn()

### Community 92 - "package.json"
Cohesion: 0.20
Nodes (9): devDependencies, prisma, socket.io-client, name, private, type, version, prisma (+1 more)

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

### Community 101 - "github-app-onboarding.integration.test.ts"
Cohesion: 0.33
Nodes (4): createFakeGithubServer(), githubInstallations, json(), previousEnv

### Community 102 - "Correction Workflow State"
Cohesion: 0.25
Nodes (8): Clean Correction Prompt State, Developer Correction Request State, Correction Workflow State, Session Workspace State, Follow-up Workflow State, Follow-up Session Workspace State, Demo Navigation State, Session Correction Request State

### Community 103 - "resolve"
Cohesion: 0.14
Nodes (10): Inject, AuthProvider, AuthService, buildFrontendAuthRedirectUrl(), hasAccessibleGithubInstallation(), OAuthStartUrlConfig, readOAuthStartUrlConfig(), Injectable (+2 more)

### Community 104 - "package.json"
Cohesion: 0.25
Nodes (7): name, private, scripts, build, lint, test, type

### Community 106 - "agent-client.integration.test.ts"
Cohesion: 0.25
Nodes (5): ConnectedSocket, MessageBody, SubscribeMessage, AgentEventEnvelope, ErrorEventEnvelope

### Community 107 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): extends, include, src/**/*.ts, ../../tsconfig.base.json, ../../tests/packages/local-agent/**/*.ts

### Community 108 - "ReadyPreviewTunnelPort"
Cohesion: 0.25
Nodes (5): DeveloperProjectCard(), DeveloperProjectCardProps, ProjectFactProps, blockedProject, project

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
Cohesion: 0.27
Nodes (5): Inject, toValidationView(), Injectable, ValidationService, ChecksResultEventEnvelope

### Community 121 - "CodexHarnessAdapter"
Cohesion: 0.16
Nodes (11): AgentHarnessEvent, AgentHarnessEventQueue, buildCommandArgs(), CodexHarnessAdapter, isCodexCommand(), isRecord(), normalizeExitCode(), onceExit() (+3 more)

### Community 122 - "01 Flow — PM Shared Projects Dashboard"
Cohesion: 0.67
Nodes (3): 01 Dev — Developer Shared Projects Dashboard, 01 Flow — PM Shared Projects Dashboard, 02 Flow — PM Shared Projects Dashboard

### Community 123 - "01 Session 2 — Responsive Fix Session Workspace"
Cohesion: 0.67
Nodes (3): 01 Session 2 — Responsive Fix Session Workspace, 01 Session 3 — Responsive Fix Session Workspace, 02 Dev — Responsive Fix Session Workspace

### Community 131 - "prisma.config.ts"
Cohesion: 0.24
Nodes (8): currentDirectory, databaseTargetEnvironment, buildAdapter(), currentDirectory, DatabaseEnvironment, DatabaseTarget, parseDatabaseTarget(), resolveDatabaseConnectionString()

### Community 136 - "ToolReadinessService"
Cohesion: 0.15
Nodes (12): AgentProjectOption, DeveloperProjectForm(), DeveloperProjectFormProps, ProjectFormState, ProjectSetupStateProps, resolveModelOptions(), ExecutionSelection, ExecutionSelectionProps (+4 more)

### Community 137 - "preview-server.mjs"
Cohesion: 0.40
Nodes (3): port, server, createAgentServer()

### Community 146 - "mappers.ts"
Cohesion: 0.28
Nodes (7): mapProjectMembership(), ProjectMembersRepositoryAdapter, Injectable, AddProjectMemberInput, ProjectMembersRepository, ProjectMembership, ProjectMembershipRole

## Knowledge Gaps
- **572 isolated node(s):** `Workspace`, `Commands`, `1. GitHub App`, `2. Slack App`, `3. Start PairDock` (+567 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `resolve()` connect `support.js` to `agent-config.ts`, `create-draft-review-request.use-case.ts`, `json-parsers.ts`, `CodexHarnessAdapter`, `agent-events.repository.ts`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `ProjectsService` connect `PairDockIdentity` to `persistence.module.ts`, `index.ts`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `DatabaseClient` connect `source-control-connections.repository.ts` to `prisma.config.ts`, `index.ts`, `index.ts`, `PairDockUser`, `mappers.ts`, `pm-session-page.tsx`, `mvp-flow.e2e.test.ts`, `github-developer-identity.adapter.ts`, `agent-events.repository.ts`, `DatabaseExecutor`, `ReviewRequestsRepository`, `ToolReadinessService`, `mappers.ts`, `test-json.ts`, `agent-prompt-command.integration.test.ts`, `SessionsService`, `SessionMember`, `ui-gateway.browser-auth.integration.test.ts`, `validation.integration.test.ts`, `shared-projects.integration.test.ts`, `pm-session-start.integration.test.ts`, `auth.service.ts`, `agent-command-routing.integration.test.ts`, `agent-gateway.integration.test.ts`, `createRuntime`, `auth.integration.test.ts`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `AppModule` (e.g. with `bootstrap()` and `startApplication()`) actually correct?**
  _`AppModule` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Workspace`, `Commands`, `1. GitHub App` to the rest of the system?**
  _572 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agent-config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05042016806722689 - nodes in this community are weakly interconnected._
- **Should `create-draft-review-request.use-case.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._