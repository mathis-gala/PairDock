# Graph Report - PairDock  (2026-07-26)

## Corpus Check
- 333 files · ~147,289 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3016 nodes · 6584 edges · 188 communities (156 shown, 32 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 119 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b27bbc77`
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
- SessionsRepositoryAdapter
- @nestjs/common
- Get
- tool-readiness-panel.tsx
- SessionRegistry
- Deployment security audit — 2026-07-19
- Deployment security audit — 2026-07-19
- development-pm-auth.ts
- .constructor
- pm-session-page.tsx
- @pairdock/shared-contracts
- MVP E2E scenario
- Q: Trace all suggested graph questions using documentation only
- authenticated-request.ts
- Q: Trace all suggested graph questions using documentation only
- PairDock collaborative developer/PM prototype
- SessionEventFeed
- AGENTS.md
- @prisma/adapter-pg
- tool-readiness-panel.tsx
- ReadyPreviewTunnelPort
- session-attachments.service.ts
- rxjs
- migration.sql
- EmptySessionAttachmentsService
- Prototype Reference Package
- @aws-sdk/client-s3
- host-preview-runtime.integration.test.ts
- @nestjs/websockets
- Containers
- socket.io
- @nestjs/core
- @pairdock/domain
- Optional
- Body
- Controller
- Headers
- HttpCode
- Post
- Req

## God Nodes (most connected - your core abstractions)
1. `PairDockIdentity` - 53 edges
2. `Behavior test plan — PairDock MVP` - 51 edges
3. `parseJsonResponse()` - 46 edges
4. `SandboxRef` - 45 edges
5. `DatabaseClient` - 41 edges
6. `SessionRunner` - 40 edges
7. `Session` - 39 edges
8. `AgentClient` - 38 edges
9. `AppModule` - 37 edges
10. `Project` - 36 edges

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

## Communities (188 total, 32 thin omitted)

### Community 0 - "agent-config.ts"
Cohesion: 0.14
Nodes (32): agentConfigFileSchema, agentHarnessConfigSchema, agentModelConfigSchema, agentProjectDescriptorSchema, assertHttpUrlTemplate(), assertLoopbackPortMapping(), assertLoopbackUrlTemplate(), assertSafeContainerImage() (+24 more)

### Community 1 - "create-draft-review-request.use-case.ts"
Cohesion: 0.09
Nodes (8): SandboxRef, ReadySandboxPort, ReadySandboxPort, ReadySandboxPort, TimeoutSandboxPort, ReadySandboxPort, FakeSandboxPort, UnavailableSandboxPort

### Community 2 - "Button"
Cohesion: 0.04
Nodes (51): Behavior test plan — PairDock MVP, BT-001 — Installable workspace, BT-002 — Session creation is persisted, BT-003 — Agent event is persisted, BT-004 — PM member access is allowed, BT-005 — Non-member access is denied, BT-006 — Valid session transitions, BT-007 — Invalid transition is rejected (+43 more)

### Community 3 - "events.ts"
Cohesion: 0.16
Nodes (15): assertSafeContainerImage(), buildCloudflareDockerArgs(), buildTunnelContainerName(), CloudflarePreviewTunnelAdapter, CloudflarePreviewTunnelDependencies, ManagedTunnelProcess, onceExit(), resolveRestoredTunnelContainerName() (+7 more)

### Community 4 - "index.ts"
Cohesion: 0.06
Nodes (39): AgentCancelCommandEnvelope, agentCancelCommandEnvelopeSchema, agentCommandEnvelopeSchema, agentPromptCommandEnvelopeSchema, ChecksRunCommandEnvelope, checksRunCommandEnvelopeSchema, GitGetDiffCommandEnvelope, gitGetDiffCommandEnvelopeSchema (+31 more)

### Community 5 - "index.ts"
Cohesion: 0.13
Nodes (19): createDockerDependencyCacheKey(), allocateHostPort(), assertSafeContainerImage(), buildContainerHardeningArgs(), buildDockerRunArgs(), buildManagedResourceLabels(), buildNodeModulesTmpfsArg(), discardStaleDependencyCache() (+11 more)

### Community 6 - "developer-home-page.tsx"
Cohesion: 0.08
Nodes (22): authApi, DeveloperLoginCard(), PmLoginCard(), PmLoginCardProps, GitHubIcon(), SlackIcon(), Button(), ProjectShareFormProps (+14 more)

### Community 7 - "app-shell.tsx"
Cohesion: 0.11
Nodes (25): AgentHarnessEvent, AgentHarnessEventQueue, buildCodexPrompt(), buildCodexSecurityArgs(), buildCommandArgs(), buildHarnessEnvironment(), CodexHarnessAdapter, denySiblingPaths() (+17 more)

### Community 8 - "SandboxRef"
Cohesion: 0.09
Nodes (33): AgentCommandRouterService, Injectable, isLifecycleProgressStatus(), toSessionAgentEvent(), SessionAttachmentsService, Injectable, AGENT_EVENTS_REPOSITORY, AGENT_REGISTRATIONS_REPOSITORY (+25 more)

### Community 9 - "persistence.module.ts"
Cohesion: 0.12
Nodes (26): AgentGatewayModule, Module, AttachmentsModule, Module, AuthModule, Module, InvitationsModule, Module (+18 more)

### Community 10 - "PairDockUser"
Cohesion: 0.22
Nodes (7): mapUser(), Inject, Injectable, UsersRepositoryAdapter, CreateUserInput, UsersRepository, PairDockUser

### Community 11 - "client.ts"
Cohesion: 0.11
Nodes (18): BrandIconProps, GitMergeIcon(), GitPullRequestClosedIcon(), GitPullRequestIcon(), PullRequestStatusLink(), resolvePullRequestLabel(), resolvePullRequestState(), ReviewRequest (+10 more)

### Community 13 - "session.ts"
Cohesion: 0.06
Nodes (19): ApiClient, authHeaders(), AuthProviders, authProvidersSchema, CreateSessionInput, jsonHeaders(), requestJson(), RequestOptions (+11 more)

### Community 14 - "scripts"
Cohesion: 0.05
Nodes (36): @biomejs/biome, apps/*, packages/*, tsx, @types/node, typescript, devDependencies, @biomejs/biome (+28 more)

### Community 15 - "ConnectedAgentsRegistry"
Cohesion: 0.20
Nodes (11): PreviewAreaSize, PreviewFrame(), PreviewFrameProps, PreviewToolbar(), PreviewToolbarProps, getFittedPreviewScale(), getPreviewFrameStyle(), isPreviewPresetId() (+3 more)

### Community 16 - "PairDockIdentity"
Cohesion: 0.16
Nodes (6): isRecord(), ProjectsService, resolveUnavailableReason(), Injectable, PairDockIdentity, DeveloperProjectSummary

### Community 17 - "AuthService"
Cohesion: 0.21
Nodes (16): assertStateCookie(), AuthCallbackBody, AuthController, clearStateCookie(), HeaderResponse, readCookie(), readStateFromRedirectUrl(), secureCookieSuffix() (+8 more)

### Community 18 - "ProjectPreviewConfig"
Cohesion: 0.06
Nodes (28): createAttachmentStorage(), normalizePublicBaseUrl(), R2_ENVIRONMENT_KEYS, ATTACHMENT_STORAGE, AttachmentObject, AttachmentStoragePort, PutAttachmentObjectInput, BinaryResponse (+20 more)

### Community 19 - "support.js"
Cohesion: 0.12
Nodes (9): compileTemplate(), dcNameFromPath(), encodeCase(), isElementClass(), isRenderableType(), loadReactUmd(), loadScript(), rootNameForDocument() (+1 more)

### Community 20 - "json-parsers.ts"
Cohesion: 0.12
Nodes (11): AgentExecutionCapabilitiesService, SessionExecutionSelection, Inject, Injectable, Inject, cloneSnapshot(), ConnectedAgentSnapshot, ConnectedAgentsRegistry (+3 more)

### Community 21 - "pm-session-page.tsx"
Cohesion: 0.09
Nodes (21): Deploy, update, or roll back, Deployment environment, Local developer agent and previews, One-time server setup, PairDock production deployment, Release images, Security before exposing PairDock, 1. GitHub App (+13 more)

### Community 22 - "includes"
Cohesion: 0.08
Nodes (24): files, includes, formatter, enabled, indentStyle, lineWidth, quoteStyle, semicolons (+16 more)

### Community 23 - "package.json"
Cohesion: 0.08
Nodes (23): bin, pairdock-agent, dependencies, @pairdock/shared-contracts, socket.io-client, yaml, zod, devDependencies (+15 more)

### Community 24 - "readiness-runner.ts"
Cohesion: 0.20
Nodes (14): CommandResult, CommandRunner, failed(), failureMessage(), isCodexExecutable(), passed(), ReadinessResult, ReadinessRunner (+6 more)

### Community 25 - "agent-client.ts"
Cohesion: 0.23
Nodes (5): mapValidationRun(), CreateValidationRunInput, ValidationRunsRepository, SessionValidationView, ValidationRun

### Community 26 - "github-source-control.adapter.ts"
Cohesion: 0.14
Nodes (13): Fetcher, parseFixtureIdentity(), readSlackConfig(), SlackAuthTestResponse, slackHeaders(), SlackOAuthResponse, SlackPmIdentityAdapter, SlackPmIdentityConfig (+5 more)

### Community 27 - "package.json"
Cohesion: 0.08
Nodes (23): tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, devDependencies, tailwindcss, @tailwindcss/vite, @types/react (+15 more)

### Community 28 - "mvp-flow.e2e.test.ts"
Cohesion: 0.13
Nodes (16): authenticateDeveloper(), authenticatePm(), closeSession(), createDeveloperProject(), createReviewRequest(), createSession(), createTestRepository(), EXAMPLE_REPOSITORY_FIXTURE (+8 more)

### Community 29 - "AuthTokenService"
Cohesion: 0.16
Nodes (11): AuthTokenOptions, AuthTokenService, hasValidSignature(), isRecord(), isUserKind(), parseTokenPayload(), resolveSecret(), TokenPayload (+3 more)

### Community 30 - "github-developer-identity.adapter.ts"
Cohesion: 0.25
Nodes (8): findTopLevelEquality(), parensWrapWhole(), resolve(), resolvePath(), waitFor(), waitForReadiness(), waitForReadiness(), emitCommandWithAcknowledgement()

### Community 31 - "agent-events.repository.ts"
Cohesion: 0.14
Nodes (10): CheckCommandExecutor, CheckResult, ChecksResult, ChecksRunner, isTransientPackageExtractionFailure(), RunChecksInput, compactValidationLogs(), RecordingChecksRunner (+2 more)

### Community 32 - "external-identities.repository.ts"
Cohesion: 0.13
Nodes (15): Fetcher, GithubDeveloperIdentityAdapter, GithubDeveloperIdentityConfig, GithubEmailResponse, githubHeaders(), GithubInstallationMetadata, GithubInstallationsResponse, GithubOAuthResponse (+7 more)

### Community 33 - "slack-pm-identity.adapter.ts"
Cohesion: 0.07
Nodes (29): JsonObject, parseGithubPullRequestEvent(), requireBoolean(), requireDate(), requireIdentifier(), requireNonEmptyString(), requireObject(), requirePositiveInteger() (+21 more)

### Community 34 - "WorktreeService"
Cohesion: 0.21
Nodes (11): AgentRegistrationsRepositoryAdapter, isRecord(), mapAgentRegistration(), parseModels(), parseProjects(), parseStringArray(), Inject, Injectable (+3 more)

### Community 35 - "sessions.controller.ts"
Cohesion: 0.14
Nodes (19): buildPrepareRunArgs(), createMissingMountpoints(), DockerCommandResult, DockerDependencyPrewarmer, DockerDependencyPrewarmerDependencies, DockerDependencyPrewarmerLogger, errorMessage(), execFileAsync (+11 more)

### Community 36 - "DatabaseExecutor"
Cohesion: 0.10
Nodes (20): Architecture style, Current repository context, Dependency rules, Diagram links, External ports/adapters, Frontend styling, Local agent structure, Login interface (+12 more)

### Community 37 - "ReviewRequestsRepository"
Cohesion: 0.15
Nodes (11): PreparedWorktree, DEFAULT_SESSION_STATE_PATH, FileSessionWorkspaceStore, isMissingFileError(), metadataSchema, stateSchema, toPersistedWorkspace(), workspaceSchema (+3 more)

### Community 38 - "SessionsController"
Cohesion: 0.14
Nodes (16): CommandResult, containerImageSchema, enrichConfigWithProjectManifests(), healthcheckUrlTemplateSchema, isLoopbackPortMappingTemplate(), isValidPort(), loadProjectManifest(), loopbackPortMappingSchema (+8 more)

### Community 39 - "ToolReadinessService"
Cohesion: 0.12
Nodes (28): buildValidationRepairPrompt(), hasRepairableCheckFailure(), isRetryableError(), AgentEventEnvelopeInput, buildAgentConnectedEvent(), buildAgentDoneEvent(), buildAgentOutputEvent(), buildChecksResultEvent() (+20 more)

### Community 40 - "Implementation handoff — PairDock MVP"
Cohesion: 0.13
Nodes (10): AttachmentsRepositoryAdapter, Inject, Injectable, mapAttachment(), parseAttachmentPurpose(), parseAttachmentVisibility(), AttachmentsRepository, CreateAttachmentInput (+2 more)

### Community 41 - "docker-sandbox.adapter.ts"
Cohesion: 0.19
Nodes (10): mapSessionMember(), SessionMembersRepositoryAdapter, Inject, Injectable, AddSessionMemberInput, SessionMembersRepository, SessionMember, SourceControlProvider (+2 more)

### Community 42 - "session-runner.ts"
Cohesion: 0.16
Nodes (10): HostCheckCommandExecutor, HostCheckCommandExecutorDependencies, HostCheckCommandInput, HostCommandSpawnOptions, SAFE_HOST_COMMAND_ENVIRONMENT_KEYS, appendLogs(), signalProcessGroup(), terminateHostProcessGroup() (+2 more)

### Community 43 - "ui.ts"
Cohesion: 0.16
Nodes (8): HostCheckCommandRunner, errorMessage(), SessionCloseResult, SessionRecoveryResult, SessionRunner, GitPushBranchCommandEnvelope, SessionCloseCommandEnvelope, SessionPrepareCommandEnvelope

### Community 44 - "tool-readiness.integration.test.ts"
Cohesion: 0.10
Nodes (13): mapReviewRequest(), ReviewRequestsRepositoryAdapter, Inject, Injectable, CreateReviewRequestInput, ReviewRequestsRepository, UpdateReviewRequestStatusInput, ReviewRequestRecord (+5 more)

### Community 45 - "tool-readiness-panel.tsx"
Cohesion: 0.11
Nodes (9): authenticateDeveloper(), createSession(), prisma, startApplication(), authenticateDeveloper(), prisma, startApplication(), idResponseSchema (+1 more)

### Community 46 - "session-details.integration.test.ts"
Cohesion: 0.21
Nodes (7): branchExists(), execFileAsync, execGit(), pathExists(), remoteExists(), WorktreeService, BlockingPushWorktreeService

### Community 47 - "diff.service.ts"
Cohesion: 0.15
Nodes (12): ConnectionActivityRail(), ConnectionActivityRailProps, RailMetricProps, SessionControlCard(), SessionControlCardProps, SharedProjectCardProps, StatusBadge(), SessionStarted (+4 more)

### Community 48 - "command-handling.integration.test.ts"
Cohesion: 0.10
Nodes (7): HealthcheckTimeoutError, createTempRepository(), execFileAsync, execGit(), FailOnceClosePreviewTunnelPort, ImmediateTimeoutHealthcheckService, ReadyPreviewTunnelPort

### Community 49 - "codex-model-catalog.ts"
Cohesion: 0.12
Nodes (14): buildHostCommandEnvironment(), HealthcheckWaitInput, HealthcheckResult, SandboxPort, SandboxStartInput, allocateHostPort(), execFileAsync, HostPreviewRuntimeAdapter (+6 more)

### Community 50 - "DatabaseClient"
Cohesion: 0.11
Nodes (18): Implementation handoff — PairDock MVP, T01 — Monorepo and shared contracts, T02 — Prisma persistence foundation, T03 — Auth and session permissions, T04 — Backend session lifecycle, T05 — Backend ↔ agent WebSocket, T06 — Local agent: config, login, connection, T07 — Local agent: worktree and cleanup (+10 more)

### Community 51 - "example-project.integration.test.ts"
Cohesion: 0.11
Nodes (9): AgentHarnessPort, RunPromptInput, SimulatedAgentHarness, AlwaysChangingHarnessPort, CancellableHarnessPort, InitialChangeOnlyHarnessPort, MutatingHarnessPort, RecordingHarnessPort (+1 more)

### Community 52 - "AgentClient"
Cohesion: 0.23
Nodes (5): SessionAccessGuard, Inject, Injectable, InvitationsService, Injectable

### Community 53 - "test-json.ts"
Cohesion: 0.08
Nodes (23): createDraftReviewRequestInputSchema, developerProjectReadinessSchema, developerProjectSessionSummarySchema, developerProjectSetupSchema, developerProjectSummaryListSchema, developerProjectSummarySchema, DeveloperSetupAgent, developerSetupAgentModelSchema (+15 more)

### Community 54 - "SessionsService"
Cohesion: 0.12
Nodes (14): authenticatePm(), prisma, authenticatePm(), prisma, startApplication(), authenticatePm(), prisma, startApplication() (+6 more)

### Community 55 - "AuthenticatedRequest"
Cohesion: 0.15
Nodes (14): Inject, isExternalIdentityProvider(), isProjectMembershipRole(), mapProjectMembership(), parseExternalIdentityProvider(), parseProjectMembershipRole(), ProjectMembersRepositoryAdapter, Inject (+6 more)

### Community 56 - "SessionsService"
Cohesion: 0.19
Nodes (12): applyCodexCommandToProjects(), CodexCatalogOptions, CodexInstallation, codexModelCacheSchema, codexModelSchema, codexReasoningLevelSchema, compareVersions(), enrichConfigWithCodexModels() (+4 more)

### Community 57 - "PRD — PairDock MVP"
Cohesion: 0.19
Nodes (8): ConnectedSocket, Inject, Injectable, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, UiGateway

### Community 58 - "slack-pm-identity.adapter.ts"
Cohesion: 0.27
Nodes (10): DEVELOPMENT_PM, main(), assertLocalDevelopmentSeedTarget(), buildPmDemoSessions(), demoDiff(), deterministicUuid(), passingValidation(), PmDemoMessage (+2 more)

### Community 59 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @aws-sdk/client-s3, dotenv, @nestjs/platform-socket.io, @pairdock/shared-contracts, @prisma/adapter-pg, @prisma/client, reflect-metadata (+7 more)

### Community 60 - "Backend NestJS modules"
Cohesion: 0.19
Nodes (7): DockerOrphanReconcileInput, DockerOrphanReconciler, DockerOrphanReconcilerDependencies, execFileAsync, listManagedContainers(), ManagedDockerContainer, stopContainers()

### Community 61 - "include"
Cohesion: 0.13
Nodes (14): compilerOptions, jsx, lib, extends, include, src/**/*.ts, ../../tsconfig.base.json, DOM (+6 more)

### Community 62 - "scripts"
Cohesion: 0.12
Nodes (10): AppModule, Module, GithubWebhooksModule, Module, bootstrap(), startApplication(), prisma, startApplication() (+2 more)

### Community 63 - "AgentAuthenticationService"
Cohesion: 0.16
Nodes (12): boundRenderedDiff(), ChangedFile, CollectedDiff, DiffService, DiffSnapshot, execGitText(), GitOutput, normalizeStatusPath() (+4 more)

### Community 64 - "source-control-connections.repository.ts"
Cohesion: 0.12
Nodes (17): AgentGatewayModule, AuditLogModule, AuthModule, Backend NestJS modules, DiffModule, GithubModule, InvitationsModule, PersistenceModule (+9 more)

### Community 65 - "use-app-route.ts"
Cohesion: 0.08
Nodes (31): AppShell(), queryClient, SharedProjectCard(), getAppRouteSnapshot(), loginRoute, openDeveloperHome(), openLogin(), openPmDashboard() (+23 more)

### Community 66 - "compilerOptions"
Cohesion: 0.14
Nodes (13): node, compilerOptions, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, noEmit (+5 more)

### Community 67 - "session-access.guard.ts"
Cohesion: 0.33
Nodes (13): "agent_events", "agent_registrations", "external_identities", "github_installations", "messages", "project_members", "project_readiness_snapshots", "projects" (+5 more)

### Community 68 - "json-parsers.ts"
Cohesion: 0.12
Nodes (16): scripts, build, db:migrate, db:migrate:dev, db:migrate:test, db:reset, db:seed:pm-demo, db:status (+8 more)

### Community 69 - "Product"
Cohesion: 0.29
Nodes (11): ProjectChecksConfig, AgentConfig, AgentModelConfig, AgentProjectDescriptor, SaveAgentConfigInput, ProjectManifestLoadResult, ProjectPreviewConfig, ProjectAgentHarnessConfig (+3 more)

### Community 70 - "dependencies"
Cohesion: 0.24
Nodes (5): AuthenticatedUserGuard, Injectable, RequireAuth(), RequireSessionAccess(), CreatePromptBody

### Community 71 - "developer-project-form.tsx"
Cohesion: 0.26
Nodes (11): AuthenticatedRequest, ProjectsController, Body, Controller, Get, Inject, Param, Post (+3 more)

### Community 72 - "V1 developer setup"
Cohesion: 0.23
Nodes (11): useSessionData(), FeedIdentity, feedRegistry, getFeed(), useSessionEventFeed(), sessionQueryKeys, formatSessionStatus(), getPromptBlockedReason() (+3 more)

### Community 73 - "ui-gateway.browser-auth.integration.test.ts"
Cohesion: 0.29
Nodes (7): mapMessage(), MessagesRepositoryAdapter, Injectable, CreateMessageInput, MessagesRepository, PersistenceRepositories, SessionMessage

### Community 74 - "external-identities.repository.ts"
Cohesion: 0.16
Nodes (12): ToolReadinessController, Controller, Get, HttpCode, Inject, Param, Post, Req (+4 more)

### Community 75 - "ToolReadinessService"
Cohesion: 0.08
Nodes (19): AgentProjectBindingService, repositoriesMatch(), Injectable, mapProject(), ProjectsRepositoryAdapter, Inject, Injectable, ProjectReadinessRepository (+11 more)

### Community 76 - "pm-activity-page.tsx"
Cohesion: 0.07
Nodes (28): ButtonProps, ButtonVariant, variantClasses, AgentProjectOption, DeveloperProjectForm(), DeveloperProjectFormProps, ProjectFormState, ProjectSetupStateProps (+20 more)

### Community 77 - "commands.ts"
Cohesion: 0.23
Nodes (6): ConnectedSocket, MessageBody, SubscribeMessage, BackendEventRejectedError, AgentEventEnvelope, ErrorEventEnvelope

### Community 78 - "package.json"
Cohesion: 0.17
Nodes (11): dependencies, zod, exports, zod, name, private, scripts, build (+3 more)

### Community 79 - "validation.integration.test.ts"
Cohesion: 0.12
Nodes (15): Actors, Assumptions, Fixed constraints, Functional requirements, Goals, Handoff summary, Non-functional requirements, Non-goals for MVP (+7 more)

### Community 80 - "shared-projects.integration.test.ts"
Cohesion: 0.21
Nodes (8): announceAgent(), authenticatePm(), prisma, publishReadiness(), sendAgentEvent(), startApplication(), waitForConnect(), sharedProjectListResponseSchema

### Community 81 - "mappers.ts"
Cohesion: 0.23
Nodes (6): buildAgentCancelCommand(), buildAgentPromptCommand(), SessionPromptService, toAttachmentView(), Injectable, Inject

### Community 82 - "session-prompt.service.ts"
Cohesion: 0.21
Nodes (8): announceAgent(), authenticatePm(), prisma, publishReadiness(), sendAgentEvent(), startApplication(), waitForConnect(), sessionCreateResponseSchema

### Community 83 - "auth.service.ts"
Cohesion: 0.25
Nodes (7): mapSourceControlConnection(), SourceControlConnectionsRepositoryAdapter, Inject, Injectable, CreateSourceControlConnectionInput, SourceControlConnectionsRepository, SourceControlConnection

### Community 84 - "AgentCommandEnvelope"
Cohesion: 0.25
Nodes (14): loadAgentConfig(), resolveAgentConfigPath(), saveAgentConfig(), summarizeAgentConfig(), main(), parseModelMapping(), parseModelMappings(), parseProjectMapping() (+6 more)

### Community 85 - "BT-050 — Same-email cross-role accounts remain independent"
Cohesion: 0.15
Nodes (15): PromptComposer(), PromptComposerProps, ReviewRequestDialog(), ReviewRequestDialogProps, ACCEPTED_IMAGE_TYPES, appendScreenshotFiles(), AppendScreenshotFilesOptions, ClipboardDataWithItems (+7 more)

### Community 86 - "Screens represented"
Cohesion: 0.13
Nodes (10): Inject, AgentGateway, isCommandAcknowledgement(), Injectable, WebSocketGateway, WebSocketServer, AgentCommandEnvelope, command (+2 more)

### Community 87 - ".create"
Cohesion: 0.13
Nodes (15): DeveloperProjectCard(), DeveloperProjectCardProps, ProjectFactProps, buildProjectMetadataUpdate(), ProjectMetadataForm(), ProjectMetadataFormProps, ProjectMetadataValues, ProjectShareForm() (+7 more)

### Community 88 - ".authenticateDeveloper"
Cohesion: 0.30
Nodes (10): asRecord(), buildSessionConversation(), extractErrorMessage(), humanizeAgentError(), mergeAdjacentAgentOutput(), promoteFinalAgentMessages(), toConversationEvent(), checksResultPayloadSchema (+2 more)

### Community 89 - "agent-command-routing.integration.test.ts"
Cohesion: 0.08
Nodes (26): PmDemoSession, ATTACHMENTS_REPOSITORY, MESSAGES_REPOSITORY, SessionStartSource, allowedProgressTransitions, interruptedOperationStatuses, interruptedPreparationStatuses, InvalidSessionTransitionError (+18 more)

### Community 90 - "agent-gateway.integration.test.ts"
Cohesion: 0.27
Nodes (5): toValidationView(), Inject, Injectable, ValidationService, ChecksResultEventEnvelope

### Community 91 - "AgentCommandEnvelope"
Cohesion: 0.29
Nodes (8): boot(), getReactDOM(), init(), parseDataProps(), parseDcDocument(), parseDcText(), react-dom, react-dom

### Community 92 - "package.json"
Cohesion: 0.20
Nodes (9): devDependencies, prisma, socket.io-client, name, private, type, version, prisma (+1 more)

### Community 94 - "createRuntime"
Cohesion: 0.09
Nodes (12): HealthcheckService, isInsideSensitiveDirectory(), normalizeRelativePath(), SensitiveFilesPolicy, createTempRepository(), execFileAsync, execGit(), FailingClosePreviewTunnelPort (+4 more)

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
Cohesion: 0.10
Nodes (11): mapSession(), SessionsRepositoryAdapter, Inject, Injectable, CreateSessionInput, buildSessionCloseCommand(), SessionStateMachine, SessionsService (+3 more)

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
Cohesion: 0.17
Nodes (15): UploadedScreenshot, ValidatedScreenshot, CreatePromptRequest, SessionsController, Body, Controller, Get, HttpCode (+7 more)

### Community 104 - "package.json"
Cohesion: 0.20
Nodes (5): authenticateDeveloper(), authenticatePm(), createDeveloperProject(), prisma, startApplication()

### Community 105 - "HealthController"
Cohesion: 0.29
Nodes (6): AuthProvider, OAuthStartUrlConfig, DEVELOPER_IDENTITY_PORT, PM_IDENTITY_PORT, AuthEnvironment, isDevelopmentPmAuthEnabled()

### Community 106 - "developer-project-form.tsx"
Cohesion: 0.12
Nodes (18): isToolReadinessKey(), isToolReadinessStatus(), parseToolReadinessCheck(), parseToolReadinessChecks(), serializeChecks(), serializeJsonValue(), serializeToolReadinessCheck(), toInputJsonObject() (+10 more)

### Community 107 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): extends, include, src/**/*.ts, ../../tsconfig.base.json, ../../tests/packages/local-agent/**/*.ts

### Community 108 - "persistence.integration.test.ts"
Cohesion: 0.14
Nodes (6): AgentConnectedEventEnvelope, RecordedHandshake, RecordingRestoreSessionRunner, SessionRunnerWithRecoveredWorkspace, SessionRunnerWithRecoveryFailure, waitFor()

### Community 110 - "AgentEventEnvelope"
Cohesion: 0.12
Nodes (17): base64UrlEncode(), createGithubAppJwt(), deterministicReviewRequestNumber(), Fetcher, GithubBranchResponse, githubHeaders(), GithubInstallationRepositoriesResponse, GithubInstallationTokenResponse (+9 more)

### Community 112 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 113 - "GithubSourceControlAdapter"
Cohesion: 0.20
Nodes (5): createTempRepository(), execFileAsync, execGit(), HARNESS_SCRIPT_PATH, ReadyPreviewTunnelPort

### Community 114 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 115 - "PairDock collaborative developer/PM prototype"
Cohesion: 0.31
Nodes (6): currentDirectory, databaseTargetEnvironment, DatabaseEnvironment, DatabaseTarget, parseDatabaseTarget(), resolveDatabaseConnectionString()

### Community 117 - "ci-gates.test.ts"
Cohesion: 0.29
Nodes (5): apiPackageJson, localAgentPackageJson, repositoryRoot, rootPackageJson, workflowPath

### Community 118 - "main.tsx"
Cohesion: 0.11
Nodes (15): AGENT_AUTHENTICATION_OPTIONS, AgentAuthenticationOptions, AgentAuthenticationService, AgentCredentialInput, AuthenticatedAgentPrincipal, extractBearerToken(), isRecord(), parseCredentials() (+7 more)

### Community 119 - "01 Fixed — Nimbus Trial Button Fix Preview"
Cohesion: 0.50
Nodes (4): 01 Clean — Blank Nimbus Landing Preview, 01 Fixed — Nimbus Trial Button Fix Preview, 02 Clean — Blank Nimbus Landing Preview, 02 Fixed — Nimbus Trial Button Fix Preview

### Community 120 - "SourceControlPort"
Cohesion: 0.15
Nodes (6): authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication(), sessionPromptResponseSchema

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
Cohesion: 0.15
Nodes (6): sessionIdResponseSchema, authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication()

### Community 125 - "agent-prompt-command.integration.test.ts"
Cohesion: 0.11
Nodes (9): buildPrepareCommand(), createManagedWorktreeRoot(), createPreparedValidationFeedbackClient(), createTempRepository(), execFileAsync, execGit(), ReadyPreviewTunnelPort, ReadySandboxPort (+1 more)

### Community 126 - "dependencies"
Cohesion: 0.18
Nodes (11): @pairdock/shared-contracts, socket.io-client, zod, @tanstack/react-form, @tanstack/react-query, dependencies, @pairdock/shared-contracts, socket.io-client (+3 more)

### Community 127 - "@nestjs/websockets"
Cohesion: 0.25
Nodes (5): authenticateDeveloper(), authenticatePm(), prisma, startApplication(), developerProjectResponseSchema

### Community 128 - "AGENTS.md"
Cohesion: 0.17
Nodes (5): authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication()

### Community 129 - "migration.sql"
Cohesion: 0.18
Nodes (10): Architecture documents reconciled, Developer dashboard, Implementation guidance, Login, PM shared-project dashboard, Prototype notes — PairDock collaborative developer/PM, Purpose, Running/fixed/review states (+2 more)

### Community 130 - "review-requests.repository.ts"
Cohesion: 0.11
Nodes (8): PreviewTunnelPort, ReadyPreviewTunnelPort, createTempRepository(), execFileAsync, execGit(), prisma, ReadyPreviewTunnelPort, startApplication()

### Community 131 - "prisma.config.ts"
Cohesion: 0.19
Nodes (7): appendScreenshotsToReviewDescription(), buildConventionalCommitMessage(), buildGitPushBranchCommand(), buildSessionBranchName(), CreateDraftReviewRequestUseCase, escapeMarkdownLabel(), Injectable

### Community 137 - "Containers"
Cohesion: 0.27
Nodes (3): SessionEventFeed, FeedConnectionState, SessionEventFeedSnapshot

### Community 139 - "SessionMembersRepositoryAdapter"
Cohesion: 0.29
Nodes (7): get(), createExternalModules(), createHelmetManager(), createPseudoSheet(), createRegistry(), createRuntime(), Placeholder()

### Community 143 - "validation.integration.test.ts"
Cohesion: 0.22
Nodes (8): exports, name, private, scripts, build, typecheck, type, version

### Community 144 - "pm-activity-page.tsx"
Cohesion: 0.47
Nodes (3): HealthController, Controller, Get

### Community 145 - "SessionsRepositoryAdapter"
Cohesion: 0.18
Nodes (9): createApiClient(), ImageLightbox(), ImageLightboxProps, ConversationScreenshot(), ConversationThread(), ConversationThreadProps, SessionConversationItem, SessionMessageView (+1 more)

### Community 146 - "@nestjs/common"
Cohesion: 0.25
Nodes (7): name, private, scripts, build, lint, test, type

### Community 147 - "Get"
Cohesion: 0.38
Nodes (6): checkLabels, statusTone(), ToolReadinessPanel(), ToolReadinessPanelProps, ToolReadinessRow(), DeveloperProjectReadiness

### Community 148 - "tool-readiness-panel.tsx"
Cohesion: 0.20
Nodes (7): DiffService, isSessionDiffPayload(), SessionDiffView, mapAgentEvent(), AgentEventsRepository, CreateAgentEventInput, AgentEventRecord

### Community 149 - "SessionRegistry"
Cohesion: 0.20
Nodes (8): ExternalIdentitiesRepositoryAdapter, Inject, Injectable, serializeJsonObject(), mapExternalIdentity(), CreateExternalIdentityInput, ExternalIdentitiesRepository, ExternalIdentity

### Community 150 - "Deployment security audit — 2026-07-19"
Cohesion: 0.33
Nodes (5): Deployment security audit — 2026-07-19, Operational requirements and residual risk, Resolved findings, Scope, Verification

### Community 151 - "Deployment security audit — 2026-07-19"
Cohesion: 0.40
Nodes (5): Agent → backend events, Backend → agent commands, Backend ↔ agent WebSocket contract, Common envelope, UI session-start contract

### Community 152 - "development-pm-auth.ts"
Cohesion: 0.40
Nodes (5): Developer dashboard, Frontend product surfaces, Login, PM dashboard, Session workspace

### Community 153 - ".constructor"
Cohesion: 0.20
Nodes (6): extensionFor(), PromptAttachment, PromptAttachmentDownloader, resolveHarnessTempDirectory(), LogRedactor, AgentPromptCommandEnvelope

### Community 154 - "pm-session-page.tsx"
Cohesion: 0.09
Nodes (14): Body, HttpCode, Inject, Post, AuthResult, AuthService, buildFrontendAuthRedirectUrl(), hasAccessibleGithubInstallation() (+6 more)

### Community 158 - "authenticated-request.ts"
Cohesion: 0.40
Nodes (4): Fixtures, MVP E2E scenario, Reproduce locally, What it proves

### Community 159 - "Q: Trace all suggested graph questions using documentation only"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Trace all suggested graph questions using documentation only, Source Nodes

### Community 160 - "PairDock collaborative developer/PM prototype"
Cohesion: 0.40
Nodes (4): Architectural interpretation, Contents, How to view, PairDock collaborative developer/PM prototype

### Community 163 - "@prisma/adapter-pg"
Cohesion: 0.29
Nodes (7): createComponentFactory(), evalDcLogic(), getReact(), walkText(), warnUnresolved(), react, react

### Community 164 - "tool-readiness-panel.tsx"
Cohesion: 0.33
Nodes (3): createRunningProcess(), FakeRunningProcess, spawn()

### Community 166 - "ReadyPreviewTunnelPort"
Cohesion: 0.09
Nodes (25): AgentEventsRepositoryAdapter, Inject, Injectable, Inject, createPersistenceRepositories(), PersistenceUnitOfWorkAdapter, Inject, Injectable (+17 more)

### Community 172 - "@aws-sdk/client-s3"
Cohesion: 0.33
Nodes (4): port, server, createAgentServer(), createAgentServer()

### Community 173 - "host-preview-runtime.integration.test.ts"
Cohesion: 0.50
Nodes (3): createRunningProcess(), FakeRunningProcess, spawn()

## Knowledge Gaps
- **638 isolated node(s):** `Workspace`, `Commands`, `1. GitHub App`, `2. Slack App`, `3. Start PairDock` (+633 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `resolve()` connect `github-developer-identity.adapter.ts` to `@prisma/adapter-pg`, `app-shell.tsx`, `SessionMembersRepositoryAdapter`, `persistence.integration.test.ts`, `support.js`, `AgentCommandEnvelope`, `example-project.integration.test.ts`, `scripts`, `walk`, `createRuntime`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `PairDockIdentity` connect `PairDockIdentity` to `prisma.config.ts`, `SessionRegistry`, `dependencies`, `developer-project-form.tsx`, `SandboxRef`, `HealthController`, `resolve`, `ToolReadinessService`, `external-identities.repository.ts`, `docker-sandbox.adapter.ts`, `tool-readiness.integration.test.ts`, `agent-command-routing.integration.test.ts`, `pm-session-page.tsx`, `AuthTokenService`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`, `AgentCommandEnvelope`, `@prisma/adapter-pg`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `Workspace`, `Commands`, `1. GitHub App` to the rest of the system?**
  _638 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agent-config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13825757575757575 - nodes in this community are weakly interconnected._
- **Should `create-draft-review-request.use-case.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0896551724137931 - nodes in this community are weakly interconnected._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.038461538461538464 - nodes in this community are weakly interconnected._