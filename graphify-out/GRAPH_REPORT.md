# Graph Report - PairDock  (2026-09-20)

## Corpus Check
- 348 files · ~156,317 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3123 nodes · 6948 edges · 175 communities (148 shown, 27 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 130 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `afe7dbac`
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
- .create
- host-preview-runtime.integration.test.ts
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
- SessionsRepositoryAdapter
- @nestjs/common
- SessionRegistry
- development-pm-auth.ts
- .constructor
- pm-session-page.tsx
- @pairdock/shared-contracts
- MVP E2E scenario
- Q: Trace all suggested graph questions using documentation only
- ApiClient
- Q: Trace all suggested graph questions using documentation only
- PairDock collaborative developer/PM prototype
- SessionEventFeed
- AGENTS.md
- example-project.integration.test.ts
- AgentHarnessEvent
- ChecksResult
- GithubSourceControlAdapter
- tool-readiness.integration.test.ts
- Prototype Reference Package
- host-preview-runtime.integration.test.ts
- @nestjs/websockets
- @prisma/adapter-pg
- rxjs
- @nestjs/core
- @pairdock/domain
- migration.sql
- Containers

## God Nodes (most connected - your core abstractions)
1. `PairDockIdentity` - 53 edges
2. `Behavior test plan — PairDock MVP` - 51 edges
3. `SandboxRef` - 46 edges
4. `parseJsonResponse()` - 46 edges
5. `DatabaseClient` - 43 edges
6. `SessionRunner` - 42 edges
7. `Session` - 39 edges
8. `AgentClient` - 38 edges
9. `AppModule` - 37 edges
10. `Project` - 36 edges

## Surprising Connections (you probably didn't know these)
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/agent-gateway/agent-command-routing.integration.test.ts → apps/api/src/app.module.ts
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/agent-gateway/validation.integration.test.ts → apps/api/src/app.module.ts
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/auth/auth.integration.test.ts → apps/api/src/app.module.ts
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/projects/shared-projects.integration.test.ts → apps/api/src/app.module.ts
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/sessions/pm-session-start.integration.test.ts → apps/api/src/app.module.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Nimbus Trial Button Correction States** — prototype_screenshots_01_clean_blank_landing_preview, prototype_screenshots_01_fixed_nimbus_trial_button_fix, prototype_screenshots_02_clean_blank_landing_preview, prototype_screenshots_02_fixed_nimbus_trial_button_fix [INFERRED 0.85]
- **Responsive Fix Session Workspace States** — prototype_screenshots_01_sess2_responsive_session_workspace, prototype_screenshots_01_sess3_responsive_session_workspace, prototype_screenshots_02_dev_responsive_session_workspace, prototype_screenshots_02_sess2_responsive_session_workspace, prototype_screenshots_02_sess3_responsive_session_workspace [INFERRED 0.85]
- **Correction Workflow Screenshots** — prototype_screenshots_03_clean_clean_correction_prompt_state, prototype_screenshots_03_dev_developer_correction_request_state, prototype_screenshots_03_flow_correction_workflow_state, prototype_screenshots_sess4_session_correction_request_state [INFERRED 0.85]

## Communities (175 total, 27 thin omitted)

### Community 0 - "agent-config.ts"
Cohesion: 0.12
Nodes (36): agentConfigFileSchema, agentHarnessConfigSchema, agentModelConfigSchema, agentProjectDescriptorSchema, assertHttpUrlTemplate(), assertLoopbackPortMapping(), assertLoopbackUrlTemplate(), assertSafeContainerImage() (+28 more)

### Community 1 - "create-draft-review-request.use-case.ts"
Cohesion: 0.06
Nodes (20): SandboxPort, SandboxRef, SandboxStartInput, allocateHostPort(), execFileAsync, HostPreviewRuntimeAdapter, HostPreviewRuntimeDependencies, HostSpawnOptions (+12 more)

### Community 2 - "Button"
Cohesion: 0.04
Nodes (51): Behavior test plan — PairDock MVP, BT-001 — Installable workspace, BT-002 — Session creation is persisted, BT-003 — Agent event is persisted, BT-004 — PM member access is allowed, BT-005 — Non-member access is denied, BT-006 — Valid session transitions, BT-007 — Invalid transition is rejected (+43 more)

### Community 3 - "events.ts"
Cohesion: 0.13
Nodes (27): buildValidationRepairPrompt(), hasRepairableCheckFailure(), isRetryableError(), AgentEventEnvelopeInput, buildAgentConnectedEvent(), buildAgentDoneEvent(), buildAgentOutputEvent(), buildChecksResultEvent() (+19 more)

### Community 4 - "index.ts"
Cohesion: 0.06
Nodes (40): AgentCancelCommandEnvelope, agentCancelCommandEnvelopeSchema, agentCommandEnvelopeSchema, agentPromptCommandEnvelopeSchema, ChecksRunCommandEnvelope, checksRunCommandEnvelopeSchema, GitGetDiffCommandEnvelope, gitGetDiffCommandEnvelopeSchema (+32 more)

### Community 5 - "index.ts"
Cohesion: 0.13
Nodes (18): allocateHostPort(), assertSafeContainerImage(), buildContainerHardeningArgs(), buildDockerRunArgs(), buildManagedResourceLabels(), buildNodeModulesTmpfsArg(), discardStaleDependencyCache(), DockerSandboxAdapter (+10 more)

### Community 6 - "developer-home-page.tsx"
Cohesion: 0.08
Nodes (22): authApi, DeveloperLoginCard(), PmLoginCard(), PmLoginCardProps, GitHubIcon(), SlackIcon(), ProductShell(), ProductShellProps (+14 more)

### Community 7 - "app-shell.tsx"
Cohesion: 0.12
Nodes (19): buildCodexPrompt(), buildCodexSecurityArgs(), buildCommandArgs(), buildHarnessEnvironment(), CodexHarnessAdapter, denySiblingPaths(), FilesystemPermission, isExecutableFile() (+11 more)

### Community 8 - "SandboxRef"
Cohesion: 0.26
Nodes (11): AuthenticatedRequest, ProjectsController, Body, Controller, Get, Inject, Param, Post (+3 more)

### Community 9 - "persistence.module.ts"
Cohesion: 0.19
Nodes (14): AuthModule, Module, GithubWebhooksModule, Module, PersistenceModule, Module, ProjectsModule, Module (+6 more)

### Community 10 - "PairDockUser"
Cohesion: 0.22
Nodes (7): mapUser(), Inject, Injectable, UsersRepositoryAdapter, CreateUserInput, UsersRepository, PairDockUser

### Community 11 - "client.ts"
Cohesion: 0.21
Nodes (8): useSharedSessionHistory(), filterSharedSessionHistory(), SessionHistoryFilters, SessionHistoryStatusFilter, PmActivityPage(), PmActivityPageProps, SESSION_STATUS_FILTER_OPTIONS, sessions

### Community 13 - "session.ts"
Cohesion: 0.04
Nodes (41): authHeaders(), AuthProviders, authProvidersSchema, CreateSessionInput, jsonHeaders(), RequestOptions, responseErrorSchema, ShareDeveloperProjectInput (+33 more)

### Community 14 - "scripts"
Cohesion: 0.05
Nodes (36): @biomejs/biome, apps/*, packages/*, tsx, @types/node, typescript, devDependencies, @biomejs/biome (+28 more)

### Community 15 - "ConnectedAgentsRegistry"
Cohesion: 0.12
Nodes (21): PreviewAreaSize, PreviewFrame(), PreviewFrameProps, PreviewSelectionControls, PreviewToolbar(), PreviewToolbarProps, usePreviewSelection(), useSessionData() (+13 more)

### Community 16 - "PairDockIdentity"
Cohesion: 0.24
Nodes (4): isRecord(), ProjectsService, Injectable, DeveloperProjectSummary

### Community 17 - "AuthService"
Cohesion: 0.25
Nodes (15): assertStateCookie(), AuthCallbackBody, AuthController, clearStateCookie(), HeaderResponse, readCookie(), readStateFromRedirectUrl(), secureCookieSuffix() (+7 more)

### Community 18 - "ProjectPreviewConfig"
Cohesion: 0.06
Nodes (30): createAttachmentStorage(), normalizePublicBaseUrl(), R2_ENVIRONMENT_KEYS, ATTACHMENT_STORAGE, AttachmentObject, AttachmentStoragePort, PutAttachmentObjectInput, AttachmentsController (+22 more)

### Community 19 - "support.js"
Cohesion: 0.09
Nodes (17): get(), compileTemplate(), createExternalModules(), createHelmetManager(), createPseudoSheet(), createRegistry(), createRuntime(), dcNameFromPath() (+9 more)

### Community 20 - "json-parsers.ts"
Cohesion: 0.09
Nodes (12): Inject, Inject, cloneSnapshot(), ConnectedAgentsRegistry, Injectable, startApplication(), authenticateDeveloper(), authenticatePm() (+4 more)

### Community 21 - "pm-session-page.tsx"
Cohesion: 0.13
Nodes (9): buildPrepareCommand(), createAgentServer(), createManagedWorktreeRoot(), createPreparedValidationFeedbackClient(), createTempRepository(), execFileAsync, execGit(), ReadySandboxPort (+1 more)

### Community 22 - "includes"
Cohesion: 0.08
Nodes (24): files, includes, formatter, enabled, indentStyle, lineWidth, quoteStyle, semicolons (+16 more)

### Community 23 - "package.json"
Cohesion: 0.07
Nodes (27): http-proxy-3, bin, pairdock-agent, dependencies, http-proxy-3, @pairdock/shared-contracts, parse5, socket.io-client (+19 more)

### Community 24 - "readiness-runner.ts"
Cohesion: 0.21
Nodes (13): CommandResult, CommandRunner, failed(), failureMessage(), isCodexExecutable(), passed(), ReadinessResult, ReadinessRunner (+5 more)

### Community 25 - "agent-client.ts"
Cohesion: 0.11
Nodes (9): AgentHarnessPort, RunPromptInput, SimulatedAgentHarness, AlwaysChangingHarnessPort, CancellableHarnessPort, InitialChangeOnlyHarnessPort, MutatingHarnessPort, RecordingHarnessPort (+1 more)

### Community 26 - "github-source-control.adapter.ts"
Cohesion: 0.12
Nodes (15): readGithubConfig(), Fetcher, parseFixtureIdentity(), readSlackConfig(), SlackAuthTestResponse, slackHeaders(), SlackOAuthResponse, SlackPmIdentityAdapter (+7 more)

### Community 27 - "package.json"
Cohesion: 0.15
Nodes (13): tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, devDependencies, tailwindcss, @tailwindcss/vite, @types/react (+5 more)

### Community 28 - "mvp-flow.e2e.test.ts"
Cohesion: 0.13
Nodes (16): authenticateDeveloper(), authenticatePm(), closeSession(), createDeveloperProject(), createReviewRequest(), createSession(), createTestRepository(), EXAMPLE_REPOSITORY_FIXTURE (+8 more)

### Community 29 - "AuthTokenService"
Cohesion: 0.17
Nodes (11): AuthTokenOptions, AuthTokenService, hasValidSignature(), isRecord(), isUserKind(), parseTokenPayload(), resolveSecret(), TokenPayload (+3 more)

### Community 30 - "github-developer-identity.adapter.ts"
Cohesion: 0.25
Nodes (8): findTopLevelEquality(), parensWrapWhole(), resolve(), resolvePath(), waitFor(), waitForReadiness(), waitForReadiness(), emitCommandWithAcknowledgement()

### Community 31 - "agent-events.repository.ts"
Cohesion: 0.14
Nodes (10): CheckCommandExecutor, CheckResult, ChecksResult, ChecksRunner, isTransientPackageExtractionFailure(), RunChecksInput, compactValidationLogs(), RecordingChecksRunner (+2 more)

### Community 32 - "external-identities.repository.ts"
Cohesion: 0.14
Nodes (14): Fetcher, GithubDeveloperIdentityAdapter, GithubDeveloperIdentityConfig, GithubEmailResponse, githubHeaders(), GithubInstallationMetadata, GithubInstallationsResponse, GithubOAuthResponse (+6 more)

### Community 33 - "slack-pm-identity.adapter.ts"
Cohesion: 0.07
Nodes (29): JsonObject, parseGithubPullRequestEvent(), requireBoolean(), requireDate(), requireIdentifier(), requireNonEmptyString(), requireObject(), requirePositiveInteger() (+21 more)

### Community 34 - "WorktreeService"
Cohesion: 0.21
Nodes (11): AgentRegistrationsRepositoryAdapter, isRecord(), mapAgentRegistration(), parseModels(), parseProjects(), parseStringArray(), Inject, Injectable (+3 more)

### Community 35 - "sessions.controller.ts"
Cohesion: 0.08
Nodes (23): buildPrepareRunArgs(), createDockerDependencyCacheKey(), createMissingMountpoints(), DockerCommandResult, DockerDependencyPrewarmer, DockerDependencyPrewarmerDependencies, DockerDependencyPrewarmerLogger, errorMessage() (+15 more)

### Community 36 - "DatabaseExecutor"
Cohesion: 0.10
Nodes (20): Architecture style, Current repository context, Dependency rules, Diagram links, External ports/adapters, Frontend styling, Local agent structure, Login interface (+12 more)

### Community 37 - "ReviewRequestsRepository"
Cohesion: 0.10
Nodes (12): PreparedWorktree, DEFAULT_SESSION_STATE_PATH, FileSessionWorkspaceStore, isMissingFileError(), metadataSchema, stateSchema, toPersistedWorkspace(), workspaceSchema (+4 more)

### Community 38 - "SessionsController"
Cohesion: 0.21
Nodes (8): mapSourceControlConnection(), SourceControlConnectionsRepositoryAdapter, Inject, Injectable, CreateSourceControlConnectionInput, SourceControlConnectionsRepository, SourceControlConnection, seedSessionFixture()

### Community 39 - "ToolReadinessService"
Cohesion: 0.13
Nodes (14): ImageLightbox(), ImageLightboxProps, ReviewRequestDialog(), ReviewRequestDialogProps, ACCEPTED_IMAGE_TYPES, appendScreenshotFiles(), AppendScreenshotFilesOptions, ClipboardDataWithItems (+6 more)

### Community 40 - "Implementation handoff — PairDock MVP"
Cohesion: 0.14
Nodes (14): AttachmentsRepositoryAdapter, Injectable, isExternalIdentityProvider(), isProjectMembershipRole(), mapAttachment(), parseAttachmentPurpose(), parseAttachmentVisibility(), parseExternalIdentityProvider() (+6 more)

### Community 41 - "docker-sandbox.adapter.ts"
Cohesion: 0.13
Nodes (19): CommandResult, containerImageSchema, enrichConfigWithProjectManifests(), healthcheckUrlTemplateSchema, isLoopbackPortMappingTemplate(), isValidPort(), loadProjectManifest(), loopbackPortMappingSchema (+11 more)

### Community 42 - "session-runner.ts"
Cohesion: 0.13
Nodes (12): buildHostCommandEnvironment(), HostCheckCommandExecutor, HostCheckCommandExecutorDependencies, HostCheckCommandInput, HostCheckCommandRunner, HostCommandSpawnOptions, SAFE_HOST_COMMAND_ENVIRONMENT_KEYS, appendLogs() (+4 more)

### Community 43 - "ui.ts"
Cohesion: 0.16
Nodes (9): errorMessage(), SessionCloseResult, SessionRecoveryResult, SessionRunner, SessionRunnerConfig, previewUsesDockerTunnel(), GitPushBranchCommandEnvelope, SessionCloseCommandEnvelope (+1 more)

### Community 44 - "tool-readiness.integration.test.ts"
Cohesion: 0.16
Nodes (12): ToolReadinessController, Controller, Get, HttpCode, Inject, Param, Post, Req (+4 more)

### Community 45 - "tool-readiness-panel.tsx"
Cohesion: 0.09
Nodes (18): authenticateDeveloper(), authenticatePm(), prisma, authenticatePm(), prisma, authenticatePm(), prisma, startApplication() (+10 more)

### Community 46 - "session-details.integration.test.ts"
Cohesion: 0.21
Nodes (7): branchExists(), execFileAsync, execGit(), pathExists(), remoteExists(), WorktreeService, BlockingPushWorktreeService

### Community 47 - "diff.service.ts"
Cohesion: 0.20
Nodes (11): SharedProjectCard(), SharedProjectCardProps, SessionStarted, StartPmSessionInput, useSharedProjects(), UseSharedProjectsResult, PmDashboardPage(), PmDashboardPageProps (+3 more)

### Community 48 - "command-handling.integration.test.ts"
Cohesion: 0.08
Nodes (12): HealthcheckService, HealthcheckTimeoutError, HealthcheckWaitInput, HealthcheckResult, createTempRepository(), execFileAsync, execGit(), FailOnceClosePreviewTunnelPort (+4 more)

### Community 49 - "codex-model-catalog.ts"
Cohesion: 0.11
Nodes (18): Implementation handoff — PairDock MVP, T01 — Monorepo and shared contracts, T02 — Prisma persistence foundation, T03 — Auth and session permissions, T04 — Backend session lifecycle, T05 — Backend ↔ agent WebSocket, T06 — Local agent: config, login, connection, T07 — Local agent: worktree and cleanup (+10 more)

### Community 50 - "DatabaseClient"
Cohesion: 0.12
Nodes (17): AgentGatewayModule, AuditLogModule, AuthModule, Backend NestJS modules, DiffModule, GithubModule, InvitationsModule, PersistenceModule (+9 more)

### Community 51 - "example-project.integration.test.ts"
Cohesion: 0.08
Nodes (22): Deploy, update, or roll back, Deployment environment, Local developer agent and previews, One-time server setup, PairDock production deployment, Release images, Security before exposing PairDock, 1. GitHub App (+14 more)

### Community 52 - "AgentClient"
Cohesion: 0.14
Nodes (18): createApiClient(), ConversationScreenshot(), ConversationThread(), ConversationThreadProps, asRecord(), buildSessionConversation(), extractErrorMessage(), humanizeAgentError() (+10 more)

### Community 53 - "test-json.ts"
Cohesion: 0.10
Nodes (17): mapValidationRun(), Injectable, ValidationRunsRepositoryAdapter, CreateValidationRunInput, allowedProgressTransitions, interruptedOperationStatuses, interruptedPreparationStatuses, InvalidSessionTransitionError (+9 more)

### Community 54 - "SessionsService"
Cohesion: 0.15
Nodes (6): sessionIdResponseSchema, authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication()

### Community 55 - "AuthenticatedRequest"
Cohesion: 0.12
Nodes (16): scripts, build, db:migrate, db:migrate:dev, db:migrate:test, db:reset, db:seed:pm-demo, db:status (+8 more)

### Community 57 - "PRD — PairDock MVP"
Cohesion: 0.24
Nodes (7): ConnectedSocket, Injectable, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, UiGateway

### Community 58 - "slack-pm-identity.adapter.ts"
Cohesion: 0.24
Nodes (11): DEVELOPMENT_PM, main(), assertLocalDevelopmentSeedTarget(), buildPmDemoSessions(), demoDiff(), deterministicUuid(), passingValidation(), PmDemoMessage (+3 more)

### Community 59 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @aws-sdk/client-s3, dotenv, @nestjs/platform-socket.io, @pairdock/domain, @pairdock/shared-contracts, @prisma/client, reflect-metadata (+7 more)

### Community 60 - "Backend NestJS modules"
Cohesion: 0.19
Nodes (7): DockerOrphanReconcileInput, DockerOrphanReconciler, DockerOrphanReconcilerDependencies, execFileAsync, listManagedContainers(), ManagedDockerContainer, stopContainers()

### Community 61 - "include"
Cohesion: 0.13
Nodes (14): compilerOptions, jsx, lib, extends, include, src/**/*.ts, ../../tsconfig.base.json, DOM (+6 more)

### Community 62 - "scripts"
Cohesion: 0.09
Nodes (13): AppModule, Module, bootstrap(), startApplication(), prisma, startApplication(), waitFor(), authenticateDeveloper() (+5 more)

### Community 63 - "AgentAuthenticationService"
Cohesion: 0.07
Nodes (21): AGENT_AUTHENTICATION_OPTIONS, AgentAuthenticationOptions, AgentCredentialInput, AuthenticatedAgentPrincipal, extractBearerToken(), isRecord(), parseCredentials(), Inject (+13 more)

### Community 64 - "source-control-connections.repository.ts"
Cohesion: 0.23
Nodes (9): BrandIconProps, GitMergeIcon(), GitPullRequestClosedIcon(), GitPullRequestIcon(), PullRequestStatusLink(), resolvePullRequestLabel(), resolvePullRequestState(), ReviewRequest (+1 more)

### Community 65 - "use-app-route.ts"
Cohesion: 0.13
Nodes (22): AppShell(), getAppRouteSnapshot(), loginRoute, openDeveloperHome(), openLogin(), openPmDashboard(), openPmReviewRequests(), openPmSession() (+14 more)

### Community 66 - "compilerOptions"
Cohesion: 0.14
Nodes (13): node, compilerOptions, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, noEmit (+5 more)

### Community 67 - "session-access.guard.ts"
Cohesion: 0.33
Nodes (13): "agent_events", "agent_registrations", "external_identities", "github_installations", "messages", "project_members", "project_readiness_snapshots", "projects" (+5 more)

### Community 68 - "json-parsers.ts"
Cohesion: 0.16
Nodes (12): boundRenderedDiff(), ChangedFile, CollectedDiff, DiffService, DiffSnapshot, execGitText(), GitOutput, normalizeStatusPath() (+4 more)

### Community 69 - "Product"
Cohesion: 0.09
Nodes (23): ProjectPreviewConfig, PreviewPickerProxy, assertSafeContainerImage(), buildCloudflareDockerArgs(), buildTunnelContainerName(), CloudflarePreviewTunnelAdapter, CloudflarePreviewTunnelDependencies, ManagedTunnelProcess (+15 more)

### Community 70 - "dependencies"
Cohesion: 0.16
Nodes (10): AuthenticatedUserGuard, Inject, Injectable, RequireAuth(), SessionStartSource, CreatePromptBody, CreateSessionBody, CreateSessionInput (+2 more)

### Community 71 - "developer-project-form.tsx"
Cohesion: 0.12
Nodes (15): Actors, Assumptions, Fixed constraints, Functional requirements, Goals, Handoff summary, Non-functional requirements, Non-goals for MVP (+7 more)

### Community 72 - "V1 developer setup"
Cohesion: 0.19
Nodes (12): applyCodexCommandToProjects(), CodexCatalogOptions, CodexInstallation, codexModelCacheSchema, codexModelSchema, codexReasoningLevelSchema, compareVersions(), enrichConfigWithCodexModels() (+4 more)

### Community 73 - "ui-gateway.browser-auth.integration.test.ts"
Cohesion: 0.17
Nodes (7): RequireSessionAccess(), SessionAccessGuard, Inject, Injectable, InvitationsService, Injectable, Inject

### Community 74 - "external-identities.repository.ts"
Cohesion: 0.11
Nodes (9): authenticateDeveloper(), createSession(), prisma, startApplication(), authenticateDeveloper(), prisma, startApplication(), idResponseSchema (+1 more)

### Community 75 - "ToolReadinessService"
Cohesion: 0.12
Nodes (11): mapProject(), ProjectsRepositoryAdapter, Injectable, CreateProjectInput, DeveloperProjectRecord, ProjectsRepository, SharedProjectRecord, Project (+3 more)

### Community 76 - "pm-activity-page.tsx"
Cohesion: 0.05
Nodes (45): Button(), ButtonProps, ButtonVariant, variantClasses, ConnectionActivityRail(), ConnectionActivityRailProps, RailMetricProps, DeveloperProjectCard() (+37 more)

### Community 77 - "commands.ts"
Cohesion: 0.17
Nodes (11): AgentGateway, isLifecycleProgressStatus(), toSessionAgentEvent(), ConnectedSocket, Injectable, MessageBody, SubscribeMessage, WebSocketGateway (+3 more)

### Community 78 - "package.json"
Cohesion: 0.17
Nodes (11): dependencies, zod, exports, zod, name, private, scripts, build (+3 more)

### Community 79 - "validation.integration.test.ts"
Cohesion: 0.18
Nodes (6): Inject, AuthService, buildFrontendAuthRedirectUrl(), hasAccessibleGithubInstallation(), readOAuthStartUrlConfig(), Injectable

### Community 80 - "shared-projects.integration.test.ts"
Cohesion: 0.24
Nodes (7): announceAgent(), authenticatePm(), prisma, publishReadiness(), sendAgentEvent(), startApplication(), waitForConnect()

### Community 81 - "mappers.ts"
Cohesion: 0.07
Nodes (18): Inject, Inject, mapReviewRequest(), Inject, Inject, Inject, ReviewRequestsRepositoryAdapter, Inject (+10 more)

### Community 82 - "session-prompt.service.ts"
Cohesion: 0.21
Nodes (8): announceAgent(), authenticatePm(), prisma, publishReadiness(), sendAgentEvent(), startApplication(), waitForConnect(), sessionCreateResponseSchema

### Community 83 - "auth.service.ts"
Cohesion: 0.11
Nodes (12): AgentConfig, PreviewCompanionConfig, PendingCompanion, PreviewCompanionManager, PreviewCompanionManagerDependencies, PreviewCompanionPort, PreviewCompanionRuntime, PreviewCompanionRuntimeStartInput (+4 more)

### Community 84 - "AgentCommandEnvelope"
Cohesion: 0.28
Nodes (14): loadAgentConfig(), summarizeAgentConfig(), loadEnrichedAgentConfig(), main(), parseModelMapping(), parseModelMappings(), parseProjectMapping(), parseProjectMappings() (+6 more)

### Community 86 - "Screens represented"
Cohesion: 0.29
Nodes (8): boot(), getReactDOM(), init(), parseDataProps(), parseDcDocument(), parseDcText(), react-dom, react-dom

### Community 87 - ".create"
Cohesion: 0.38
Nodes (6): checkLabels, statusTone(), ToolReadinessPanel(), ToolReadinessPanelProps, ToolReadinessRow(), DeveloperProjectReadiness

### Community 88 - ".authenticateDeveloper"
Cohesion: 0.26
Nodes (7): mapMessage(), MessagesRepositoryAdapter, Inject, Injectable, CreateMessageInput, MessagesRepository, SessionMessage

### Community 89 - "agent-command-routing.integration.test.ts"
Cohesion: 0.08
Nodes (24): Inject, mapSessionMember(), SessionMembersRepositoryAdapter, Injectable, createPersistenceRepositories(), PersistenceUnitOfWorkAdapter, Inject, Injectable (+16 more)

### Community 90 - "agent-gateway.integration.test.ts"
Cohesion: 0.09
Nodes (26): defaultValues, PromptComposer(), PromptComposerProps, releaseScreenshotPreviews(), buildPreviewSelectionPrompt(), canInstrumentHtml(), copyResponseHeaders(), decodeHtml() (+18 more)

### Community 91 - "AgentCommandEnvelope"
Cohesion: 0.32
Nodes (8): ProjectChecksConfig, AgentModelConfig, AgentProjectDescriptor, SaveAgentConfigInput, ProjectManifestLoadResult, ProjectAgentHarnessConfig, ReadinessRunnerConfig, AgentClientConfig

### Community 92 - "package.json"
Cohesion: 0.20
Nodes (9): devDependencies, prisma, socket.io-client, socket.io-client, name, private, type, version (+1 more)

### Community 94 - "createRuntime"
Cohesion: 0.09
Nodes (11): isInsideSensitiveDirectory(), normalizeRelativePath(), SensitiveFilesPolicy, createTempRepository(), execFileAsync, execGit(), FailingClosePreviewTunnelPort, FakeHostCommandExecutor (+3 more)

### Community 95 - "PairDock Interactive Prototype"
Cohesion: 0.14
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
Cohesion: 0.29
Nodes (5): toValidationView(), Inject, Injectable, ValidationService, ChecksResultEventEnvelope

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
Cohesion: 0.18
Nodes (13): SessionsController, Body, Controller, Get, HttpCode, Inject, Param, Post (+5 more)

### Community 104 - "package.json"
Cohesion: 0.11
Nodes (21): DiffService, isSessionDiffPayload(), SessionDiffView, AgentEventsRepositoryAdapter, Injectable, isToolReadinessKey(), isToolReadinessStatus(), parseJsonObject() (+13 more)

### Community 106 - "developer-project-form.tsx"
Cohesion: 0.08
Nodes (46): AgentAuthenticationService, Injectable, AgentCommandRouterService, Inject, Injectable, Inject, Inject, UploadedScreenshot (+38 more)

### Community 107 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): extends, include, src/**/*.ts, ../../tsconfig.base.json, ../../tests/packages/local-agent/**/*.ts

### Community 108 - "persistence.integration.test.ts"
Cohesion: 0.14
Nodes (6): AgentConnectedEventEnvelope, RecordedHandshake, RecordingRestoreSessionRunner, SessionRunnerWithRecoveredWorkspace, SessionRunnerWithRecoveryFailure, waitFor()

### Community 109 - "auth.service.ts"
Cohesion: 0.18
Nodes (10): Architecture documents reconciled, Developer dashboard, Implementation guidance, Login, PM shared-project dashboard, Prototype notes — PairDock collaborative developer/PM, Purpose, Running/fixed/review states (+2 more)

### Community 110 - "AgentEventEnvelope"
Cohesion: 0.22
Nodes (7): AuthProvider, AuthProviders, OAuthStartUrlConfig, DEVELOPER_IDENTITY_PORT, PM_IDENTITY_PORT, AuthEnvironment, isDevelopmentPmAuthEnabled()

### Community 112 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 113 - "GithubSourceControlAdapter"
Cohesion: 0.33
Nodes (4): queryClient, rootElement, LoginPage(), renderLoginPage()

### Community 114 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 115 - "PairDock collaborative developer/PM prototype"
Cohesion: 0.24
Nodes (7): currentDirectory, databaseTargetEnvironment, buildAdapter(), DatabaseEnvironment, DatabaseTarget, parseDatabaseTarget(), resolveDatabaseConnectionString()

### Community 117 - "ci-gates.test.ts"
Cohesion: 0.29
Nodes (5): apiPackageJson, localAgentPackageJson, repositoryRoot, rootPackageJson, workflowPath

### Community 118 - "main.tsx"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, test, test:unit, typecheck (+2 more)

### Community 119 - "01 Fixed — Nimbus Trial Button Fix Preview"
Cohesion: 0.50
Nodes (4): 01 Clean — Blank Nimbus Landing Preview, 01 Fixed — Nimbus Trial Button Fix Preview, 02 Clean — Blank Nimbus Landing Preview, 02 Fixed — Nimbus Trial Button Fix Preview

### Community 120 - "SourceControlPort"
Cohesion: 0.15
Nodes (6): authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication(), sessionPromptResponseSchema

### Community 121 - "walk"
Cohesion: 0.30
Nodes (15): collectProps(), compileAttr(), cssToObj(), getReact(), hostPositionStyle(), kebabToCamel(), walk(), walkChildren() (+7 more)

### Community 122 - "01 Flow — PM Shared Projects Dashboard"
Cohesion: 0.67
Nodes (3): 01 Dev — Developer Shared Projects Dashboard, 01 Flow — PM Shared Projects Dashboard, 02 Flow — PM Shared Projects Dashboard

### Community 123 - "01 Session 2 — Responsive Fix Session Workspace"
Cohesion: 0.67
Nodes (3): 01 Session 2 — Responsive Fix Session Workspace, 01 Session 3 — Responsive Fix Session Workspace, 02 Dev — Responsive Fix Session Workspace

### Community 124 - "GithubSourceControlAdapter"
Cohesion: 0.20
Nodes (6): resolveUnavailableReason(), buildSessionPrepareCommand(), formatUserDisplayName(), SessionsService, Injectable, PairDockIdentity

### Community 126 - "dependencies"
Cohesion: 0.14
Nodes (14): @pairdock/shared-contracts, socket.io-client, zod, createComponentFactory(), react, @tanstack/react-form, @tanstack/react-query, dependencies (+6 more)

### Community 128 - ".create"
Cohesion: 0.23
Nodes (5): buildConventionalCommitMessage(), buildGitPushBranchCommand(), buildSessionBranchName(), CreateReviewRequestUseCase, Injectable

### Community 129 - "host-preview-runtime.integration.test.ts"
Cohesion: 0.50
Nodes (3): createRunningProcess(), FakeRunningProcess, spawn()

### Community 130 - "review-requests.repository.ts"
Cohesion: 0.16
Nodes (6): createTempRepository(), execFileAsync, execGit(), prisma, ReadyPreviewTunnelPort, startApplication()

### Community 131 - "prisma.config.ts"
Cohesion: 0.19
Nodes (14): AgentGatewayModule, Module, AttachmentsModule, Module, InvitationsModule, Module, ReviewRequestsModule, Module (+6 more)

### Community 137 - "Containers"
Cohesion: 0.16
Nodes (9): requestJson(), FeedIdentity, feedRegistry, getFeed(), SessionEventFeed, useSessionEventFeed(), getBackendUrl(), FeedConnectionState (+1 more)

### Community 139 - "SessionMembersRepositoryAdapter"
Cohesion: 0.22
Nodes (8): exports, name, private, scripts, build, typecheck, type, version

### Community 143 - "validation.integration.test.ts"
Cohesion: 0.07
Nodes (29): AgentExecutionCapabilitiesService, SessionExecutionSelection, Injectable, AgentProjectBindingService, Injectable, ConnectedAgentSnapshot, mapProjectMembership(), mapProjectReadinessSnapshot() (+21 more)

### Community 144 - "pm-activity-page.tsx"
Cohesion: 0.47
Nodes (3): HealthController, Controller, Get

### Community 145 - "SessionsRepositoryAdapter"
Cohesion: 0.25
Nodes (7): name, private, scripts, build, lint, test, type

### Community 146 - "@nestjs/common"
Cohesion: 0.33
Nodes (5): Deployment security audit — 2026-07-19, Operational requirements and residual risk, Resolved findings, Scope, Verification

### Community 149 - "SessionRegistry"
Cohesion: 0.20
Nodes (8): ExternalIdentitiesRepositoryAdapter, Inject, Injectable, serializeJsonObject(), mapExternalIdentity(), CreateExternalIdentityInput, ExternalIdentitiesRepository, ExternalIdentity

### Community 153 - ".constructor"
Cohesion: 0.20
Nodes (6): extensionFor(), PromptAttachment, PromptAttachmentDownloader, resolveHarnessTempDirectory(), LogRedactor, AgentPromptCommandEnvelope

### Community 154 - "pm-session-page.tsx"
Cohesion: 0.13
Nodes (8): Body, HttpCode, Post, AuthResult, Inject, Inject, Injectable, UsersService

### Community 158 - "ApiClient"
Cohesion: 0.18
Nodes (5): ApiClient, DeveloperProjectFormProps, CreateDeveloperProjectInput, DeveloperProjectSetup, SharedSessionHistoryItem

### Community 159 - "Q: Trace all suggested graph questions using documentation only"
Cohesion: 0.40
Nodes (5): Agent → backend events, Backend → agent commands, Backend ↔ agent WebSocket contract, Common envelope, UI session-start contract

### Community 160 - "PairDock collaborative developer/PM prototype"
Cohesion: 0.40
Nodes (5): Developer dashboard, Frontend product surfaces, Login, PM dashboard, Session workspace

### Community 161 - "SessionEventFeed"
Cohesion: 0.40
Nodes (4): Fixtures, MVP E2E scenario, Reproduce locally, What it proves

### Community 162 - "AGENTS.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Trace all suggested graph questions using documentation only, Source Nodes

### Community 163 - "example-project.integration.test.ts"
Cohesion: 0.20
Nodes (5): createTempRepository(), execFileAsync, execGit(), HARNESS_SCRIPT_PATH, ReadyPreviewTunnelPort

### Community 164 - "AgentHarnessEvent"
Cohesion: 0.29
Nodes (6): AgentHarnessEvent, AgentHarnessEventQueue, isCodexCommand(), normalizeExitCode(), prepareHarnessShell(), quoteShellValue()

### Community 165 - "ChecksResult"
Cohesion: 0.13
Nodes (11): mapSession(), SessionsRepositoryAdapter, Injectable, CreateSessionInput, buildSessionCloseCommand(), SessionCloseService, Inject, Injectable (+3 more)

### Community 167 - "GithubSourceControlAdapter"
Cohesion: 0.16
Nodes (15): base64UrlEncode(), createGithubAppJwt(), deterministicReviewRequestNumber(), Fetcher, GithubBranchResponse, githubHeaders(), GithubInstallationRepositoriesResponse, GithubInstallationTokenResponse (+7 more)

### Community 169 - "tool-readiness.integration.test.ts"
Cohesion: 0.40
Nodes (4): Architectural interpretation, Contents, How to view, PairDock collaborative developer/PM prototype

## Knowledge Gaps
- **648 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+643 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `resolve()` connect `github-developer-identity.adapter.ts` to `AgentHarnessEvent`, `persistence.integration.test.ts`, `command-handling.integration.test.ts`, `support.js`, `AgentCommandEnvelope`, `agent-client.ts`, `walk`, `agent-gateway.integration.test.ts`, `scripts`, `AgentAuthenticationService`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `main.tsx`, `Screens represented`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `PairDockIdentity` connect `GithubSourceControlAdapter` to `.create`, `dependencies`, `SandboxRef`, `HealthController`, `developer-project-form.tsx`, `tool-readiness.integration.test.ts`, `AgentEventEnvelope`, `validation.integration.test.ts`, `PairDockIdentity`, `test-json.ts`, `pm-session-page.tsx`, `AuthTokenService`, `ApiClient`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _648 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agent-config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12162162162162163 - nodes in this community are weakly interconnected._
- **Should `create-draft-review-request.use-case.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.061343204653622425 - nodes in this community are weakly interconnected._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.038461538461538464 - nodes in this community are weakly interconnected._