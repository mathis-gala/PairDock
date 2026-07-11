# Graph Report - .  (2026-07-11)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2189 nodes · 4740 edges · 182 communities (123 shown, 59 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 93 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b6d2958f`
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
- Graph Query First
- Graphify Repository Workflow
- Incremental Graph Update
- PairDock Web Application Entrypoint
- Automated Full MVP Flow
- Collaborative Developer-PM Session
- External Provider Replaceability
- Per-Session Isolated Execution
- PairDock Product Requirements
- Developer and PM Role Separation
- Validation Gate Before Review
- Backend-Agent Gateway
- Authentication and Session Permissions
- Developer Control UI
- Diff and Log Redaction
- Agent Harness Streaming
- PairDock MVP Implementation Handoff
- MVP End-to-End Scenario
- PM Session UI
- Docker Preview and Cloudflare Tunnel
- Prisma Persistence Foundation
- Repository CI Gates
- Backend Session Lifecycle
- Shared Contracts Foundation
- Source-Control Draft Review Implementation
- Build-Test-Lint-Preview Validation
- Worktree Isolation and Cleanup
- Prototype Login Role Cards
- Prototype Is Not Production Code
- Prototype PM Shared-Project Dashboard
- PairDock Prototype Notes
- Visual Product Reference
- GitHub Actions Continuous Integration
- Prototype Reference Package
- Cloudflare Preview Tunnel
- Docker Session Sandbox
- GitHub App Integration
- PairDock Local Agent
- PairDock Monorepo Workspace
- PairDock MVP
- pairdock.yml Project Configuration
- Safe Agent Metadata Publication
- Slack OAuth for PM Authentication

## God Nodes (most connected - your core abstractions)
1. `PairDockIdentity` - 46 edges
2. `parseJsonResponse()` - 44 edges
3. `DatabaseClient` - 38 edges
4. `Session` - 38 edges
5. `AppModule` - 34 edges
6. `SandboxRef` - 30 edges
7. `AgentClient` - 30 edges
8. `DatabaseExecutor` - 28 edges
9. `ProjectsService` - 27 edges
10. `ConnectedAgentsRegistry` - 26 edges

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
- **Same-email cross-role browser isolation** — docs_architecture_pairdock_mvp_architecture_email_kind_uniqueness, docs_architecture_pairdock_mvp_architecture_localstorage_browser_authentication, docs_architecture_pairdock_mvp_architecture_separate_browsers_or_profiles, docs_architecture_pairdock_mvp_test_plan_bt_050_same_email_cross_role_accounts_remain_independent, docs_architecture_pairdock_mvp_test_plan_role_specific_localstorage_sessions [EXTRACTED 1.00]
- **Prototype Product Surface Set** — prototype_pairdock_dc_login_screen, prototype_pairdock_dc_developer_dashboard, prototype_pairdock_dc_pm_dashboard, prototype_pairdock_dc_session_workspace [EXTRACTED 1.00]
- **Nimbus Trial Button Correction States** — prototype_screenshots_01_clean_blank_landing_preview, prototype_screenshots_01_fixed_nimbus_trial_button_fix, prototype_screenshots_02_clean_blank_landing_preview, prototype_screenshots_02_fixed_nimbus_trial_button_fix [INFERRED 0.85]
- **Responsive Fix Session Workspace States** — prototype_screenshots_01_sess2_responsive_session_workspace, prototype_screenshots_01_sess3_responsive_session_workspace, prototype_screenshots_02_dev_responsive_session_workspace, prototype_screenshots_02_sess2_responsive_session_workspace, prototype_screenshots_02_sess3_responsive_session_workspace [INFERRED 0.85]
- **Correction Workflow Screenshots** — prototype_screenshots_03_clean_clean_correction_prompt_state, prototype_screenshots_03_dev_developer_correction_request_state, prototype_screenshots_03_flow_correction_workflow_state, prototype_screenshots_sess4_session_correction_request_state [INFERRED 0.85]

