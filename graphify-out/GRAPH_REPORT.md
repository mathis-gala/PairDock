# Graph Report - PairDock  (2026-07-11)

## Corpus Check
- 248 files · ~94,424 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2230 nodes · 4252 edges · 145 communities (123 shown, 22 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 74 edges (avg confidence: 0.73)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `da665771`
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
- dotenv
- walk
- agent-command-routing.integration.test.ts
- agent-gateway.integration.test.ts
- persistence.integration.test.ts
- package.json
- CreateDraftReviewRequestUseCase
- createRuntime
- PairDock Interactive Prototype
- auth.integration.test.ts
- persistence.boundaries.test.ts
- tsconfig.json
- package.json
- SessionEventFeed
- CodexHarnessAdapter
- Correction Workflow State
- resolve
- package.json
- tool-readiness-panel.tsx
- agent-client.integration.test.ts
- tsconfig.json
- preview-server.mjs
- HealthController
- MVP E2E scenario
- Q: Trace all suggested graph questions using documentation only
- tsconfig.json
- .constructor
- tsconfig.json
- PairDock collaborative developer/PM prototype
- getReact
- ci-gates.test.ts
- main.tsx
- 01 Fixed — Nimbus Trial Button Fix Preview
- ReadyPreviewTunnelPort
- ReadySandboxPort
- 01 Flow — PM Shared Projects Dashboard
- 01 Session 2 — Responsive Fix Session Workspace
- AGENTS.md
- @nestjs/platform-socket.io
- @nestjs/websockets
- @pairdock/domain
- @pairdock/shared-contracts
- rxjs
- prisma.config.ts
- 01 Session — Blank Capture
- 02 Session 2 — Responsive Fix Session Workspace
- PairDock Web Application Entrypoint
- Automated Full MVP Flow
- GitHub Actions Continuous Integration
- Prototype Reference Package

## God Nodes (most connected - your core abstractions)
1. `Behavior test plan — PairDock MVP` - 51 edges
2. `PairDockIdentity` - 46 edges
3. `Session` - 38 edges
4. `parseJsonResponse()` - 30 edges
5. `DatabaseClient` - 28 edges
6. `ProjectsService` - 27 edges
7. `AgentClient` - 25 edges
8. `DatabaseExecutor` - 25 edges
9. `Technical architecture — PairDock MVP` - 24 edges
10. `AppModule` - 24 edges

## Surprising Connections (you probably didn't know these)
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/agent-gateway/agent-gateway.integration.test.ts → apps/api/src/app.module.ts
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/projects/shared-projects.integration.test.ts → apps/api/src/app.module.ts
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/sessions/pm-session-start.integration.test.ts → apps/api/src/app.module.ts
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/sessions/session-history.integration.test.ts → apps/api/src/app.module.ts
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/tool-readiness/tool-readiness.integration.test.ts → apps/api/src/app.module.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Nimbus Trial Button Correction States** — prototype_screenshots_01_clean_blank_landing_preview, prototype_screenshots_01_fixed_nimbus_trial_button_fix, prototype_screenshots_02_clean_blank_landing_preview, prototype_screenshots_02_fixed_nimbus_trial_button_fix [INFERRED 0.85]
- **Responsive Fix Session Workspace States** — prototype_screenshots_01_sess2_responsive_session_workspace, prototype_screenshots_01_sess3_responsive_session_workspace, prototype_screenshots_02_dev_responsive_session_workspace, prototype_screenshots_02_sess2_responsive_session_workspace, prototype_screenshots_02_sess3_responsive_session_workspace [INFERRED 0.85]
- **Correction Workflow Screenshots** — prototype_screenshots_03_clean_clean_correction_prompt_state, prototype_screenshots_03_dev_developer_correction_request_state, prototype_screenshots_03_flow_correction_workflow_state, prototype_screenshots_sess4_session_correction_request_state [INFERRED 0.85]

## Communities (145 total, 22 thin omitted)

### Community 0 - "agent-config.ts"
Cohesion: 0.14
Nodes (29): agentConfigFileSchema, agentHarnessConfigSchema, AgentModelConfig, agentModelConfigSchema, agentProjectDescriptorSchema, checksConfigSchema, DEFAULT_CONFIG_PATH, normalizeAgentConfig() (+21 more)

### Community 1 - "create-draft-review-request.use-case.ts"
Cohesion: 0.10
Nodes (11): createPersistenceRepositories(), PersistenceUnitOfWorkAdapter, Inject, Injectable, PersistenceRepositories, PersistenceUnitOfWork, developer, InMemoryRepositories (+3 more)

### Community 2 - "Button"
Cohesion: 0.13
Nodes (17): ButtonProps, ButtonVariant, variantClasses, SharedProjectCard(), SharedProjectCardProps, SectionCard(), SectionCardProps, SelectInput() (+9 more)

### Community 3 - "events.ts"
Cohesion: 0.08
Nodes (27): checkResultSchema, envelopeBaseSchema, isoDateTimeSchema, sessionEnvelope(), sessionStatusSchema, toolReadinessCheckSchema, uuidSchema, AgentProtocolVersion (+19 more)

### Community 4 - "index.ts"
Cohesion: 0.18
Nodes (8): mapSession(), SessionsRepositoryAdapter, Injectable, CreateSessionInput, SessionsRepository, Inject, SessionStateMachine, Session

### Community 5 - "index.ts"
Cohesion: 0.20
Nodes (8): mapProject(), ProjectsRepositoryAdapter, Injectable, CreateProjectInput, DeveloperProjectRecord, ProjectsRepository, SharedProjectRecord, Project

### Community 6 - "developer-home-page.tsx"
Cohesion: 0.09
Nodes (20): AppHeaderProps, ConnectionActivityRail(), ProductShell(), ProductShellProps, useAuthenticateDeveloper(), useAuthenticatePm(), ShareDeveloperProjectInput, StartDeveloperSessionInput (+12 more)

### Community 7 - "app-shell.tsx"
Cohesion: 0.12
Nodes (24): AppShell(), getAppRouteSnapshot(), loginRoute, openDeveloperHome(), openLogin(), openPmDashboard(), openPmSession(), parseHash() (+16 more)

### Community 8 - "SandboxRef"
Cohesion: 0.04
Nodes (48): Agent → backend events, AgentGatewayModule, Architecture style, AuditLogModule, AuthModule, Backend → agent commands, Backend ↔ agent WebSocket contract, Backend NestJS modules (+40 more)

### Community 9 - "persistence.module.ts"
Cohesion: 0.11
Nodes (28): AgentGatewayModule, Module, AuthModule, Module, DEVELOPER_IDENTITY_PORT, PM_IDENTITY_PORT, InvitationsModule, Module (+20 more)

### Community 10 - "PairDockUser"
Cohesion: 0.19
Nodes (8): mapUser(), Inject, Injectable, UsersRepositoryAdapter, CreateUserInput, UsersRepository, Inject, PairDockUser

### Community 11 - "client.ts"
Cohesion: 0.08
Nodes (13): authApi, authHeaders(), CreateSessionInput, jsonHeaders(), requestJson(), RequestOptions, responseErrorSchema, DeveloperLoginCard() (+5 more)

### Community 12 - "sessions.service.ts"
Cohesion: 0.16
Nodes (16): AgentCommandRouterService, Injectable, EXTERNAL_IDENTITIES_REPOSITORY, MESSAGES_REPOSITORY, PROJECT_MEMBERS_REPOSITORY, PROJECT_READINESS_REPOSITORY, PROJECTS_REPOSITORY, REVIEW_REQUESTS_REPOSITORY (+8 more)

### Community 13 - "session.ts"
Cohesion: 0.12
Nodes (14): DiffPanel(), DiffPanelProps, SessionEventPanel(), SessionEventPanelProps, SessionStatusCard(), SessionStatusCardProps, SessionEventFeed, formatEventPayload() (+6 more)

### Community 14 - "scripts"
Cohesion: 0.06
Nodes (31): @biomejs/biome, devDependencies, @biomejs/biome, tsx, @types/node, typescript, name, packageManager (+23 more)

### Community 15 - "ConnectedAgentsRegistry"
Cohesion: 0.09
Nodes (16): Inject, AgentGateway, isCommandAcknowledgement(), Injectable, WebSocketGateway, WebSocketServer, cloneSnapshot(), ConnectedAgentSnapshot (+8 more)

### Community 16 - "PairDockIdentity"
Cohesion: 0.20
Nodes (3): ProjectsService, Injectable, PairDockIdentity

### Community 17 - "AuthService"
Cohesion: 0.18
Nodes (11): AuthCallbackBody, AuthController, Body, Controller, Get, HttpCode, Inject, Post (+3 more)

### Community 18 - "ProjectPreviewConfig"
Cohesion: 0.14
Nodes (14): PreparedWorktree, SessionWorkspace, buildCloudflareDockerCommand(), CloudflarePreviewTunnelAdapter, CloudflarePreviewTunnelDependencies, ManagedTunnelProcess, onceExit(), terminateProcess() (+6 more)

### Community 19 - "support.js"
Cohesion: 0.05
Nodes (60): dependencies, @pairdock/shared-contracts, react, react-dom, socket.io-client, @tanstack/react-form, @tanstack/react-query, zod (+52 more)

### Community 20 - "json-parsers.ts"
Cohesion: 0.11
Nodes (21): isToolReadinessKey(), isToolReadinessStatus(), parseToolReadinessCheck(), parseToolReadinessChecks(), serializeChecks(), serializeToolReadinessCheck(), toInputJsonObject(), toInputJsonValue() (+13 more)

### Community 21 - "pm-session-page.tsx"
Cohesion: 0.26
Nodes (10): PreviewFrame(), PreviewFrameProps, PreviewToolbar(), PreviewToolbarProps, zoomLevels, getPreviewFrameStyle(), isPreviewPresetId(), PreviewPreset (+2 more)

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
Cohesion: 0.22
Nodes (14): AgentEventEnvelopeInput, buildAgentConnectedEvent(), buildAgentDoneEvent(), buildAgentOutputEvent(), buildChecksResultEvent(), buildEnvelope(), buildErrorEvent(), buildGitBranchPushedEvent() (+6 more)

### Community 26 - "github-source-control.adapter.ts"
Cohesion: 0.13
Nodes (16): base64UrlEncode(), createGithubAppJwt(), deterministicReviewRequestNumber(), Fetcher, GithubBranchResponse, githubHeaders(), GithubInstallationRepositoriesResponse, GithubInstallationTokenResponse (+8 more)

### Community 27 - "package.json"
Cohesion: 0.08
Nodes (23): devDependencies, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, vite, @vitejs/plugin-react, name (+15 more)

### Community 28 - "mvp-flow.e2e.test.ts"
Cohesion: 0.06
Nodes (11): createTestRepository(), EXAMPLE_REPOSITORY_FIXTURE, execFileAsync, execGit(), prisma, ReadyPreviewTunnelPort, ReadySandboxPort, reviewRequestResponseSchema (+3 more)

### Community 29 - "AuthTokenService"
Cohesion: 0.20
Nodes (8): AuthTokenService, isRecord(), isUserKind(), parseTokenPayload(), TokenPayload, Injectable, Inject, Inject

### Community 30 - "github-developer-identity.adapter.ts"
Cohesion: 0.17
Nodes (10): Fetcher, GithubDeveloperIdentityAdapter, GithubDeveloperIdentityConfig, GithubEmailResponse, githubHeaders(), GithubOAuthResponse, GithubUserResponse, parseCodeCallback() (+2 more)

### Community 31 - "agent-events.repository.ts"
Cohesion: 0.19
Nodes (10): DiffService, isSessionDiffPayload(), SessionDiffView, AgentEventsRepositoryAdapter, Injectable, serializeJsonValue(), mapAgentEvent(), AgentEventsRepository (+2 more)

### Community 32 - "external-identities.repository.ts"
Cohesion: 0.12
Nodes (17): ExternalIdentitiesRepositoryAdapter, Injectable, serializeJsonObject(), mapExternalIdentity(), CreateExternalIdentityInput, ExternalIdentitiesRepository, ExternalIdentity, agentEvents (+9 more)

### Community 33 - "slack-pm-identity.adapter.ts"
Cohesion: 0.16
Nodes (10): Fetcher, parseFixtureIdentity(), SlackAuthTestResponse, slackHeaders(), SlackOAuthResponse, SlackPmIdentityAdapter, SlackPmIdentityConfig, SlackUserInfoResponse (+2 more)

### Community 34 - "WorktreeService"
Cohesion: 0.20
Nodes (7): branchExists(), execFileAsync, execGit(), pathExists(), remoteExists(), WorktreeService, BlockingPushWorktreeService

### Community 35 - "sessions.controller.ts"
Cohesion: 0.31
Nodes (4): RequireSessionAccess(), SessionAccessGuard, Inject, Injectable

### Community 36 - "DatabaseExecutor"
Cohesion: 0.10
Nodes (11): Inject, Inject, Inject, Inject, Inject, Inject, Inject, Inject (+3 more)

### Community 37 - "ReviewRequestsRepository"
Cohesion: 0.18
Nodes (8): mapReviewRequest(), ReviewRequestsRepositoryAdapter, Inject, Injectable, CreateReviewRequestInput, ReviewRequestsRepository, ReviewRequestRecord, InMemoryReviewRequestsRepository

### Community 38 - "SessionsController"
Cohesion: 0.22
Nodes (10): SessionsController, Body, Controller, Get, HttpCode, Param, Post, Req (+2 more)

### Community 39 - "ToolReadinessService"
Cohesion: 0.21
Nodes (9): ToolReadinessController, Controller, Get, HttpCode, Inject, Param, Post, Req (+1 more)

### Community 40 - "Implementation handoff — PairDock MVP"
Cohesion: 0.11
Nodes (18): Implementation handoff — PairDock MVP, T01 — Monorepo and shared contracts, T02 — Prisma persistence foundation, T03 — Auth and session permissions, T04 — Backend session lifecycle, T05 — Backend ↔ agent WebSocket, T06 — Local agent: config, login, connection, T07 — Local agent: worktree and cleanup (+10 more)

### Community 41 - "docker-sandbox.adapter.ts"
Cohesion: 0.11
Nodes (15): buildDockerRunArgs(), DockerSandboxAdapter, DockerSandboxAdapterDependencies, inferPortsFromHealthcheck(), ManagedSandboxProcess, onceExit(), SandboxSpawn, SandboxSpawnOptions (+7 more)

### Community 43 - "ui.ts"
Cohesion: 0.07
Nodes (30): ApiClient, AgentProjectOption, DeveloperProjectForm(), DeveloperProjectFormProps, ProjectFormState, ProjectSetupStateProps, resolveModelOptions(), CreateDeveloperProjectInput (+22 more)

### Community 44 - "tool-readiness.integration.test.ts"
Cohesion: 0.18
Nodes (6): developerProjectListResponseSchema, developerProjectResponseSchema, authenticateDeveloper(), authenticatePm(), prisma, startApplication()

### Community 45 - "agent-registrations.repository.ts"
Cohesion: 0.25
Nodes (10): AgentRegistrationsRepositoryAdapter, isRecord(), mapAgentRegistration(), parseModels(), parseProjects(), parseStringArray(), Injectable, AgentRegistrationsRepository (+2 more)

### Community 46 - "mappers.ts"
Cohesion: 0.21
Nodes (11): isExternalIdentityProvider(), isProjectMembershipRole(), mapMessage(), parseExternalIdentityProvider(), parseProjectMembershipRole(), MessagesRepositoryAdapter, Injectable, CreateMessageInput (+3 more)

### Community 47 - "diff.service.ts"
Cohesion: 0.19
Nodes (10): ChangedFile, CollectedDiff, DiffService, execFileAsync, execGit(), execGitAllowingDiffExitCode(), isGitDiffExitCode(), normalizeStatusPath() (+2 more)

### Community 48 - "command-handling.integration.test.ts"
Cohesion: 0.07
Nodes (8): createTempRepository(), execFileAsync, execGit(), FailOnceClosePreviewTunnelPort, ImmediateTimeoutHealthcheckService, ReadyPreviewTunnelPort, ReadySandboxPort, TimeoutSandboxPort

### Community 49 - "ProjectMembersRepository"
Cohesion: 0.21
Nodes (8): Inject, mapProjectMembership(), ProjectMembersRepositoryAdapter, Injectable, AddProjectMemberInput, ProjectMembersRepository, ProjectMembership, ProjectMembershipRole

### Community 50 - "DatabaseClient"
Cohesion: 0.29
Nodes (4): buildAdapter(), currentDirectory, DatabaseClient, Injectable

### Community 51 - "example-project.integration.test.ts"
Cohesion: 0.14
Nodes (6): createTempRepository(), execFileAsync, execGit(), HARNESS_SCRIPT_PATH, ReadyPreviewTunnelPort, ReadySandboxPort

### Community 53 - "test-json.ts"
Cohesion: 0.17
Nodes (10): authenticatePm(), prisma, startApplication(), prisma, authResponseSchema, idResponseSchema, sessionCreateResponseSchema, sessionEventListResponseSchema (+2 more)

### Community 54 - "agent-prompt-command.integration.test.ts"
Cohesion: 0.07
Nodes (8): CancellableHarnessPort, createTempRepository(), execFileAsync, execGit(), MutatingHarnessPort, ReadyPreviewTunnelPort, ReadySandboxPort, RecordingHarnessPort

### Community 55 - "AuthenticatedRequest"
Cohesion: 0.25
Nodes (9): ProjectsController, Body, Controller, Get, Inject, Param, Post, Req (+1 more)

### Community 56 - "SessionsService"
Cohesion: 0.16
Nodes (12): buildSessionPrepareCommand(), compareSessionMembers(), CreateSessionInput, CreateSessionRequest, formatUserDisplayName(), isProgressStatus(), isRecord(), parseSessionAgentEvent() (+4 more)

### Community 57 - "PRD — PairDock MVP"
Cohesion: 0.12
Nodes (15): Actors, Assumptions, Fixed constraints, Functional requirements, Goals, Handoff summary, Non-functional requirements, Non-goals for MVP (+7 more)

### Community 58 - "AgentHarnessPort"
Cohesion: 0.13
Nodes (18): createApiClient(), PromptHistoryPanel(), PromptHistoryPanelProps, ValidationPanel(), ValidationPanelProps, useSessionData(), FeedIdentity, feedRegistry (+10 more)

### Community 59 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @nestjs/common, @nestjs/core, @nestjs/platform-express, @prisma/adapter-pg, @prisma/client, reflect-metadata, socket.io (+7 more)

### Community 60 - "SessionMember"
Cohesion: 0.23
Nodes (7): mapSessionMember(), SessionMembersRepositoryAdapter, Injectable, AddSessionMemberInput, SessionMembersRepository, CreatePromptRequest, SessionMember

### Community 61 - "include"
Cohesion: 0.13
Nodes (14): compilerOptions, jsx, lib, extends, include, src/**/*.ts, ../../tsconfig.base.json, DOM (+6 more)

### Community 62 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, db:migrate, db:migrate:dev, db:reset, db:status, dev, lint (+6 more)

### Community 63 - "AppModule"
Cohesion: 0.18
Nodes (3): AgentClientConfig, isRetryableError(), prisma

### Community 64 - "source-control-connections.repository.ts"
Cohesion: 0.31
Nodes (6): mapSourceControlConnection(), SourceControlConnectionsRepositoryAdapter, Injectable, CreateSourceControlConnectionInput, SourceControlConnectionsRepository, SourceControlConnection

### Community 65 - "checks-runner.ts"
Cohesion: 0.23
Nodes (5): appendLogs(), CheckResult, ChecksResult, ChecksRunner, RunChecksInput

### Community 66 - "compilerOptions"
Cohesion: 0.14
Nodes (13): node, compilerOptions, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, noEmit (+5 more)

### Community 67 - "SourceControlPort"
Cohesion: 0.11
Nodes (16): Button(), ConnectionActivityRailProps, RailMetricProps, DeveloperProjectCard(), DeveloperProjectCardProps, ProjectFactProps, ProjectShareForm(), ProjectShareFormProps (+8 more)

### Community 68 - "session-state-machine.ts"
Cohesion: 0.19
Nodes (8): isLifecycleProgressStatus(), toSessionAgentEvent(), AGENT_REGISTRATIONS_REPOSITORY, PERSISTENCE_UNIT_OF_WORK, allowedProgressTransitions, InvalidSessionTransitionError, ProgressStatus, SessionAgentEvent

### Community 69 - "UiGateway"
Cohesion: 0.19
Nodes (8): Inject, ConnectedSocket, Injectable, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, UiGateway

### Community 70 - "dependencies"
Cohesion: 0.19
Nodes (18): ProjectChecksConfig, AgentConfig, AgentProjectDescriptor, SaveAgentConfigInput, CommandResult, enrichConfigWithProjectManifests(), loadProjectManifest(), mergeProjects() (+10 more)

### Community 71 - "developer-project-form.tsx"
Cohesion: 0.11
Nodes (17): AgentCancelCommandEnvelope, agentCancelCommandEnvelopeSchema, AgentPromptCommandEnvelope, agentPromptCommandEnvelopeSchema, ChecksRunCommandEnvelope, checksRunCommandEnvelopeSchema, GitGetDiffCommandEnvelope, gitGetDiffCommandEnvelopeSchema (+9 more)

### Community 72 - "V1 developer setup"
Cohesion: 0.15
Nodes (12): 1. GitHub App, 2. Slack App, 3. Start PairDock, 4. Cloudflare Tunnel, 5. Add `pairdock.yml`, 6. Configure the local agent, 7. Create a PairDock project, Commands (+4 more)

### Community 73 - "ui-gateway.browser-auth.integration.test.ts"
Cohesion: 0.17
Nodes (5): sessionIdResponseSchema, authenticateDeveloper(), authenticatePm(), createSession(), prisma

### Community 74 - "session-runner.integration.test.ts"
Cohesion: 0.12
Nodes (7): createTempRepository(), execFileAsync, execGit(), FailingClosePreviewTunnelPort, FailingHealthcheckService, FakePreviewTunnelPort, FakeSandboxPort

### Community 75 - "ValidationService"
Cohesion: 0.27
Nodes (5): toValidationView(), Inject, Injectable, ValidationService, ChecksResultEventEnvelope

### Community 76 - "SessionPromptService"
Cohesion: 0.22
Nodes (5): buildAgentCancelCommand(), buildAgentPromptCommand(), SessionPromptService, Injectable, Inject

### Community 77 - "codex-harness.adapter.ts"
Cohesion: 0.15
Nodes (9): AgentHarnessEvent, AgentHarnessPort, RunPromptInput, AgentHarnessEventQueue, buildCommandArgs(), CodexHarnessAdapter, normalizeExitCode(), onceExit() (+1 more)

### Community 78 - "package.json"
Cohesion: 0.17
Nodes (11): dependencies, zod, exports, zod, name, private, scripts, build (+3 more)

### Community 79 - "validation.integration.test.ts"
Cohesion: 0.18
Nodes (3): authenticateDeveloper(), createSession(), prisma

### Community 80 - "shared-projects.integration.test.ts"
Cohesion: 0.21
Nodes (8): announceAgent(), authenticatePm(), prisma, publishReadiness(), sendAgentEvent(), startApplication(), waitForConnect(), sharedProjectListResponseSchema

### Community 81 - "pm-session-start.integration.test.ts"
Cohesion: 0.24
Nodes (7): announceAgent(), authenticatePm(), prisma, publishReadiness(), sendAgentEvent(), startApplication(), waitForConnect()

### Community 82 - "session-prompts.integration.test.ts"
Cohesion: 0.19
Nodes (7): authenticateDeveloper(), authenticateDeveloper(), authenticatePm(), createSession(), prisma, parseJsonResponse(), sessionPromptResponseSchema

### Community 83 - "AgentEventEnvelope"
Cohesion: 0.25
Nodes (5): ConnectedSocket, MessageBody, SubscribeMessage, AgentEventEnvelope, ErrorEventEnvelope

### Community 84 - "auth.service.ts"
Cohesion: 0.15
Nodes (9): AuthProvider, AuthService, buildFrontendAuthRedirectUrl(), OAuthStartUrlConfig, readOAuthStartUrlConfig(), Inject, Injectable, DeveloperIdentityPort (+1 more)

### Community 85 - "BT-050 — Same-email cross-role accounts remain independent"
Cohesion: 0.04
Nodes (51): Behavior test plan — PairDock MVP, BT-001 — Installable workspace, BT-002 — Session creation is persisted, BT-003 — Agent event is persisted, BT-004 — PM member access is allowed, BT-005 — Non-member access is denied, BT-006 — Valid session transitions, BT-007 — Invalid transition is rejected (+43 more)

### Community 86 - "Screens represented"
Cohesion: 0.18
Nodes (10): Architecture documents reconciled, Developer dashboard, Implementation guidance, Login, PM shared-project dashboard, Prototype notes — PairDock collaborative developer/PM, Purpose, Running/fixed/review states (+2 more)

### Community 88 - "walk"
Cohesion: 0.25
Nodes (14): loadAgentConfig(), resolveAgentConfigPath(), saveAgentConfig(), summarizeAgentConfig(), main(), parseModelMapping(), parseModelMappings(), parseProjectMapping() (+6 more)

### Community 89 - "agent-command-routing.integration.test.ts"
Cohesion: 0.12
Nodes (6): createTempRepository(), execFileAsync, execGit(), prisma, ReadyPreviewTunnelPort, ReadySandboxPort

### Community 90 - "agent-gateway.integration.test.ts"
Cohesion: 0.18
Nodes (5): authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication()

### Community 91 - "persistence.integration.test.ts"
Cohesion: 0.15
Nodes (11): AppModule, Module, bootstrap(), startApplication(), authenticatePm(), prisma, startApplication(), startApplication() (+3 more)

### Community 92 - "package.json"
Cohesion: 0.20
Nodes (9): devDependencies, prisma, socket.io-client, socket.io-client, name, private, type, version (+1 more)

### Community 93 - "CreateDraftReviewRequestUseCase"
Cohesion: 0.15
Nodes (11): InvitationsService, Injectable, SESSION_MEMBERS_REPOSITORY, VALIDATION_RUNS_REPOSITORY, buildGitPushBranchCommand(), buildReviewRequestBody(), buildSessionBranchName(), CreateDraftReviewRequestUseCase (+3 more)

### Community 94 - "createRuntime"
Cohesion: 0.27
Nodes (7): AuthenticatedRequest, AuthenticatedUserGuard, Injectable, RequireAuth(), SessionStartSource, CreatePromptBody, CreateSessionBody

### Community 95 - "PairDock Interactive Prototype"
Cohesion: 0.30
Nodes (7): mapValidationRun(), Injectable, ValidationRunsRepositoryAdapter, CreateValidationRunInput, ValidationRunsRepository, SessionValidationView, ValidationRun

### Community 96 - "auth.integration.test.ts"
Cohesion: 0.22
Nodes (3): announceAgent(), prisma, waitForConnect()

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
Cohesion: 0.19
Nodes (6): buildSessionCloseCommand(), SessionCloseService, Inject, Injectable, Inject, Optional

### Community 101 - "CodexHarnessAdapter"
Cohesion: 0.23
Nodes (6): Injectable, ValidationPolicy, SessionStatus, SessionCloseResult, SessionPrepareHooks, SessionRunnerConfig

### Community 102 - "Correction Workflow State"
Cohesion: 0.25
Nodes (8): Clean Correction Prompt State, Developer Correction Request State, Correction Workflow State, Session Workspace State, Follow-up Workflow State, Follow-up Session Workspace State, Demo Navigation State, Session Correction Request State

### Community 103 - "resolve"
Cohesion: 0.24
Nodes (3): Inject, Injectable, UsersService

### Community 104 - "package.json"
Cohesion: 0.25
Nodes (7): name, private, scripts, build, lint, test, type

### Community 105 - "tool-readiness-panel.tsx"
Cohesion: 0.38
Nodes (6): checkLabels, statusTone(), ToolReadinessPanel(), ToolReadinessPanelProps, ToolReadinessRow(), DeveloperProjectReadiness

### Community 107 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): extends, include, src/**/*.ts, ../../tsconfig.base.json, ../../tests/packages/local-agent/**/*.ts

### Community 109 - "HealthController"
Cohesion: 0.40
Nodes (3): HealthController, Controller, Get

### Community 110 - "MVP E2E scenario"
Cohesion: 0.40
Nodes (4): Fixtures, MVP E2E scenario, Reproduce locally, What it proves

### Community 111 - "Q: Trace all suggested graph questions using documentation only"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Trace all suggested graph questions using documentation only, Source Nodes

### Community 112 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

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

### Community 121 - "ReadySandboxPort"
Cohesion: 0.50
Nodes (3): agentCommandEnvelopeSchema, agentConnectedEventEnvelopeSchema, agentEventEnvelopeSchema

### Community 122 - "01 Flow — PM Shared Projects Dashboard"
Cohesion: 0.67
Nodes (3): 01 Dev — Developer Shared Projects Dashboard, 01 Flow — PM Shared Projects Dashboard, 02 Flow — PM Shared Projects Dashboard

### Community 123 - "01 Session 2 — Responsive Fix Session Workspace"
Cohesion: 0.67
Nodes (3): 01 Session 2 — Responsive Fix Session Workspace, 01 Session 3 — Responsive Fix Session Workspace, 02 Dev — Responsive Fix Session Workspace

## Knowledge Gaps
- **527 isolated node(s):** `graphify`, `Workspace`, `Commands`, `1. GitHub App`, `2. Slack App` (+522 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PairDockIdentity` connect `PairDockIdentity` to `create-draft-review-request.use-case.ts`, `sessions.service.ts`, `ConnectedAgentsRegistry`, `AuthService`, `auth.service.ts`, `CreateDraftReviewRequestUseCase`, `json-parsers.ts`, `SessionsService`, `SessionMember`, `AuthTokenService`, `createRuntime`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `resolve()` connect `support.js` to `walk`, `docker-sandbox.adapter.ts`, `codex-harness.adapter.ts`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `AgentClient` connect `AgentClient` to `session-runner.ts`, `agent-client.integration.test.ts`, `command-handling.integration.test.ts`, `agent-prompt-command.integration.test.ts`, `walk`, `agent-command-routing.integration.test.ts`, `mvp-flow.e2e.test.ts`, `AppModule`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `graphify`, `Workspace`, `Commands` to the rest of the system?**
  _527 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agent-config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14482758620689656 - nodes in this community are weakly interconnected._
- **Should `create-draft-review-request.use-case.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10153846153846154 - nodes in this community are weakly interconnected._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.12923076923076923 - nodes in this community are weakly interconnected._