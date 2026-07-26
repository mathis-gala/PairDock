# Graph Report - PairDock  (2026-07-26)

## Corpus Check
- 299 files · ~134,956 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2769 nodes · 6012 edges · 174 communities (153 shown, 21 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5a40d871`
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
- codex-model-catalog.ts
- DatabaseClient
- example-project.integration.test.ts
- AgentClient
- test-json.ts
- SessionsService
- AuthenticatedRequest
- SessionsService
- PRD — PairDock MVP
- slack-pm-identity.adapter.ts
- dependencies
- Backend NestJS modules
- include
- scripts
- AgentAuthenticationService
- source-control-connections.repository.ts
- use-app-route.ts
- compilerOptions
- session-access.guard.ts
- json-parsers.ts
- Product
- dependencies
- developer-project-form.tsx
- V1 developer setup
- ui-gateway.browser-auth.integration.test.ts
- external-identities.repository.ts
- ToolReadinessService
- pm-activity-page.tsx
- commands.ts
- package.json
- validation.integration.test.ts
- shared-projects.integration.test.ts
- mappers.ts
- session-prompt.service.ts
- auth.service.ts
- AgentCommandEnvelope
- BT-050 — Same-email cross-role accounts remain independent
- Screens represented
- .create
- .authenticateDeveloper
- agent-command-routing.integration.test.ts
- agent-gateway.integration.test.ts
- AgentCommandEnvelope
- package.json
- createRuntime
- PairDock Interactive Prototype
- auth.integration.test.ts
- persistence.boundaries.test.ts
- tsconfig.json
- SessionRegistry
- package.json
- HealthController
- Correction Workflow State
- resolve
- package.json
- HealthController
- developer-project-form.tsx
- tsconfig.json
- persistence.integration.test.ts
- auth.service.ts
- AgentEventEnvelope
- Q: Trace all suggested graph questions using documentation only
- tsconfig.json
- GithubSourceControlAdapter
- tsconfig.json
- PairDock collaborative developer/PM prototype
- SourceControlPort
- ci-gates.test.ts
- main.tsx
- 01 Fixed — Nimbus Trial Button Fix Preview
- SourceControlPort
- walk
- 01 Flow — PM Shared Projects Dashboard
- 01 Session 2 — Responsive Fix Session Workspace
- GithubSourceControlAdapter
- agent-prompt-command.integration.test.ts
- dependencies
- @nestjs/websockets
- AGENTS.md
- migration.sql
- review-requests.repository.ts
- prisma.config.ts
- 01 Session — Blank Capture
- 02 Session 2 — Responsive Fix Session Workspace
- Containers
- deployment.test.ts
- SessionMembersRepositoryAdapter
- vite-env.d.ts
- vite.config.ts
- Automated Full MVP Flow
- validation.integration.test.ts
- pm-activity-page.tsx
- tool-readiness.service.ts
- @nestjs/common
- Get
- boot
- package.json
- SharedProjectSummary
- Deployment security audit — 2026-07-19
- development-pm-auth.ts
- .constructor
- ui.ts
- @pairdock/shared-contracts
- MVP E2E scenario
- Q: Trace all suggested graph questions using documentation only
- ValidationService
- PairDock collaborative developer/PM prototype
- Frontend product surfaces
- @nestjs/platform-socket.io
- createRuntime
- Containers
- tool-readiness-panel.tsx
- getReact
- ReadyPreviewTunnelPort
- @nestjs/common
- session-access.guard.ts
- agent-client.integration.test.ts
- session-history.integration.test.ts
- Prototype Reference Package

## God Nodes (most connected - your core abstractions)
1. `PairDockIdentity` - 51 edges
2. `Behavior test plan — PairDock MVP` - 51 edges
3. `parseJsonResponse()` - 46 edges
4. `SandboxRef` - 45 edges
5. `DatabaseClient` - 41 edges
6. `Session` - 39 edges
7. `SessionRunner` - 39 edges
8. `AppModule` - 36 edges
9. `AgentClient` - 36 edges
10. `Project` - 34 edges

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

## Communities (174 total, 21 thin omitted)

### Community 0 - "agent-config.ts"
Cohesion: 0.16
Nodes (21): agentConfigFileSchema, agentHarnessConfigSchema, agentModelConfigSchema, agentProjectDescriptorSchema, assertHttpUrlTemplate(), assertLoopbackPortMapping(), assertLoopbackUrlTemplate(), assertSafeContainerImage() (+13 more)

### Community 1 - "create-draft-review-request.use-case.ts"
Cohesion: 0.06
Nodes (22): SandboxPort, SandboxRef, SandboxStartInput, execFileAsync, HostPreviewRuntimeAdapter, HostPreviewRuntimeDependencies, HostSpawnOptions, isProcessGroupOwned() (+14 more)

### Community 2 - "Button"
Cohesion: 0.04
Nodes (51): Behavior test plan — PairDock MVP, BT-001 — Installable workspace, BT-002 — Session creation is persisted, BT-003 — Agent event is persisted, BT-004 — PM member access is allowed, BT-005 — Non-member access is denied, BT-006 — Valid session transitions, BT-007 — Invalid transition is rejected (+43 more)

### Community 3 - "events.ts"
Cohesion: 0.11
Nodes (16): AgentCancelCommandEnvelope, agentCancelCommandEnvelopeSchema, AgentCommandEnvelope, AgentPromptCommandEnvelope, agentPromptCommandEnvelopeSchema, ChecksRunCommandEnvelope, checksRunCommandEnvelopeSchema, GitGetDiffCommandEnvelope (+8 more)

### Community 4 - "index.ts"
Cohesion: 0.08
Nodes (27): agentCommandEnvelopeSchema, checkResultSchema, envelopeBaseSchema, isoDateTimeSchema, promptableSessionStatuses, sessionEnvelope(), SessionStatus, sessionStatusSchema (+19 more)

### Community 5 - "index.ts"
Cohesion: 0.18
Nodes (7): mapSession(), SessionsRepositoryAdapter, Inject, Injectable, CreateSessionInput, buildSessionCloseCommand(), Session

### Community 6 - "developer-home-page.tsx"
Cohesion: 0.10
Nodes (17): authApi, DeveloperLoginCard(), PmLoginCard(), PmLoginCardProps, GitHubIcon(), Button(), PromptComposerProps, ProductShell() (+9 more)

### Community 7 - "app-shell.tsx"
Cohesion: 0.10
Nodes (19): assertSafeContainerImage(), buildContainerHardeningArgs(), buildDockerRunArgs(), buildManagedResourceLabels(), buildNodeModulesTmpfsArg(), DockerSandboxAdapter, DockerSandboxAdapterDependencies, findNodeModulesPaths() (+11 more)

### Community 8 - "SandboxRef"
Cohesion: 0.10
Nodes (20): Architecture style, Current repository context, Dependency rules, Diagram links, External ports/adapters, Frontend styling, Local agent structure, Login interface (+12 more)

### Community 9 - "persistence.module.ts"
Cohesion: 0.13
Nodes (25): AgentGatewayModule, Module, AuthModule, Module, InvitationsModule, Module, PersistenceModule, Module (+17 more)

### Community 10 - "PairDockUser"
Cohesion: 0.14
Nodes (10): mapUser(), Inject, Injectable, UsersRepositoryAdapter, CreateUserInput, UsersRepository, Inject, Injectable (+2 more)

### Community 11 - "client.ts"
Cohesion: 0.20
Nodes (10): createApiClient(), useSharedSessionHistory(), filterSharedSessionHistory(), SessionHistoryFilters, SessionHistoryStatusFilter, PmActivityPage(), PmActivityPageProps, SESSION_STATUS_FILTER_OPTIONS (+2 more)

### Community 12 - "sessions.service.ts"
Cohesion: 0.17
Nodes (6): Inject, AuthService, buildFrontendAuthRedirectUrl(), readOAuthStartUrlConfig(), Inject, Injectable

### Community 13 - "session.ts"
Cohesion: 0.08
Nodes (19): ApiClient, authHeaders(), AuthProviders, authProvidersSchema, CreateSessionInput, jsonHeaders(), RequestOptions, responseErrorSchema (+11 more)

### Community 14 - "scripts"
Cohesion: 0.05
Nodes (36): @biomejs/biome, apps/*, packages/*, tsx, @types/node, typescript, devDependencies, @biomejs/biome (+28 more)

### Community 15 - "ConnectedAgentsRegistry"
Cohesion: 0.33
Nodes (6): mapMessage(), MessagesRepositoryAdapter, Injectable, CreateMessageInput, MessagesRepository, SessionMessage

### Community 16 - "PairDockIdentity"
Cohesion: 0.16
Nodes (7): isRecord(), ProjectsService, resolveUnavailableReason(), Injectable, PairDockIdentity, CreateDeveloperProjectInput, DeveloperProjectSummary

### Community 17 - "AuthService"
Cohesion: 0.25
Nodes (15): assertStateCookie(), AuthCallbackBody, AuthController, clearStateCookie(), HeaderResponse, readCookie(), readStateFromRedirectUrl(), secureCookieSuffix() (+7 more)

### Community 18 - "ProjectPreviewConfig"
Cohesion: 0.19
Nodes (6): buildAgentCancelCommand(), buildAgentPromptCommand(), SessionPromptService, Injectable, Inject, buildSessionPrepareCommand()

### Community 19 - "support.js"
Cohesion: 0.11
Nodes (15): boot(), compileTemplate(), dcNameFromPath(), encodeCase(), getReactDOM(), init(), isElementClass(), isRenderableType() (+7 more)

### Community 20 - "json-parsers.ts"
Cohesion: 0.08
Nodes (12): PreviewTunnelPort, createTempRepository(), execFileAsync, execGit(), prisma, ReadyPreviewTunnelPort, startApplication(), createTempRepository() (+4 more)

### Community 21 - "pm-session-page.tsx"
Cohesion: 0.11
Nodes (18): Implementation handoff — PairDock MVP, T01 — Monorepo and shared contracts, T02 — Prisma persistence foundation, T03 — Auth and session permissions, T04 — Backend session lifecycle, T05 — Backend ↔ agent WebSocket, T06 — Local agent: config, login, connection, T07 — Local agent: worktree and cleanup (+10 more)

### Community 22 - "includes"
Cohesion: 0.08
Nodes (24): files, includes, formatter, enabled, indentStyle, lineWidth, quoteStyle, semicolons (+16 more)

### Community 23 - "package.json"
Cohesion: 0.08
Nodes (24): bin, pairdock-agent, dependencies, @pairdock/shared-contracts, socket.io-client, yaml, zod, devDependencies (+16 more)

### Community 24 - "readiness-runner.ts"
Cohesion: 0.19
Nodes (15): ProjectChecksConfig, CommandResult, CommandRunner, failed(), failureMessage(), isCodexExecutable(), passed(), ReadinessResult (+7 more)

### Community 25 - "agent-client.ts"
Cohesion: 0.10
Nodes (34): AgentExecutionCapabilitiesService, SessionExecutionSelection, Injectable, InvitationsService, Injectable, AGENT_EVENTS_REPOSITORY, AGENT_REGISTRATIONS_REPOSITORY, EXTERNAL_IDENTITIES_REPOSITORY (+26 more)

### Community 26 - "github-source-control.adapter.ts"
Cohesion: 0.14
Nodes (15): readGithubConfig(), readSlackConfig(), areIdentityFixturesEnabled(), base64UrlEncode(), createGithubAppJwt(), deterministicReviewRequestNumber(), Fetcher, GithubBranchResponse (+7 more)

### Community 27 - "package.json"
Cohesion: 0.08
Nodes (23): tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, devDependencies, tailwindcss, @tailwindcss/vite, @types/react (+15 more)

### Community 28 - "mvp-flow.e2e.test.ts"
Cohesion: 0.13
Nodes (16): authenticateDeveloper(), authenticatePm(), closeSession(), createDeveloperProject(), createReviewRequest(), createSession(), createTestRepository(), EXAMPLE_REPOSITORY_FIXTURE (+8 more)

### Community 29 - "AuthTokenService"
Cohesion: 0.19
Nodes (10): AuthTokenOptions, AuthTokenService, hasValidSignature(), isRecord(), isUserKind(), parseTokenPayload(), resolveSecret(), TokenPayload (+2 more)

### Community 30 - "github-developer-identity.adapter.ts"
Cohesion: 0.22
Nodes (9): findTopLevelEquality(), parensWrapWhole(), resolve(), resolvePath(), waitFor(), waitForReadiness(), waitForReadiness(), waitFor() (+1 more)

### Community 31 - "agent-events.repository.ts"
Cohesion: 0.14
Nodes (10): CheckCommandExecutor, CheckResult, ChecksResult, ChecksRunner, isTransientPackageExtractionFailure(), RunChecksInput, compactValidationLogs(), RecordingChecksRunner (+2 more)

### Community 32 - "external-identities.repository.ts"
Cohesion: 0.14
Nodes (14): Fetcher, GithubDeveloperIdentityAdapter, GithubDeveloperIdentityConfig, GithubEmailResponse, githubHeaders(), GithubInstallationMetadata, GithubInstallationsResponse, GithubOAuthResponse (+6 more)

### Community 33 - "slack-pm-identity.adapter.ts"
Cohesion: 0.11
Nodes (9): AgentHarnessPort, RunPromptInput, SimulatedAgentHarness, AlwaysChangingHarnessPort, CancellableHarnessPort, InitialChangeOnlyHarnessPort, MutatingHarnessPort, RecordingHarnessPort (+1 more)

### Community 34 - "WorktreeService"
Cohesion: 0.16
Nodes (11): isLifecycleProgressStatus(), toSessionAgentEvent(), DiffService, isSessionDiffPayload(), SessionDiffView, AgentEventsRepository, UpsertProjectReadinessInput, SourceControlProvider (+3 more)

### Community 35 - "sessions.controller.ts"
Cohesion: 0.11
Nodes (20): buildPrepareRunArgs(), createDependencyCacheKey(), createMissingMountpoints(), DockerCommandResult, DockerDependencyPrewarmer, DockerDependencyPrewarmerDependencies, DockerDependencyPrewarmerLogger, errorMessage() (+12 more)

### Community 36 - "DatabaseExecutor"
Cohesion: 0.08
Nodes (27): Inject, PersistenceUnitOfWorkAdapter, Injectable, PersistenceRepositories, PersistenceUnitOfWork, ProjectMembersRepository, ProjectReadinessRepository, SessionMembersRepository (+19 more)

### Community 37 - "ReviewRequestsRepository"
Cohesion: 0.10
Nodes (12): PreparedWorktree, DEFAULT_SESSION_STATE_PATH, FileSessionWorkspaceStore, isMissingFileError(), metadataSchema, stateSchema, toPersistedWorkspace(), workspaceSchema (+4 more)

### Community 38 - "SessionsController"
Cohesion: 0.13
Nodes (18): AgentProjectDescriptor, CommandResult, containerImageSchema, enrichConfigWithProjectManifests(), healthcheckUrlTemplateSchema, isLoopbackPortMappingTemplate(), isValidPort(), loadProjectManifest() (+10 more)

### Community 39 - "ToolReadinessService"
Cohesion: 0.13
Nodes (27): buildValidationRepairPrompt(), hasRepairableCheckFailure(), isRetryableError(), AgentEventEnvelopeInput, buildAgentConnectedEvent(), buildAgentDoneEvent(), buildAgentOutputEvent(), buildChecksResultEvent() (+19 more)

### Community 40 - "Implementation handoff — PairDock MVP"
Cohesion: 0.23
Nodes (10): SessionsController, Body, Controller, Get, HttpCode, Param, Post, Req (+2 more)

### Community 41 - "docker-sandbox.adapter.ts"
Cohesion: 0.16
Nodes (15): assertSafeContainerImage(), buildCloudflareDockerArgs(), buildTunnelContainerName(), CloudflarePreviewTunnelAdapter, CloudflarePreviewTunnelDependencies, ManagedTunnelProcess, onceExit(), resolveRestoredTunnelContainerName() (+7 more)

### Community 42 - "session-runner.ts"
Cohesion: 0.13
Nodes (12): buildHostCommandEnvironment(), HostCheckCommandExecutor, HostCheckCommandExecutorDependencies, HostCheckCommandInput, HostCheckCommandRunner, HostCommandSpawnOptions, SAFE_HOST_COMMAND_ENVIRONMENT_KEYS, appendLogs() (+4 more)

### Community 43 - "ui.ts"
Cohesion: 0.27
Nodes (7): ShareDeveloperProjectInput, UpdateExecutionDefaultsInput, useDeveloperProjects(), DeveloperHomePage(), DeveloperHomePageProps, ErrorCardProps, UpdateProjectExecutionDefaultsInput

### Community 44 - "tool-readiness.integration.test.ts"
Cohesion: 0.52
Nodes (4): Body, HttpCode, Post, AuthResult

### Community 45 - "tool-readiness-panel.tsx"
Cohesion: 0.12
Nodes (15): Actors, Assumptions, Fixed constraints, Functional requirements, Goals, Handoff summary, Non-functional requirements, Non-goals for MVP (+7 more)

### Community 46 - "session-details.integration.test.ts"
Cohesion: 0.21
Nodes (7): branchExists(), execFileAsync, execGit(), pathExists(), remoteExists(), WorktreeService, BlockingPushWorktreeService

### Community 47 - "diff.service.ts"
Cohesion: 0.10
Nodes (17): DeveloperProjectCard(), DeveloperProjectCardProps, ProjectFactProps, ProjectShareForm(), ProjectShareFormProps, SessionControlCard(), SessionControlCardProps, checkLabels (+9 more)

### Community 48 - "command-handling.integration.test.ts"
Cohesion: 0.08
Nodes (12): HealthcheckService, HealthcheckTimeoutError, HealthcheckWaitInput, HealthcheckResult, createTempRepository(), execFileAsync, execGit(), FailOnceClosePreviewTunnelPort (+4 more)

### Community 49 - "codex-model-catalog.ts"
Cohesion: 0.17
Nodes (15): AgentConfig, AgentModelConfig, applyCodexCommandToProjects(), CodexCatalogOptions, CodexInstallation, codexModelCacheSchema, codexModelSchema, codexReasoningLevelSchema (+7 more)

### Community 50 - "DatabaseClient"
Cohesion: 0.29
Nodes (4): port, server, createAgentServer(), createAgentServer()

### Community 51 - "example-project.integration.test.ts"
Cohesion: 0.13
Nodes (17): AgentHarnessEvent, ProjectAgentHarnessConfig, AgentHarnessEventQueue, buildCodexPrompt(), buildCodexSecurityArgs(), buildCommandArgs(), buildHarnessEnvironment(), CodexHarnessAdapter (+9 more)

### Community 52 - "AgentClient"
Cohesion: 0.21
Nodes (3): allocateHostPort(), AgentClient, AgentClientLogger

### Community 53 - "test-json.ts"
Cohesion: 0.20
Nodes (5): authenticateDeveloper(), authenticatePm(), createDeveloperProject(), prisma, startApplication()

### Community 54 - "SessionsService"
Cohesion: 0.12
Nodes (15): authenticateDeveloper(), authenticatePm(), prisma, startApplication(), authenticatePm(), prisma, authenticateDeveloper(), prisma (+7 more)

### Community 55 - "AuthenticatedRequest"
Cohesion: 0.16
Nodes (15): AgentEventsRepositoryAdapter, Injectable, isToolReadinessKey(), isToolReadinessStatus(), parseJsonObject(), parseToolReadinessCheck(), parseToolReadinessChecks(), serializeJsonValue() (+7 more)

### Community 56 - "SessionsService"
Cohesion: 0.07
Nodes (28): requestJson(), PreviewAreaSize, PreviewFrame(), PreviewFrameProps, PreviewToolbar(), PreviewToolbarProps, PromptComposer(), ReviewRequestDialog() (+20 more)

### Community 57 - "PRD — PairDock MVP"
Cohesion: 0.12
Nodes (16): scripts, build, db:migrate, db:migrate:dev, db:migrate:test, db:reset, db:seed:pm-demo, db:status (+8 more)

### Community 58 - "slack-pm-identity.adapter.ts"
Cohesion: 0.15
Nodes (11): Fetcher, parseFixtureIdentity(), SlackAuthTestResponse, slackHeaders(), SlackOAuthResponse, SlackPmIdentityAdapter, SlackPmIdentityConfig, SlackUserInfoResponse (+3 more)

### Community 59 - "dependencies"
Cohesion: 0.13
Nodes (15): @pairdock/shared-contracts, socket.io, @nestjs/common, @nestjs/core, @nestjs/websockets, @prisma/adapter-pg, @prisma/client, dependencies (+7 more)

### Community 60 - "Backend NestJS modules"
Cohesion: 0.21
Nodes (6): mapSessionMember(), SessionMembersRepositoryAdapter, Injectable, AddSessionMemberInput, CreatePromptRequest, SessionMember

### Community 61 - "include"
Cohesion: 0.13
Nodes (14): compilerOptions, jsx, lib, extends, include, src/**/*.ts, ../../tsconfig.base.json, DOM (+6 more)

### Community 62 - "scripts"
Cohesion: 0.12
Nodes (17): AgentGatewayModule, AuditLogModule, AuthModule, Backend NestJS modules, DiffModule, GithubModule, InvitationsModule, PersistenceModule (+9 more)

### Community 63 - "AgentAuthenticationService"
Cohesion: 0.16
Nodes (12): boundRenderedDiff(), ChangedFile, CollectedDiff, DiffService, DiffSnapshot, execGitText(), GitOutput, normalizeStatusPath() (+4 more)

### Community 64 - "source-control-connections.repository.ts"
Cohesion: 0.13
Nodes (15): AgentCommandRouterService, Inject, Injectable, SESSIONS_REPOSITORY, SessionsRepository, SessionCloseService, Inject, Injectable (+7 more)

### Community 65 - "use-app-route.ts"
Cohesion: 0.14
Nodes (21): AppShell(), getAppRouteSnapshot(), loginRoute, openDeveloperHome(), openLogin(), openPmDashboard(), openPmReviewRequests(), openPmSession() (+13 more)

### Community 66 - "compilerOptions"
Cohesion: 0.14
Nodes (13): node, compilerOptions, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, noEmit (+5 more)

### Community 67 - "session-access.guard.ts"
Cohesion: 0.33
Nodes (13): "agent_events", "agent_registrations", "external_identities", "github_installations", "messages", "project_members", "project_readiness_snapshots", "projects" (+5 more)

### Community 68 - "json-parsers.ts"
Cohesion: 0.11
Nodes (15): mapSourceControlConnection(), SourceControlConnectionsRepositoryAdapter, Injectable, CreateSourceControlConnectionInput, SourceControlConnection, agentEvents, externalIdentities, prisma (+7 more)

### Community 69 - "Product"
Cohesion: 0.21
Nodes (10): BrandIconProps, GitMergeIcon(), GitPullRequestClosedIcon(), GitPullRequestIcon(), SlackIcon(), PullRequestStatusLink(), resolvePullRequestLabel(), resolvePullRequestState() (+2 more)

### Community 70 - "dependencies"
Cohesion: 0.17
Nodes (6): authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication(), sessionPromptResponseSchema

### Community 71 - "developer-project-form.tsx"
Cohesion: 0.18
Nodes (9): ProjectPreviewConfig, errorMessage(), SessionCloseResult, SessionRecoveryResult, SessionRunner, SessionRunnerConfig, GitPushBranchCommandEnvelope, SessionCloseCommandEnvelope (+1 more)

### Community 72 - "V1 developer setup"
Cohesion: 0.14
Nodes (13): 1. GitHub App, 2. Slack App, 3. Start PairDock, 4. Cloudflare Tunnel, 5. Add `pairdock.yml`, 6. Configure the local agent, 7. Create a PairDock project, Commands (+5 more)

### Community 73 - "ui-gateway.browser-auth.integration.test.ts"
Cohesion: 0.15
Nodes (6): sessionIdResponseSchema, authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication()

### Community 74 - "external-identities.repository.ts"
Cohesion: 0.24
Nodes (7): ExternalIdentitiesRepositoryAdapter, Injectable, serializeJsonObject(), mapExternalIdentity(), CreateExternalIdentityInput, ExternalIdentitiesRepository, ExternalIdentity

### Community 75 - "ToolReadinessService"
Cohesion: 0.16
Nodes (12): ToolReadinessController, Controller, Get, HttpCode, Inject, Param, Post, Req (+4 more)

### Community 76 - "pm-activity-page.tsx"
Cohesion: 0.08
Nodes (22): ButtonProps, ButtonVariant, variantClasses, ConnectionActivityRail(), ConnectionActivityRailProps, RailMetricProps, DropdownMenuField(), DropdownMenuFieldProps (+14 more)

### Community 77 - "commands.ts"
Cohesion: 0.23
Nodes (6): ConnectedSocket, MessageBody, SubscribeMessage, BackendEventRejectedError, AgentEventEnvelope, ErrorEventEnvelope

### Community 78 - "package.json"
Cohesion: 0.17
Nodes (11): dependencies, zod, exports, zod, name, private, scripts, build (+3 more)

### Community 79 - "validation.integration.test.ts"
Cohesion: 0.24
Nodes (7): announceAgent(), authenticatePm(), prisma, publishReadiness(), sendAgentEvent(), startApplication(), waitForConnect()

### Community 80 - "shared-projects.integration.test.ts"
Cohesion: 0.21
Nodes (8): announceAgent(), authenticatePm(), prisma, publishReadiness(), sendAgentEvent(), startApplication(), waitForConnect(), sharedProjectListResponseSchema

### Community 81 - "mappers.ts"
Cohesion: 0.23
Nodes (7): CreateValidationRunInput, SessionValidationView, toValidationView(), Inject, Injectable, ValidationService, ChecksResultEventEnvelope

### Community 82 - "session-prompt.service.ts"
Cohesion: 0.24
Nodes (11): DEVELOPMENT_PM, main(), assertLocalDevelopmentSeedTarget(), buildPmDemoSessions(), demoDiff(), deterministicUuid(), passingValidation(), PmDemoMessage (+3 more)

### Community 83 - "auth.service.ts"
Cohesion: 0.21
Nodes (11): AgentRegistrationsRepositoryAdapter, isRecord(), mapAgentRegistration(), parseModels(), parseProjects(), parseStringArray(), Inject, Injectable (+3 more)

### Community 84 - "AgentCommandEnvelope"
Cohesion: 0.28
Nodes (14): loadAgentConfig(), resolveAgentConfigPath(), saveAgentConfig(), summarizeAgentConfig(), main(), parseModelMapping(), parseModelMappings(), parseProjectMapping() (+6 more)

### Community 85 - "BT-050 — Same-email cross-role accounts remain independent"
Cohesion: 0.25
Nodes (11): AuthenticatedRequest, ProjectsController, Body, Controller, Get, Inject, Param, Post (+3 more)

### Community 86 - "Screens represented"
Cohesion: 0.18
Nodes (10): Architecture documents reconciled, Developer dashboard, Implementation guidance, Login, PM shared-project dashboard, Prototype notes — PairDock collaborative developer/PM, Purpose, Running/fixed/review states (+2 more)

### Community 87 - ".create"
Cohesion: 0.22
Nodes (8): exports, name, private, scripts, build, typecheck, type, version

### Community 88 - ".authenticateDeveloper"
Cohesion: 0.30
Nodes (10): asRecord(), buildSessionConversation(), extractErrorMessage(), humanizeAgentError(), mergeAdjacentAgentOutput(), promoteFinalAgentMessages(), toConversationEvent(), checksResultPayloadSchema (+2 more)

### Community 89 - "agent-command-routing.integration.test.ts"
Cohesion: 0.07
Nodes (20): Inject, AgentGateway, isCommandAcknowledgement(), Inject, Injectable, WebSocketGateway, WebSocketServer, AgentProjectBindingService (+12 more)

### Community 90 - "agent-gateway.integration.test.ts"
Cohesion: 0.17
Nodes (5): authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication()

### Community 91 - "AgentCommandEnvelope"
Cohesion: 0.16
Nodes (11): AGENT_AUTHENTICATION_OPTIONS, AgentAuthenticationOptions, AgentAuthenticationService, AgentCredentialInput, AuthenticatedAgentPrincipal, extractBearerToken(), isRecord(), parseCredentials() (+3 more)

### Community 92 - "package.json"
Cohesion: 0.20
Nodes (9): socket.io-client, prisma, devDependencies, prisma, socket.io-client, name, private, type (+1 more)

### Community 94 - "createRuntime"
Cohesion: 0.12
Nodes (9): isInsideSensitiveDirectory(), normalizeRelativePath(), SensitiveFilesPolicy, createTempRepository(), execFileAsync, execGit(), FailingClosePreviewTunnelPort, FakeHostCommandExecutor (+1 more)

### Community 95 - "PairDock Interactive Prototype"
Cohesion: 0.13
Nodes (12): assertInstallationId(), GithubAuthStateOptions, GithubAuthStatePayload, GithubAuthStatePurpose, GithubAuthStateService, hasValidSignature(), invalidState(), isInstallationId() (+4 more)

### Community 96 - "auth.integration.test.ts"
Cohesion: 0.22
Nodes (6): announceAgent(), authenticateDeveloper(), authenticatePm(), prisma, startApplication(), waitForConnect()

### Community 97 - "persistence.boundaries.test.ts"
Cohesion: 0.20
Nodes (8): apiSourceRoot, cwd, domainContractFile, generatedPrismaRoot, persistenceAdapterRoot, persistencePortRoot, persistenceRoot, persistenceSurfaceFiles

### Community 98 - "tsconfig.json"
Cohesion: 0.22
Nodes (8): compilerOptions, emitDecoratorMetadata, experimentalDecorators, extends, include, src/**/*.ts, ../../tsconfig.base.json, ../../tests/apps/api/**/*.ts

### Community 99 - "SessionRegistry"
Cohesion: 0.18
Nodes (7): allowedProgressTransitions, interruptedOperationStatuses, interruptedPreparationStatuses, InvalidSessionTransitionError, NoChangesResumeStatus, ProgressStatus, SessionStateMachine

### Community 100 - "package.json"
Cohesion: 0.22
Nodes (8): Accessibility & Inclusion, Anti-references, Brand Personality, Design Principles, Product, Product Purpose, Register, Users

### Community 101 - "HealthController"
Cohesion: 0.33
Nodes (4): createFakeGithubServer(), githubInstallations, json(), previousEnv

### Community 102 - "Correction Workflow State"
Cohesion: 0.25
Nodes (8): Clean Correction Prompt State, Developer Correction Request State, Correction Workflow State, Session Workspace State, Follow-up Workflow State, Follow-up Session Workspace State, Demo Navigation State, Session Correction Request State

### Community 103 - "resolve"
Cohesion: 0.15
Nodes (5): AgentConnectedEventEnvelope, RecordedHandshake, RecordingRestoreSessionRunner, SessionRunnerWithRecoveredWorkspace, SessionRunnerWithRecoveryFailure

### Community 104 - "package.json"
Cohesion: 0.19
Nodes (8): ConnectedSocket, Inject, Injectable, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, UiGateway

### Community 105 - "HealthController"
Cohesion: 0.33
Nodes (3): ReviewRequestsRepository, ReviewRequestRecord, InMemoryReviewRequestsRepository

### Community 106 - "developer-project-form.tsx"
Cohesion: 0.17
Nodes (11): AgentProjectOption, DeveloperProjectForm(), DeveloperProjectFormProps, ProjectFormState, ProjectSetupStateProps, resolveModelOptions(), ExecutionSelection, ExecutionSelectionProps (+3 more)

### Community 107 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): extends, include, src/**/*.ts, ../../tsconfig.base.json, ../../tests/packages/local-agent/**/*.ts

### Community 108 - "persistence.integration.test.ts"
Cohesion: 0.12
Nodes (12): currentDirectory, databaseTargetEnvironment, createPersistenceRepositories(), Inject, buildAdapter(), currentDirectory, DatabaseClient, Injectable (+4 more)

### Community 109 - "auth.service.ts"
Cohesion: 0.20
Nodes (8): AuthProvider, AuthProviders, hasAccessibleGithubInstallation(), OAuthStartUrlConfig, DEVELOPER_IDENTITY_PORT, PM_IDENTITY_PORT, AuthEnvironment, isDevelopmentPmAuthEnabled()

### Community 110 - "AgentEventEnvelope"
Cohesion: 0.16
Nodes (10): isExternalIdentityProvider(), isProjectMembershipRole(), mapProjectMembership(), parseExternalIdentityProvider(), parseProjectMembershipRole(), ProjectMembersRepositoryAdapter, Inject, Injectable (+2 more)

### Community 112 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 113 - "GithubSourceControlAdapter"
Cohesion: 0.27
Nodes (4): AuthenticatedUserGuard, Inject, Injectable, RequireAuth()

### Community 114 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 115 - "PairDock collaborative developer/PM prototype"
Cohesion: 0.25
Nodes (7): name, private, scripts, build, lint, test, type

### Community 116 - "SourceControlPort"
Cohesion: 0.25
Nodes (7): Deploy, update, or roll back, Deployment environment, Local developer agent and previews, One-time server setup, PairDock production deployment, Release images, Security before exposing PairDock

### Community 117 - "ci-gates.test.ts"
Cohesion: 0.40
Nodes (3): repositoryRoot, rootPackageJson, workflowPath

### Community 118 - "main.tsx"
Cohesion: 0.33
Nodes (4): queryClient, rootElement, LoginPage(), renderLoginPage()

### Community 119 - "01 Fixed — Nimbus Trial Button Fix Preview"
Cohesion: 0.50
Nodes (4): 01 Clean — Blank Nimbus Landing Preview, 01 Fixed — Nimbus Trial Button Fix Preview, 02 Clean — Blank Nimbus Landing Preview, 02 Fixed — Nimbus Trial Button Fix Preview

### Community 121 - "walk"
Cohesion: 0.38
Nodes (12): collectProps(), compileAttr(), cssToObj(), hostPositionStyle(), kebabToCamel(), walk(), walkChildren(), walkComponent() (+4 more)

### Community 122 - "01 Flow — PM Shared Projects Dashboard"
Cohesion: 0.67
Nodes (3): 01 Dev — Developer Shared Projects Dashboard, 01 Flow — PM Shared Projects Dashboard, 02 Flow — PM Shared Projects Dashboard

### Community 123 - "01 Session 2 — Responsive Fix Session Workspace"
Cohesion: 0.67
Nodes (3): 01 Session 2 — Responsive Fix Session Workspace, 01 Session 3 — Responsive Fix Session Workspace, 02 Dev — Responsive Fix Session Workspace

### Community 124 - "GithubSourceControlAdapter"
Cohesion: 0.42
Nodes (4): githubHeaders(), GithubSourceControlAdapter, isTestConnection(), Injectable

### Community 125 - "agent-prompt-command.integration.test.ts"
Cohesion: 0.11
Nodes (9): buildPrepareCommand(), createManagedWorktreeRoot(), createPreparedValidationFeedbackClient(), createTempRepository(), execFileAsync, execGit(), ReadyPreviewTunnelPort, ReadySandboxPort (+1 more)

### Community 126 - "dependencies"
Cohesion: 0.15
Nodes (13): @pairdock/shared-contracts, socket.io-client, zod, react-dom, @tanstack/react-form, @tanstack/react-query, dependencies, @pairdock/shared-contracts (+5 more)

### Community 127 - "@nestjs/websockets"
Cohesion: 0.18
Nodes (9): AppModule, Module, bootstrap(), startApplication(), authenticatePm(), prisma, startApplication(), startApplication() (+1 more)

### Community 128 - "AGENTS.md"
Cohesion: 0.40
Nodes (4): Fixtures, MVP E2E scenario, Reproduce locally, What it proves

### Community 129 - "migration.sql"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Trace all suggested graph questions using documentation only, Source Nodes

### Community 130 - "review-requests.repository.ts"
Cohesion: 0.29
Nodes (5): mapReviewRequest(), ReviewRequestsRepositoryAdapter, Inject, Injectable, CreateReviewRequestInput

### Community 131 - "prisma.config.ts"
Cohesion: 0.30
Nodes (3): formatUserDisplayName(), SessionsService, Injectable

### Community 137 - "Containers"
Cohesion: 0.40
Nodes (4): Architectural interpretation, Contents, How to view, PairDock collaborative developer/PM prototype

### Community 139 - "SessionMembersRepositoryAdapter"
Cohesion: 0.33
Nodes (5): Deployment security audit — 2026-07-19, Operational requirements and residual risk, Resolved findings, Scope, Verification

### Community 143 - "validation.integration.test.ts"
Cohesion: 0.17
Nodes (4): authenticateDeveloper(), createSession(), prisma, startApplication()

### Community 144 - "pm-activity-page.tsx"
Cohesion: 0.47
Nodes (3): HealthController, Controller, Get

### Community 145 - "tool-readiness.service.ts"
Cohesion: 0.20
Nodes (7): serializeChecks(), serializeToolReadinessCheck(), mapProjectReadinessSnapshot(), ProjectReadinessRepositoryAdapter, Inject, Injectable, ProjectReadinessSnapshot

### Community 147 - "Get"
Cohesion: 0.18
Nodes (8): mapProject(), ProjectsRepositoryAdapter, Injectable, CreateProjectInput, DeveloperProjectRecord, ProjectsRepository, SharedProjectRecord, Project

### Community 148 - "boot"
Cohesion: 0.25
Nodes (12): normalizeAgentConfig(), normalizeAgentHarnessConfig(), normalizeAgentHarnessConfigs(), normalizeBackendUrl(), normalizeCapabilities(), normalizeChecksConfigs(), normalizeModels(), normalizeOptionalValue() (+4 more)

### Community 150 - "SharedProjectSummary"
Cohesion: 0.20
Nodes (11): SharedProjectCard(), SharedProjectCardProps, SessionStarted, StartPmSessionInput, useSharedProjects(), UseSharedProjectsResult, PmDashboardPage(), PmDashboardPageProps (+3 more)

### Community 154 - "ui.ts"
Cohesion: 0.09
Nodes (21): createDraftReviewRequestInputSchema, developerProjectReadinessSchema, developerProjectSessionSummarySchema, developerProjectSetupSchema, developerProjectSummaryListSchema, developerProjectSummarySchema, DeveloperSetupAgent, developerSetupAgentModelSchema (+13 more)

### Community 158 - "ValidationService"
Cohesion: 0.10
Nodes (11): Inject, Inject, mapValidationRun(), Inject, Inject, Inject, Inject, Inject (+3 more)

### Community 159 - "PairDock collaborative developer/PM prototype"
Cohesion: 0.40
Nodes (5): Agent → backend events, Backend → agent commands, Backend ↔ agent WebSocket contract, Common envelope, UI session-start contract

### Community 160 - "Frontend product surfaces"
Cohesion: 0.40
Nodes (5): Developer dashboard, Frontend product surfaces, Login, PM dashboard, Session workspace

### Community 162 - "createRuntime"
Cohesion: 0.29
Nodes (7): get(), createExternalModules(), createHelmetManager(), createPseudoSheet(), createRegistry(), createRuntime(), Placeholder()

### Community 164 - "tool-readiness-panel.tsx"
Cohesion: 0.19
Nodes (7): DockerOrphanReconcileInput, DockerOrphanReconciler, DockerOrphanReconcilerDependencies, execFileAsync, listManagedContainers(), ManagedDockerContainer, stopContainers()

### Community 165 - "getReact"
Cohesion: 0.29
Nodes (7): createComponentFactory(), evalDcLogic(), getReact(), walkText(), warnUnresolved(), react, react

### Community 168 - "session-access.guard.ts"
Cohesion: 0.29
Nodes (4): RequireSessionAccess(), SessionAccessGuard, Inject, Injectable

### Community 169 - "agent-client.integration.test.ts"
Cohesion: 0.25
Nodes (3): prisma, startApplication(), waitFor()

### Community 170 - "session-history.integration.test.ts"
Cohesion: 0.25
Nodes (5): authenticatePm(), prisma, startApplication(), sessionEventListResponseSchema, sessionMessageListResponseSchema

## Knowledge Gaps
- **617 isolated node(s):** `Workspace`, `Commands`, `1. GitHub App`, `2. Slack App`, `3. Start PairDock` (+612 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PairDockIdentity` connect `PairDockIdentity` to `source-control-connections.repository.ts`, `agent-command-routing.integration.test.ts`, `WorktreeService`, `prisma.config.ts`, `DatabaseExecutor`, `ToolReadinessService`, `tool-readiness.integration.test.ts`, `auth.service.ts`, `GithubSourceControlAdapter`, `BT-050 — Same-email cross-role accounts remain independent`, `agent-client.ts`, `Backend NestJS modules`, `AuthTokenService`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `resolve()` connect `github-developer-identity.adapter.ts` to `slack-pm-identity.adapter.ts`, `createRuntime`, `getReact`, `agent-client.integration.test.ts`, `command-handling.integration.test.ts`, `support.js`, `example-project.integration.test.ts`, `walk`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `ProjectPreviewConfig` connect `developer-project-form.tsx` to `agent-config.ts`, `create-draft-review-request.use-case.ts`, `sessions.controller.ts`, `SessionsController`, `app-shell.tsx`, `docker-sandbox.adapter.ts`, `codex-model-catalog.ts`, `json-parsers.ts`, `readiness-runner.ts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `Workspace`, `Commands`, `1. GitHub App` to the rest of the system?**
  _617 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `create-draft-review-request.use-case.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.055944055944055944 - nodes in this community are weakly interconnected._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.038461538461538464 - nodes in this community are weakly interconnected._
- **Should `events.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._