## Communities (182 total, 59 thin omitted)

### Community 0 - "agent-config.ts"
Cohesion: 0.06
Nodes (61): ProjectChecksConfig, AgentConfig, agentConfigFileSchema, agentHarnessConfigSchema, AgentModelConfig, agentModelConfigSchema, AgentProjectDescriptor, agentProjectDescriptorSchema (+53 more)

### Community 1 - "create-draft-review-request.use-case.ts"
Cohesion: 0.10
Nodes (24): mapValidationRun(), createPersistenceRepositories(), PersistenceUnitOfWorkAdapter, Injectable, Injectable, ValidationRunsRepositoryAdapter, VALIDATION_RUNS_REPOSITORY, PersistenceRepositories (+16 more)

### Community 2 - "Button"
Cohesion: 0.07
Nodes (30): Button(), ButtonProps, ButtonVariant, variantClasses, ConnectionActivityRail(), ConnectionActivityRailProps, RailMetricProps, DeveloperProjectCardProps (+22 more)

### Community 3 - "events.ts"
Cohesion: 0.06
Nodes (37): AgentCancelCommandEnvelope, agentCancelCommandEnvelopeSchema, agentCommandEnvelopeSchema, agentPromptCommandEnvelopeSchema, ChecksRunCommandEnvelope, checksRunCommandEnvelopeSchema, GitGetDiffCommandEnvelope, gitGetDiffCommandEnvelopeSchema (+29 more)

### Community 4 - "index.ts"
Cohesion: 0.11
Nodes (18): AgentCommandRouterService, Inject, Injectable, mapSession(), SessionsRepositoryAdapter, Injectable, SESSIONS_REPOSITORY, CreateSessionInput (+10 more)

### Community 5 - "index.ts"
Cohesion: 0.11
Nodes (17): mapProject(), ProjectsRepositoryAdapter, Injectable, ProjectReadinessRepository, CreateProjectInput, DeveloperProjectRecord, ProjectsRepository, SharedProjectRecord (+9 more)

### Community 6 - "developer-home-page.tsx"
Cohesion: 0.08
Nodes (22): AppHeaderProps, DeveloperProjectCard(), ProductShell(), ProductShellProps, useAuthenticateDeveloper(), useAuthenticatePm(), ShareDeveloperProjectInput, StartDeveloperSessionInput (+14 more)

### Community 7 - "app-shell.tsx"
Cohesion: 0.11
Nodes (24): AppShell(), getAppRouteSnapshot(), loginRoute, openDeveloperHome(), openLogin(), openPmDashboard(), openPmSession(), parseHash() (+16 more)

### Community 8 - "SandboxRef"
Cohesion: 0.10
Nodes (9): HealthcheckWaitInput, SandboxPort, SandboxRef, ReadySandboxPort, ReadySandboxPort, ReadySandboxPort, TimeoutSandboxPort, ReadySandboxPort (+1 more)

### Community 9 - "persistence.module.ts"
Cohesion: 0.16
Nodes (22): AgentGatewayModule, Module, AuthModule, Module, InvitationsModule, Module, PersistenceModule, Module (+14 more)

### Community 10 - "PairDockUser"
Cohesion: 0.12
Nodes (12): mapUser(), Inject, Injectable, UsersRepositoryAdapter, CreateUserInput, UsersRepository, Module, UsersModule (+4 more)

### Community 11 - "client.ts"
Cohesion: 0.07
Nodes (15): ApiClient, authApi, authHeaders(), CreateSessionInput, jsonHeaders(), requestJson(), RequestOptions, responseErrorSchema (+7 more)

### Community 12 - "sessions.service.ts"
Cohesion: 0.12
Nodes (25): isLifecycleProgressStatus(), toSessionAgentEvent(), AGENT_EVENTS_REPOSITORY, AGENT_REGISTRATIONS_REPOSITORY, EXTERNAL_IDENTITIES_REPOSITORY, MESSAGES_REPOSITORY, PERSISTENCE_UNIT_OF_WORK, PROJECT_MEMBERS_REPOSITORY (+17 more)

### Community 13 - "session.ts"
Cohesion: 0.10
Nodes (23): DiffPanel(), DiffPanelProps, PromptHistoryPanel(), PromptHistoryPanelProps, SessionEventPanel(), SessionEventPanelProps, SessionStatusCard(), SessionStatusCardProps (+15 more)

### Community 14 - "scripts"
Cohesion: 0.06
Nodes (31): @biomejs/biome, devDependencies, @biomejs/biome, tsx, @types/node, typescript, name, packageManager (+23 more)

### Community 15 - "ConnectedAgentsRegistry"
Cohesion: 0.10
Nodes (13): AgentGateway, isCommandAcknowledgement(), Inject, Injectable, WebSocketGateway, WebSocketServer, cloneSnapshot(), ConnectedAgentSnapshot (+5 more)

### Community 16 - "PairDockIdentity"
Cohesion: 0.20
Nodes (6): ProjectsService, resolveUnavailableReason(), Injectable, PairDockIdentity, CreateDeveloperProjectInput, DeveloperProjectSummary

### Community 17 - "AuthService"
Cohesion: 0.14
Nodes (14): AuthController, Body, Controller, Get, HttpCode, Inject, Post, AuthResult (+6 more)

### Community 18 - "ProjectPreviewConfig"
Cohesion: 0.16
Nodes (13): ProjectPreviewConfig, SessionRunnerConfig, buildCloudflareDockerCommand(), CloudflarePreviewTunnelAdapter, CloudflarePreviewTunnelDependencies, ManagedTunnelProcess, onceExit(), terminateProcess() (+5 more)

### Community 19 - "support.js"
Cohesion: 0.11
Nodes (15): boot(), compileTemplate(), dcNameFromPath(), encodeCase(), getReactDOM(), init(), isElementClass(), isRenderableType() (+7 more)

### Community 20 - "json-parsers.ts"
Cohesion: 0.13
Nodes (16): isToolReadinessKey(), isToolReadinessStatus(), parseToolReadinessCheck(), parseToolReadinessChecks(), serializeChecks(), serializeJsonObject(), serializeToolReadinessCheck(), toInputJsonObject() (+8 more)

### Community 21 - "pm-session-page.tsx"
Cohesion: 0.15
Nodes (18): createApiClient(), PreviewFrame(), PreviewFrameProps, PreviewToolbar(), PreviewToolbarProps, zoomLevels, useSessionData(), FeedIdentity (+10 more)

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
Cohesion: 0.17
Nodes (22): isRetryableError(), AgentEventEnvelopeInput, buildAgentConnectedEvent(), buildAgentDoneEvent(), buildAgentOutputEvent(), buildChecksResultEvent(), buildEnvelope(), buildErrorEvent() (+14 more)

### Community 26 - "github-source-control.adapter.ts"
Cohesion: 0.14
Nodes (15): base64UrlEncode(), createGithubAppJwt(), deterministicReviewRequestNumber(), Fetcher, GithubBranchResponse, githubHeaders(), GithubInstallationRepositoriesResponse, GithubInstallationTokenResponse (+7 more)

### Community 27 - "package.json"
Cohesion: 0.08
Nodes (23): devDependencies, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, vite, @vitejs/plugin-react, name (+15 more)

### Community 28 - "mvp-flow.e2e.test.ts"
Cohesion: 0.13
Nodes (16): authenticateDeveloper(), authenticatePm(), closeSession(), createDeveloperProject(), createReviewRequest(), createSession(), createTestRepository(), EXAMPLE_REPOSITORY_FIXTURE (+8 more)

### Community 29 - "AuthTokenService"
Cohesion: 0.16
Nodes (10): AuthTokenService, isRecord(), isUserKind(), parseTokenPayload(), TokenPayload, Injectable, AuthenticatedUserGuard, Inject (+2 more)

### Community 30 - "github-developer-identity.adapter.ts"
Cohesion: 0.13
Nodes (12): Fetcher, GithubDeveloperIdentityAdapter, GithubDeveloperIdentityConfig, GithubEmailResponse, githubHeaders(), GithubOAuthResponse, GithubUserResponse, parseCodeCallback() (+4 more)

### Community 31 - "agent-events.repository.ts"
Cohesion: 0.19
Nodes (10): DiffService, isSessionDiffPayload(), SessionDiffView, AgentEventsRepositoryAdapter, Injectable, serializeJsonValue(), mapAgentEvent(), AgentEventsRepository (+2 more)

### Community 32 - "external-identities.repository.ts"
Cohesion: 0.19
Nodes (9): ExternalIdentitiesRepositoryAdapter, Inject, Injectable, parseJsonObject(), mapExternalIdentity(), CreateExternalIdentityInput, ExternalIdentitiesRepository, ExternalIdentity (+1 more)

### Community 33 - "slack-pm-identity.adapter.ts"
Cohesion: 0.14
Nodes (11): Fetcher, parseFixtureIdentity(), SlackAuthTestResponse, slackHeaders(), SlackOAuthResponse, SlackPmIdentityAdapter, SlackPmIdentityConfig, SlackUserInfoResponse (+3 more)

### Community 34 - "WorktreeService"
Cohesion: 0.22
Nodes (7): branchExists(), execFileAsync, execGit(), pathExists(), remoteExists(), WorktreeService, BlockingPushWorktreeService

### Community 35 - "sessions.controller.ts"
Cohesion: 0.15
Nodes (8): RequireSessionAccess(), SessionAccessGuard, Inject, Injectable, InvitationsService, Injectable, CreatePromptBody, Inject

### Community 36 - "DatabaseExecutor"
Cohesion: 0.11
Nodes (10): Inject, Inject, Inject, Inject, Inject, Inject, Inject, Inject (+2 more)

### Community 37 - "ReviewRequestsRepository"
Cohesion: 0.22
Nodes (7): mapReviewRequest(), ReviewRequestsRepositoryAdapter, Injectable, CreateReviewRequestInput, ReviewRequestsRepository, ReviewRequestRecord, InMemoryReviewRequestsRepository

### Community 38 - "SessionsController"
Cohesion: 0.26
Nodes (10): SessionsController, Body, Controller, Get, HttpCode, Param, Post, Req (+2 more)

### Community 39 - "ToolReadinessService"
Cohesion: 0.16
Nodes (12): ToolReadinessController, Controller, Get, HttpCode, Inject, Param, Post, Req (+4 more)

### Community 40 - "Implementation handoff — PairDock MVP"
Cohesion: 0.11
Nodes (18): Implementation handoff — PairDock MVP, T01 — Monorepo and shared contracts, T02 — Prisma persistence foundation, T03 — Auth and session permissions, T04 — Backend session lifecycle, T05 — Backend ↔ agent WebSocket, T06 — Local agent: config, login, connection, T07 — Local agent: worktree and cleanup (+10 more)

### Community 41 - "docker-sandbox.adapter.ts"
Cohesion: 0.16
Nodes (9): buildDockerRunArgs(), DockerSandboxAdapter, DockerSandboxAdapterDependencies, inferPortsFromHealthcheck(), ManagedSandboxProcess, onceExit(), SandboxSpawn, SandboxSpawnOptions (+1 more)

### Community 42 - "session-runner.ts"
Cohesion: 0.17
Nodes (9): PreparedWorktree, SessionRegistry, SessionWorkspace, errorMessage(), SessionCloseResult, SessionRunner, GitPushBranchCommandEnvelope, SessionCloseCommandEnvelope (+1 more)

### Community 43 - "ui.ts"
Cohesion: 0.11
Nodes (18): createDeveloperProjectInputSchema, developerProjectReadinessSchema, developerProjectSessionSummarySchema, developerProjectSetupSchema, developerProjectSummaryListSchema, developerProjectSummarySchema, DeveloperSetupAgent, developerSetupAgentModelSchema (+10 more)

### Community 44 - "tool-readiness.integration.test.ts"
Cohesion: 0.11
Nodes (11): authenticateDeveloper(), authenticatePm(), prisma, startApplication(), developerProjectListResponseSchema, developerProjectResponseSchema, authenticateDeveloper(), authenticatePm() (+3 more)

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
Cohesion: 0.10
Nodes (7): HealthcheckTimeoutError, createTempRepository(), execFileAsync, execGit(), FailOnceClosePreviewTunnelPort, ImmediateTimeoutHealthcheckService, ReadyPreviewTunnelPort

### Community 49 - "ProjectMembersRepository"
Cohesion: 0.23
Nodes (8): Inject, mapProjectMembership(), ProjectMembersRepositoryAdapter, Injectable, AddProjectMemberInput, ProjectMembersRepository, ProjectMembership, ProjectMembershipRole

### Community 50 - "DatabaseClient"
Cohesion: 0.13
Nodes (9): Inject, buildAdapter(), currentDirectory, DatabaseClient, Injectable, authenticatePm(), prisma, startApplication() (+1 more)

### Community 51 - "example-project.integration.test.ts"
Cohesion: 0.14
Nodes (7): PreviewTunnelPort, ReadyPreviewTunnelPort, createTempRepository(), execFileAsync, execGit(), HARNESS_SCRIPT_PATH, ReadyPreviewTunnelPort

### Community 52 - "AgentClient"
Cohesion: 0.35
Nodes (3): AgentClient, AgentClientLogger, buildReadinessResultEvent()

### Community 53 - "test-json.ts"
Cohesion: 0.16
Nodes (10): authenticatePm(), prisma, authenticateDeveloper(), prisma, startApplication(), authResponseSchema, idResponseSchema, sessionEventListResponseSchema (+2 more)

### Community 54 - "agent-prompt-command.integration.test.ts"
Cohesion: 0.13
Nodes (4): createTempRepository(), execFileAsync, execGit(), ReadyPreviewTunnelPort

### Community 55 - "AuthenticatedRequest"
Cohesion: 0.26
Nodes (10): AuthenticatedRequest, ProjectsController, Body, Controller, Get, Inject, Param, Post (+2 more)

### Community 56 - "SessionsService"
Cohesion: 0.24
Nodes (3): formatUserDisplayName(), SessionsService, Injectable

### Community 57 - "PRD — PairDock MVP"
Cohesion: 0.12
Nodes (15): Actors, Assumptions, Fixed constraints, Functional requirements, Goals, Handoff summary, Non-functional requirements, Non-goals for MVP (+7 more)

### Community 58 - "AgentHarnessPort"
Cohesion: 0.16
Nodes (6): AgentHarnessPort, RunPromptInput, SimulatedAgentHarness, CancellableHarnessPort, MutatingHarnessPort, RecordingHarnessPort

### Community 59 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @nestjs/common, @nestjs/core, @nestjs/platform-express, @prisma/adapter-pg, @prisma/client, reflect-metadata, socket.io (+7 more)

### Community 60 - "SessionMember"
Cohesion: 0.20
Nodes (7): mapSessionMember(), SessionMembersRepositoryAdapter, Inject, Injectable, AddSessionMemberInput, CreatePromptRequest, SessionMember

### Community 61 - "include"
Cohesion: 0.13
Nodes (14): compilerOptions, jsx, lib, extends, include, src/**/*.ts, ../../tsconfig.base.json, DOM (+6 more)

### Community 62 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, db:migrate, db:migrate:dev, db:reset, db:status, dev, lint (+6 more)

### Community 63 - "AppModule"
Cohesion: 0.16
Nodes (8): AppModule, Module, bootstrap(), startApplication(), prisma, startApplication(), waitFor(), startApplication()

### Community 64 - "source-control-connections.repository.ts"
Cohesion: 0.23
Nodes (6): mapSourceControlConnection(), SourceControlConnectionsRepositoryAdapter, Inject, Injectable, CreateSourceControlConnectionInput, SourceControlConnection

### Community 65 - "checks-runner.ts"
Cohesion: 0.20
Nodes (5): appendLogs(), CheckResult, ChecksResult, ChecksRunner, RunChecksInput

### Community 66 - "compilerOptions"
Cohesion: 0.14
Nodes (13): node, compilerOptions, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, noEmit (+5 more)

### Community 67 - "SourceControlPort"
Cohesion: 0.19
Nodes (3): Inject, SourceControlPort, RecordingSourceControlPort

### Community 68 - "session-state-machine.ts"
Cohesion: 0.22
Nodes (5): allowedProgressTransitions, InvalidSessionTransitionError, ProgressStatus, SessionAgentEvent, SessionStateMachine

### Community 69 - "UiGateway"
Cohesion: 0.23
Nodes (7): ConnectedSocket, Injectable, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, UiGateway

### Community 70 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, @pairdock/shared-contracts, react-dom, socket.io-client, @tanstack/react-form, @tanstack/react-query, zod, @pairdock/shared-contracts (+5 more)

### Community 71 - "developer-project-form.tsx"
Cohesion: 0.21
Nodes (9): AgentProjectOption, DeveloperProjectForm(), DeveloperProjectFormProps, ProjectFormState, ProjectSetupStateProps, resolveModelOptions(), DeveloperProjectSetup, DeveloperSetupAgentModel (+1 more)

### Community 72 - "V1 developer setup"
Cohesion: 0.15
Nodes (12): 1. GitHub App, 2. Slack App, 3. Start PairDock, 4. Cloudflare Tunnel, 5. Add `pairdock.yml`, 6. Configure the local agent, 7. Create a PairDock project, Commands (+4 more)

### Community 73 - "ui-gateway.browser-auth.integration.test.ts"
Cohesion: 0.15
Nodes (6): sessionIdResponseSchema, authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication()

### Community 74 - "session-runner.integration.test.ts"
Cohesion: 0.14
Nodes (8): HealthcheckService, HealthcheckResult, createTempRepository(), execFileAsync, execGit(), FailingClosePreviewTunnelPort, FailingHealthcheckService, FakePreviewTunnelPort

### Community 75 - "ValidationService"
Cohesion: 0.27
Nodes (5): toValidationView(), Inject, Injectable, ValidationService, ChecksResultEventEnvelope

### Community 76 - "SessionPromptService"
Cohesion: 0.24
Nodes (5): buildAgentCancelCommand(), buildAgentPromptCommand(), SessionPromptService, Injectable, Inject

### Community 77 - "codex-harness.adapter.ts"
Cohesion: 0.32
Nodes (4): AgentHarnessEvent, AgentHarnessEventQueue, buildCommandArgs(), normalizeExitCode()

### Community 78 - "package.json"
Cohesion: 0.17
Nodes (11): dependencies, zod, exports, zod, name, private, scripts, build (+3 more)

### Community 79 - "validation.integration.test.ts"
Cohesion: 0.17
Nodes (4): authenticateDeveloper(), createSession(), prisma, startApplication()

### Community 80 - "shared-projects.integration.test.ts"
Cohesion: 0.21
Nodes (8): announceAgent(), authenticatePm(), prisma, publishReadiness(), sendAgentEvent(), startApplication(), waitForConnect(), sharedProjectListResponseSchema

### Community 81 - "pm-session-start.integration.test.ts"
Cohesion: 0.21
Nodes (8): announceAgent(), authenticatePm(), prisma, publishReadiness(), sendAgentEvent(), startApplication(), waitForConnect(), sessionCreateResponseSchema

### Community 82 - "session-prompts.integration.test.ts"
Cohesion: 0.17
Nodes (6): authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication(), sessionPromptResponseSchema

### Community 83 - "AgentEventEnvelope"
Cohesion: 0.25
Nodes (5): ConnectedSocket, MessageBody, SubscribeMessage, AgentEventEnvelope, ErrorEventEnvelope

### Community 84 - "auth.service.ts"
Cohesion: 0.29
Nodes (5): AuthCallbackBody, AuthProvider, OAuthStartUrlConfig, DEVELOPER_IDENTITY_PORT, PM_IDENTITY_PORT

### Community 85 - "BT-050 — Same-email cross-role accounts remain independent"
Cohesion: 0.27
Nodes (11): AuthModule, Email and kind uniqueness, localStorage browser authentication, Project and session membership, Role-specific identity, Separate browsers or browser profiles, BT-050 — Same-email cross-role accounts remain independent, Distinct (email, kind) users (+3 more)

### Community 86 - "Screens represented"
Cohesion: 0.18
Nodes (10): Architecture documents reconciled, Developer dashboard, Implementation guidance, Login, PM shared-project dashboard, Prototype notes — PairDock collaborative developer/PM, Purpose, Running/fixed/review states (+2 more)

### Community 88 - "walk"
Cohesion: 0.40
Nodes (11): collectProps(), compileAttr(), cssToObj(), hostPositionStyle(), kebabToCamel(), walk(), walkChildren(), walkComponent() (+3 more)

### Community 89 - "agent-command-routing.integration.test.ts"
Cohesion: 0.22
Nodes (5): createTempRepository(), execFileAsync, execGit(), prisma, startApplication()

### Community 90 - "agent-gateway.integration.test.ts"
Cohesion: 0.18
Nodes (5): authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication()

### Community 91 - "persistence.integration.test.ts"
Cohesion: 0.18
Nodes (9): agentEvents, externalIdentities, prisma, projects, sessionMembers, sessions, sourceControlConnections, unitOfWork (+1 more)

### Community 92 - "package.json"
Cohesion: 0.20
Nodes (9): devDependencies, prisma, socket.io-client, socket.io-client, name, private, type, version (+1 more)

### Community 93 - "CreateDraftReviewRequestUseCase"
Cohesion: 0.29
Nodes (5): buildGitPushBranchCommand(), buildReviewRequestBody(), buildSessionBranchName(), CreateDraftReviewRequestUseCase, Injectable

### Community 94 - "createRuntime"
Cohesion: 0.20
Nodes (10): react, get(), createComponentFactory(), createExternalModules(), createHelmetManager(), createPseudoSheet(), createRegistry(), createRuntime() (+2 more)

### Community 95 - "PairDock Interactive Prototype"
Cohesion: 0.20
Nodes (10): Project and Session Membership Model, Draft Review Request, Interactive Developer Dashboard, Draft Pull Request Confirmation Modal, Interactive Two-Role Login Screen, PairDock Interactive Prototype, Interactive PM Dashboard, Prototype Responsive Device Presets (+2 more)

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

### Community 101 - "CodexHarnessAdapter"
Cohesion: 0.25
Nodes (3): CodexHarnessAdapter, onceExit(), HARNESS_SCRIPT_PATH

### Community 102 - "Correction Workflow State"
Cohesion: 0.25
Nodes (8): Clean Correction Prompt State, Developer Correction Request State, Correction Workflow State, Session Workspace State, Follow-up Workflow State, Follow-up Session Workspace State, Demo Navigation State, Session Correction Request State

### Community 103 - "resolve"
Cohesion: 0.25
Nodes (8): findTopLevelEquality(), parensWrapWhole(), resolve(), resolvePath(), waitFor(), waitForReadiness(), waitForReadiness(), emitCommandWithAcknowledgement()

### Community 104 - "package.json"
Cohesion: 0.25
Nodes (7): name, private, scripts, build, lint, test, type

### Community 105 - "tool-readiness-panel.tsx"
Cohesion: 0.38
Nodes (6): checkLabels, statusTone(), ToolReadinessPanel(), ToolReadinessPanelProps, ToolReadinessRow(), DeveloperProjectReadiness

### Community 107 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): extends, include, src/**/*.ts, ../../tsconfig.base.json, ../../tests/packages/local-agent/**/*.ts

### Community 108 - "preview-server.mjs"
Cohesion: 0.33
Nodes (4): port, server, createAgentServer(), createAgentServer()

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

### Community 116 - "getReact"
Cohesion: 0.50
Nodes (5): evalDcLogic(), getReact(), walkFor(), walkText(), warnUnresolved()

### Community 117 - "ci-gates.test.ts"
Cohesion: 0.40
Nodes (3): repositoryRoot, rootPackageJson, workflowPath

### Community 119 - "01 Fixed — Nimbus Trial Button Fix Preview"
Cohesion: 0.50
Nodes (4): 01 Clean — Blank Nimbus Landing Preview, 01 Fixed — Nimbus Trial Button Fix Preview, 02 Clean — Blank Nimbus Landing Preview, 02 Fixed — Nimbus Trial Button Fix Preview

### Community 122 - "01 Flow — PM Shared Projects Dashboard"
Cohesion: 0.67
Nodes (3): 01 Dev — Developer Shared Projects Dashboard, 01 Flow — PM Shared Projects Dashboard, 02 Flow — PM Shared Projects Dashboard

### Community 123 - "01 Session 2 — Responsive Fix Session Workspace"
Cohesion: 0.67
Nodes (3): 01 Session 2 — Responsive Fix Session Workspace, 01 Session 3 — Responsive Fix Session Workspace, 02 Dev — Responsive Fix Session Workspace

## Knowledge Gaps
- **458 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+453 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **59 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `resolve()` connect `resolve` to `agent-config.ts`, `session-runner.integration.test.ts`, `codex-harness.adapter.ts`, `support.js`, `getReact`, `walk`, `AgentHarnessPort`, `createRuntime`, `AppModule`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `DatabaseClient` connect `DatabaseClient` to `create-draft-review-request.use-case.ts`, `index.ts`, `index.ts`, `persistence.module.ts`, `PairDockUser`, `json-parsers.ts`, `mvp-flow.e2e.test.ts`, `agent-events.repository.ts`, `external-identities.repository.ts`, `ReviewRequestsRepository`, `tool-readiness.integration.test.ts`, `agent-registrations.repository.ts`, `mappers.ts`, `ProjectMembersRepository`, `test-json.ts`, `SessionMember`, `AppModule`, `source-control-connections.repository.ts`, `ui-gateway.browser-auth.integration.test.ts`, `validation.integration.test.ts`, `shared-projects.integration.test.ts`, `pm-session-start.integration.test.ts`, `session-prompts.integration.test.ts`, `agent-command-routing.integration.test.ts`, `agent-gateway.integration.test.ts`, `persistence.integration.test.ts`, `auth.integration.test.ts`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `SourceControlPort` connect `SourceControlPort` to `create-draft-review-request.use-case.ts`, `github-source-control.adapter.ts`, `sessions.service.ts`, `index.ts`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `AppModule` (e.g. with `bootstrap()` and `startApplication()`) actually correct?**
  _`AppModule` has 16 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _465 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agent-config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0649692712906058 - nodes in this community are weakly interconnected._
- **Should `create-draft-review-request.use-case.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10195035460992907 - nodes in this community are weakly interconnected._