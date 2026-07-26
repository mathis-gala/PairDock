# Graph Report - PairDock  (2026-07-26)

## Corpus Check
- 297 files · ~132,735 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2733 nodes · 5951 edges · 156 communities (135 shown, 21 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `87876a56`
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
- ToolReadinessService
- pm-activity-page.tsx
- commands.ts
- package.json
- validation.integration.test.ts
- shared-projects.integration.test.ts
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
- tsconfig.json
- persistence.integration.test.ts
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
- 01 Flow — PM Shared Projects Dashboard
- 01 Session 2 — Responsive Fix Session Workspace
- agent-prompt-command.integration.test.ts
- @nestjs/websockets
- AGENTS.md
- migration.sql
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
- @nestjs/common
- Get
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
- Containers
- Prototype Reference Package

## God Nodes (most connected - your core abstractions)
1. `PairDockIdentity` - 51 edges
2. `Behavior test plan — PairDock MVP` - 51 edges
3. `parseJsonResponse()` - 46 edges
4. `DatabaseClient` - 41 edges
5. `SessionRunner` - 40 edges
6. `Session` - 39 edges
7. `SandboxRef` - 39 edges
8. `AgentClient` - 37 edges
9. `AppModule` - 36 edges
10. `Project` - 34 edges

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

## Communities (156 total, 21 thin omitted)

### Community 0 - "agent-config.ts"
Cohesion: 0.14
Nodes (32): agentConfigFileSchema, agentHarnessConfigSchema, agentModelConfigSchema, agentProjectDescriptorSchema, assertHttpUrlTemplate(), assertLoopbackPortMapping(), assertLoopbackUrlTemplate(), assertSafeContainerImage() (+24 more)

### Community 1 - "create-draft-review-request.use-case.ts"
Cohesion: 0.07
Nodes (15): SandboxPort, SandboxRef, SandboxStartInput, HostPreviewRuntimeAdapter, HostPreviewRuntimeDependencies, PreviewRuntimeRouter, PreviewRuntimeRouterDependencies, ReadySandboxPort (+7 more)

### Community 2 - "Button"
Cohesion: 0.04
Nodes (51): Behavior test plan — PairDock MVP, BT-001 — Installable workspace, BT-002 — Session creation is persisted, BT-003 — Agent event is persisted, BT-004 — PM member access is allowed, BT-005 — Non-member access is denied, BT-006 — Valid session transitions, BT-007 — Invalid transition is rejected (+43 more)

### Community 3 - "events.ts"
Cohesion: 0.11
Nodes (14): isCommandAcknowledgement(), agentCancelCommandEnvelopeSchema, AgentCommandEnvelope, agentPromptCommandEnvelopeSchema, ChecksRunCommandEnvelope, checksRunCommandEnvelopeSchema, GitGetDiffCommandEnvelope, gitGetDiffCommandEnvelopeSchema (+6 more)

### Community 4 - "index.ts"
Cohesion: 0.07
Nodes (38): AgentEventEnvelopeInput, EnvelopeMetadata, agentCommandEnvelopeSchema, checkResultSchema, envelopeBaseSchema, isoDateTimeSchema, promptableSessionStatuses, sessionEnvelope() (+30 more)

### Community 5 - "index.ts"
Cohesion: 0.16
Nodes (9): requestJson(), FeedIdentity, feedRegistry, getFeed(), SessionEventFeed, useSessionEventFeed(), getBackendUrl(), FeedConnectionState (+1 more)

### Community 6 - "developer-home-page.tsx"
Cohesion: 0.09
Nodes (18): authApi, DeveloperLoginCard(), PmLoginCard(), PmLoginCardProps, SlackIcon(), Button(), PromptComposer(), PromptComposerProps (+10 more)

### Community 7 - "app-shell.tsx"
Cohesion: 0.11
Nodes (18): assertSafeContainerImage(), buildContainerHardeningArgs(), buildDockerRunArgs(), buildManagedResourceLabels(), buildNodeModulesTmpfsArg(), DockerSandboxAdapter, DockerSandboxAdapterDependencies, findNodeModulesPaths() (+10 more)

### Community 8 - "SandboxRef"
Cohesion: 0.10
Nodes (20): Architecture style, Current repository context, Dependency rules, Diagram links, External ports/adapters, Frontend styling, Local agent structure, Login interface (+12 more)

### Community 9 - "persistence.module.ts"
Cohesion: 0.14
Nodes (25): AgentGatewayModule, Module, AuthModule, Module, InvitationsModule, Module, PersistenceModule, Module (+17 more)

### Community 10 - "PairDockUser"
Cohesion: 0.06
Nodes (29): ExternalIdentitiesRepositoryAdapter, Inject, Injectable, serializeJsonObject(), isExternalIdentityProvider(), mapExternalIdentity(), mapUser(), parseExternalIdentityProvider() (+21 more)

### Community 11 - "client.ts"
Cohesion: 0.20
Nodes (9): createApiClient(), useSharedSessionHistory(), filterSharedSessionHistory(), SessionHistoryFilters, SessionHistoryStatusFilter, PmActivityPage(), PmActivityPageProps, SESSION_STATUS_FILTER_OPTIONS (+1 more)

### Community 12 - "sessions.service.ts"
Cohesion: 0.14
Nodes (11): AuthProvider, AuthService, buildFrontendAuthRedirectUrl(), hasAccessibleGithubInstallation(), OAuthStartUrlConfig, Injectable, DEVELOPER_IDENTITY_PORT, PM_IDENTITY_PORT (+3 more)

### Community 13 - "session.ts"
Cohesion: 0.08
Nodes (17): ApiClient, authHeaders(), AuthProviders, authProvidersSchema, CreateSessionInput, jsonHeaders(), RequestOptions, responseErrorSchema (+9 more)

### Community 14 - "scripts"
Cohesion: 0.05
Nodes (36): @biomejs/biome, apps/*, packages/*, tsx, @types/node, typescript, devDependencies, @biomejs/biome (+28 more)

### Community 15 - "ConnectedAgentsRegistry"
Cohesion: 0.09
Nodes (16): Inject, mapMessage(), MessagesRepositoryAdapter, Inject, Injectable, Inject, Inject, Inject (+8 more)

### Community 16 - "PairDockIdentity"
Cohesion: 0.15
Nodes (8): isRecord(), ProjectsService, resolveUnavailableReason(), Injectable, PairDockIdentity, CreateDeveloperProjectInput, DeveloperProjectSummary, SharedSessionHistoryItem

### Community 17 - "AuthService"
Cohesion: 0.17
Nodes (15): assertStateCookie(), AuthCallbackBody, clearStateCookie(), HeaderResponse, readCookie(), readStateFromRedirectUrl(), secureCookieSuffix(), serializeStateCookie() (+7 more)

### Community 18 - "ProjectPreviewConfig"
Cohesion: 0.33
Nodes (10): ProjectChecksConfig, AgentConfig, AgentModelConfig, AgentProjectDescriptor, SaveAgentConfigInput, ProjectManifestLoadResult, ProjectPreviewConfig, ProjectAgentHarnessConfig (+2 more)

### Community 19 - "support.js"
Cohesion: 0.05
Nodes (58): @pairdock/shared-contracts, socket.io-client, zod, get(), boot(), collectProps(), compileAttr(), compileTemplate() (+50 more)

### Community 20 - "json-parsers.ts"
Cohesion: 0.12
Nodes (7): PreviewTunnelPort, ReadyPreviewTunnelPort, createTempRepository(), execFileAsync, execGit(), HARNESS_SCRIPT_PATH, ReadyPreviewTunnelPort

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
Cohesion: 0.21
Nodes (13): CommandResult, CommandRunner, failed(), failureMessage(), isCodexExecutable(), passed(), ReadinessResult, ReadinessRunner (+5 more)

### Community 25 - "agent-client.ts"
Cohesion: 0.05
Nodes (57): AgentCommandRouterService, Inject, Injectable, AgentExecutionCapabilitiesService, SessionExecutionSelection, Inject, Injectable, isLifecycleProgressStatus() (+49 more)

### Community 26 - "github-source-control.adapter.ts"
Cohesion: 0.16
Nodes (15): base64UrlEncode(), createGithubAppJwt(), deterministicReviewRequestNumber(), Fetcher, GithubBranchResponse, githubHeaders(), GithubInstallationRepositoriesResponse, GithubInstallationTokenResponse (+7 more)

### Community 27 - "package.json"
Cohesion: 0.08
Nodes (23): tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, devDependencies, tailwindcss, @tailwindcss/vite, @types/react (+15 more)

### Community 28 - "mvp-flow.e2e.test.ts"
Cohesion: 0.13
Nodes (16): authenticateDeveloper(), authenticatePm(), closeSession(), createDeveloperProject(), createReviewRequest(), createSession(), createTestRepository(), EXAMPLE_REPOSITORY_FIXTURE (+8 more)

### Community 29 - "AuthTokenService"
Cohesion: 0.07
Nodes (23): AuthTokenOptions, AuthTokenService, hasValidSignature(), isRecord(), isUserKind(), parseTokenPayload(), resolveSecret(), TokenPayload (+15 more)

### Community 30 - "github-developer-identity.adapter.ts"
Cohesion: 0.15
Nodes (7): createTempRepository(), execFileAsync, execGit(), prisma, ReadyPreviewTunnelPort, startApplication(), waitFor()

### Community 31 - "agent-events.repository.ts"
Cohesion: 0.19
Nodes (7): CheckCommandExecutor, CheckResult, ChecksRunner, isTransientPackageExtractionFailure(), RunChecksInput, compactValidationLogs(), RecordingChecksRunner

### Community 32 - "external-identities.repository.ts"
Cohesion: 0.14
Nodes (14): Fetcher, GithubDeveloperIdentityAdapter, GithubDeveloperIdentityConfig, GithubEmailResponse, githubHeaders(), GithubInstallationMetadata, GithubInstallationsResponse, GithubOAuthResponse (+6 more)

### Community 33 - "slack-pm-identity.adapter.ts"
Cohesion: 0.11
Nodes (9): AgentHarnessPort, RunPromptInput, SimulatedAgentHarness, AlwaysChangingHarnessPort, CancellableHarnessPort, InitialChangeOnlyHarnessPort, MutatingHarnessPort, RecordingHarnessPort (+1 more)

### Community 34 - "WorktreeService"
Cohesion: 0.19
Nodes (7): DockerOrphanReconcileInput, DockerOrphanReconciler, DockerOrphanReconcilerDependencies, execFileAsync, listManagedContainers(), ManagedDockerContainer, stopContainers()

### Community 35 - "sessions.controller.ts"
Cohesion: 0.27
Nodes (10): SessionsController, Body, Controller, Get, HttpCode, Param, Post, Req (+2 more)

### Community 36 - "DatabaseExecutor"
Cohesion: 0.11
Nodes (16): isProjectMembershipRole(), mapValidationRun(), parseProjectMembershipRole(), Injectable, ValidationRunsRepositoryAdapter, CreateValidationRunInput, ValidationRunsRepository, Inject (+8 more)

### Community 37 - "ReviewRequestsRepository"
Cohesion: 0.10
Nodes (12): PreparedWorktree, DEFAULT_SESSION_STATE_PATH, FileSessionWorkspaceStore, isMissingFileError(), metadataSchema, stateSchema, toPersistedWorkspace(), workspaceSchema (+4 more)

### Community 38 - "SessionsController"
Cohesion: 0.14
Nodes (16): CommandResult, containerImageSchema, enrichConfigWithProjectManifests(), healthcheckUrlTemplateSchema, isLoopbackPortMappingTemplate(), isValidPort(), loadProjectManifest(), loopbackPortMappingSchema (+8 more)

### Community 39 - "ToolReadinessService"
Cohesion: 0.24
Nodes (5): buildAgentCancelCommand(), buildAgentPromptCommand(), SessionPromptService, Injectable, Inject

### Community 40 - "Implementation handoff — PairDock MVP"
Cohesion: 0.10
Nodes (14): mapSession(), SessionsRepositoryAdapter, Injectable, CreateSessionInput, buildSessionCloseCommand(), allowedProgressTransitions, interruptedOperationStatuses, interruptedPreparationStatuses (+6 more)

### Community 41 - "docker-sandbox.adapter.ts"
Cohesion: 0.16
Nodes (15): assertSafeContainerImage(), buildCloudflareDockerArgs(), buildTunnelContainerName(), CloudflarePreviewTunnelAdapter, CloudflarePreviewTunnelDependencies, ManagedTunnelProcess, onceExit(), resolveRestoredTunnelContainerName() (+7 more)

### Community 42 - "session-runner.ts"
Cohesion: 0.09
Nodes (21): buildHostCommandEnvironment(), HostCheckCommandExecutor, HostCheckCommandExecutorDependencies, HostCheckCommandInput, HostCheckCommandRunner, HostCommandSpawnOptions, SAFE_HOST_COMMAND_ENVIRONMENT_KEYS, appendLogs() (+13 more)

### Community 43 - "ui.ts"
Cohesion: 0.18
Nodes (9): ConnectionActivityRail(), ConnectionActivityRailProps, RailMetricProps, ShareDeveloperProjectInput, UpdateExecutionDefaultsInput, useDeveloperProjects(), DeveloperHomePage(), ErrorCardProps (+1 more)

### Community 44 - "tool-readiness.integration.test.ts"
Cohesion: 0.31
Nodes (7): AuthController, Body, Controller, HttpCode, Inject, Post, AuthResult

### Community 45 - "tool-readiness-panel.tsx"
Cohesion: 0.12
Nodes (15): Actors, Assumptions, Fixed constraints, Functional requirements, Goals, Handoff summary, Non-functional requirements, Non-goals for MVP (+7 more)

### Community 46 - "session-details.integration.test.ts"
Cohesion: 0.21
Nodes (7): branchExists(), execFileAsync, execGit(), pathExists(), remoteExists(), WorktreeService, BlockingPushWorktreeService

### Community 47 - "diff.service.ts"
Cohesion: 0.09
Nodes (19): DeveloperProjectCard(), DeveloperProjectCardProps, ProjectFactProps, ProjectShareForm(), ProjectShareFormProps, SessionControlCard(), SessionControlCardProps, checkLabels (+11 more)

### Community 48 - "command-handling.integration.test.ts"
Cohesion: 0.08
Nodes (12): HealthcheckService, HealthcheckTimeoutError, HealthcheckWaitInput, HealthcheckResult, createTempRepository(), emitCommandWithAcknowledgement(), execFileAsync, execGit() (+4 more)

### Community 49 - "codex-model-catalog.ts"
Cohesion: 0.19
Nodes (12): applyCodexCommandToProjects(), CodexCatalogOptions, CodexInstallation, codexModelCacheSchema, codexModelSchema, codexReasoningLevelSchema, compareVersions(), enrichConfigWithCodexModels() (+4 more)

### Community 50 - "DatabaseClient"
Cohesion: 0.33
Nodes (4): port, server, createAgentServer(), createAgentServer()

### Community 51 - "example-project.integration.test.ts"
Cohesion: 0.13
Nodes (16): AgentHarnessEvent, AgentHarnessEventQueue, buildCodexPrompt(), buildCodexSecurityArgs(), buildCommandArgs(), buildHarnessEnvironment(), CodexHarnessAdapter, isCodexCommand() (+8 more)

### Community 52 - "AgentClient"
Cohesion: 0.13
Nodes (22): AgentClient, AgentClientLogger, buildValidationRepairPrompt(), hasRepairableCheckFailure(), isRetryableError(), buildAgentConnectedEvent(), buildAgentDoneEvent(), buildAgentOutputEvent() (+14 more)

### Community 53 - "test-json.ts"
Cohesion: 0.20
Nodes (5): authenticateDeveloper(), authenticatePm(), createDeveloperProject(), prisma, startApplication()

### Community 54 - "SessionsService"
Cohesion: 0.12
Nodes (14): authenticatePm(), prisma, authenticatePm(), prisma, startApplication(), authenticatePm(), prisma, startApplication() (+6 more)

### Community 55 - "AuthenticatedRequest"
Cohesion: 0.08
Nodes (30): DiffService, isSessionDiffPayload(), SessionDiffView, AgentEventsRepositoryAdapter, Injectable, isToolReadinessKey(), isToolReadinessStatus(), parseJsonObject() (+22 more)

### Community 56 - "SessionsService"
Cohesion: 0.20
Nodes (11): PreviewAreaSize, PreviewFrame(), PreviewFrameProps, PreviewToolbar(), PreviewToolbarProps, getFittedPreviewScale(), getPreviewFrameStyle(), isPreviewPresetId() (+3 more)

### Community 57 - "PRD — PairDock MVP"
Cohesion: 0.12
Nodes (16): scripts, build, db:migrate, db:migrate:dev, db:migrate:test, db:reset, db:seed:pm-demo, db:status (+8 more)

### Community 58 - "slack-pm-identity.adapter.ts"
Cohesion: 0.12
Nodes (14): readGithubConfig(), Fetcher, parseFixtureIdentity(), readSlackConfig(), SlackAuthTestResponse, slackHeaders(), SlackOAuthResponse, SlackPmIdentityAdapter (+6 more)

### Community 59 - "dependencies"
Cohesion: 0.13
Nodes (15): @pairdock/shared-contracts, socket.io, @nestjs/common, @nestjs/core, @nestjs/websockets, @prisma/adapter-pg, @prisma/client, dependencies (+7 more)

### Community 60 - "Backend NestJS modules"
Cohesion: 0.09
Nodes (19): InvitationsService, Inject, Injectable, mapProjectMembership(), mapSessionMember(), ProjectMembersRepositoryAdapter, Injectable, SessionMembersRepositoryAdapter (+11 more)

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
Cohesion: 0.21
Nodes (4): buildSessionPrepareCommand(), formatUserDisplayName(), SessionsService, Injectable

### Community 65 - "use-app-route.ts"
Cohesion: 0.14
Nodes (21): AppShell(), getAppRouteSnapshot(), loginRoute, openDeveloperHome(), openLogin(), openPmDashboard(), openPmReviewRequests(), openPmSession() (+13 more)

### Community 66 - "compilerOptions"
Cohesion: 0.14
Nodes (13): node, compilerOptions, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, noEmit (+5 more)

### Community 67 - "session-access.guard.ts"
Cohesion: 0.33
Nodes (13): "agent_events", "agent_registrations", "external_identities", "github_installations", "messages", "project_members", "project_readiness_snapshots", "projects" (+5 more)

### Community 69 - "Product"
Cohesion: 0.21
Nodes (10): BrandIconProps, GitHubIcon(), GitMergeIcon(), GitPullRequestClosedIcon(), GitPullRequestIcon(), PullRequestStatusLink(), resolvePullRequestLabel(), resolvePullRequestState() (+2 more)

### Community 70 - "dependencies"
Cohesion: 0.17
Nodes (6): authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication(), sessionPromptResponseSchema

### Community 71 - "developer-project-form.tsx"
Cohesion: 0.14
Nodes (8): errorMessage(), SessionRunner, GitPushBranchCommandEnvelope, SessionCloseCommandEnvelope, SessionPrepareCommandEnvelope, RecordingRestoreSessionRunner, SessionRunnerWithRecoveredWorkspace, SessionRunnerWithRecoveryFailure

### Community 72 - "V1 developer setup"
Cohesion: 0.14
Nodes (13): 1. GitHub App, 2. Slack App, 3. Start PairDock, 4. Cloudflare Tunnel, 5. Add `pairdock.yml`, 6. Configure the local agent, 7. Create a PairDock project, Commands (+5 more)

### Community 73 - "ui-gateway.browser-auth.integration.test.ts"
Cohesion: 0.15
Nodes (6): sessionIdResponseSchema, authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication()

### Community 75 - "ToolReadinessService"
Cohesion: 0.16
Nodes (12): ToolReadinessController, Controller, Get, HttpCode, Inject, Param, Post, Req (+4 more)

### Community 76 - "pm-activity-page.tsx"
Cohesion: 0.08
Nodes (25): ButtonProps, ButtonVariant, variantClasses, AgentProjectOption, DeveloperProjectForm(), DeveloperProjectFormProps, ProjectFormState, ProjectSetupStateProps (+17 more)

### Community 77 - "commands.ts"
Cohesion: 0.14
Nodes (10): AgentGateway, ConnectedSocket, Injectable, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, cloneSnapshot() (+2 more)

### Community 78 - "package.json"
Cohesion: 0.17
Nodes (11): dependencies, zod, exports, zod, name, private, scripts, build (+3 more)

### Community 79 - "validation.integration.test.ts"
Cohesion: 0.19
Nodes (9): announceAgent(), authenticatePm(), prisma, publishReadiness(), sendAgentEvent(), startApplication(), waitForConnect(), waitForReadiness() (+1 more)

### Community 80 - "shared-projects.integration.test.ts"
Cohesion: 0.19
Nodes (9): announceAgent(), authenticatePm(), prisma, publishReadiness(), sendAgentEvent(), startApplication(), waitForConnect(), waitForReadiness() (+1 more)

### Community 82 - "session-prompt.service.ts"
Cohesion: 0.24
Nodes (11): DEVELOPMENT_PM, main(), assertLocalDevelopmentSeedTarget(), buildPmDemoSessions(), demoDiff(), deterministicUuid(), passingValidation(), PmDemoMessage (+3 more)

### Community 83 - "auth.service.ts"
Cohesion: 0.21
Nodes (11): AgentRegistrationsRepositoryAdapter, isRecord(), mapAgentRegistration(), parseModels(), parseProjects(), parseStringArray(), Inject, Injectable (+3 more)

### Community 84 - "AgentCommandEnvelope"
Cohesion: 0.25
Nodes (14): loadAgentConfig(), resolveAgentConfigPath(), saveAgentConfig(), summarizeAgentConfig(), main(), parseModelMapping(), parseModelMappings(), parseProjectMapping() (+6 more)

### Community 85 - "BT-050 — Same-email cross-role accounts remain independent"
Cohesion: 0.16
Nodes (14): AuthenticatedRequest, AuthenticatedUserGuard, Injectable, RequireAuth(), ProjectsController, Body, Controller, Get (+6 more)

### Community 86 - "Screens represented"
Cohesion: 0.18
Nodes (10): Architecture documents reconciled, Developer dashboard, Implementation guidance, Login, PM shared-project dashboard, Prototype notes — PairDock collaborative developer/PM, Purpose, Running/fixed/review states (+2 more)

### Community 87 - ".create"
Cohesion: 0.22
Nodes (8): exports, name, private, scripts, build, typecheck, type, version

### Community 88 - ".authenticateDeveloper"
Cohesion: 0.12
Nodes (22): ConversationThread(), ConversationThreadProps, ReviewRequestDialog(), ReviewRequestDialogProps, useSessionData(), asRecord(), buildSessionConversation(), extractErrorMessage() (+14 more)

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
Cohesion: 0.11
Nodes (10): isInsideSensitiveDirectory(), normalizeRelativePath(), SensitiveFilesPolicy, createTempRepository(), execFileAsync, execGit(), FailingClosePreviewTunnelPort, FakeHostCommandExecutor (+2 more)

### Community 95 - "PairDock Interactive Prototype"
Cohesion: 0.12
Nodes (13): Inject, assertInstallationId(), GithubAuthStateOptions, GithubAuthStatePayload, GithubAuthStatePurpose, GithubAuthStateService, hasValidSignature(), invalidState() (+5 more)

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
Cohesion: 0.15
Nodes (14): mapSourceControlConnection(), SourceControlConnectionsRepositoryAdapter, Injectable, createPersistenceRepositories(), PersistenceUnitOfWorkAdapter, Injectable, PersistenceRepositories, PersistenceUnitOfWork (+6 more)

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
Cohesion: 0.25
Nodes (3): AgentConnectedEventEnvelope, RecordedHandshake, waitFor()

### Community 104 - "package.json"
Cohesion: 0.25
Nodes (5): authenticateDeveloper(), authenticatePm(), prisma, startApplication(), developerProjectResponseSchema

### Community 105 - "HealthController"
Cohesion: 0.19
Nodes (8): mapReviewRequest(), ReviewRequestsRepositoryAdapter, Inject, Injectable, CreateReviewRequestInput, ReviewRequestsRepository, ReviewRequestRecord, InMemoryReviewRequestsRepository

### Community 107 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): extends, include, src/**/*.ts, ../../tsconfig.base.json, ../../tests/packages/local-agent/**/*.ts

### Community 108 - "persistence.integration.test.ts"
Cohesion: 0.29
Nodes (3): Inject, DatabaseClient, Injectable

### Community 110 - "AgentEventEnvelope"
Cohesion: 0.47
Nodes (3): ChecksResult, SequencedChecksRunner, WorktreeMutatingChecksRunner

### Community 112 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 113 - "GithubSourceControlAdapter"
Cohesion: 0.50
Nodes (3): createRunningProcess(), FakeRunningProcess, spawn()

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

### Community 120 - "SourceControlPort"
Cohesion: 0.11
Nodes (10): VALIDATION_RUNS_REPOSITORY, buildConventionalCommitMessage(), buildGitPushBranchCommand(), buildSessionBranchName(), CreateDraftReviewRequestUseCase, DraftReviewRequestResult, Injectable, SOURCE_CONTROL_PORT (+2 more)

### Community 122 - "01 Flow — PM Shared Projects Dashboard"
Cohesion: 0.67
Nodes (3): 01 Dev — Developer Shared Projects Dashboard, 01 Flow — PM Shared Projects Dashboard, 02 Flow — PM Shared Projects Dashboard

### Community 123 - "01 Session 2 — Responsive Fix Session Workspace"
Cohesion: 0.67
Nodes (3): 01 Session 2 — Responsive Fix Session Workspace, 01 Session 3 — Responsive Fix Session Workspace, 02 Dev — Responsive Fix Session Workspace

### Community 125 - "agent-prompt-command.integration.test.ts"
Cohesion: 0.11
Nodes (9): buildPrepareCommand(), createManagedWorktreeRoot(), createPreparedValidationFeedbackClient(), createTempRepository(), execFileAsync, execGit(), ReadyPreviewTunnelPort, ReadySandboxPort (+1 more)

### Community 127 - "@nestjs/websockets"
Cohesion: 0.18
Nodes (7): AppModule, Module, bootstrap(), startApplication(), prisma, startApplication(), waitFor()

### Community 128 - "AGENTS.md"
Cohesion: 0.40
Nodes (4): Fixtures, MVP E2E scenario, Reproduce locally, What it proves

### Community 129 - "migration.sql"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Trace all suggested graph questions using documentation only, Source Nodes

### Community 131 - "prisma.config.ts"
Cohesion: 0.24
Nodes (8): currentDirectory, databaseTargetEnvironment, buildAdapter(), currentDirectory, DatabaseEnvironment, DatabaseTarget, parseDatabaseTarget(), resolveDatabaseConnectionString()

### Community 137 - "Containers"
Cohesion: 0.40
Nodes (4): Architectural interpretation, Contents, How to view, PairDock collaborative developer/PM prototype

### Community 139 - "SessionMembersRepositoryAdapter"
Cohesion: 0.33
Nodes (5): Deployment security audit — 2026-07-19, Operational requirements and residual risk, Resolved findings, Scope, Verification

### Community 143 - "validation.integration.test.ts"
Cohesion: 0.11
Nodes (9): authenticateDeveloper(), createSession(), prisma, startApplication(), authenticateDeveloper(), prisma, startApplication(), idResponseSchema (+1 more)

### Community 144 - "pm-activity-page.tsx"
Cohesion: 0.47
Nodes (3): HealthController, Controller, Get

### Community 147 - "Get"
Cohesion: 0.16
Nodes (9): mapProject(), ProjectsRepositoryAdapter, Injectable, CreateProjectInput, DeveloperProjectRecord, ProjectsRepository, SharedProjectRecord, Inject (+1 more)

### Community 150 - "SharedProjectSummary"
Cohesion: 0.18
Nodes (12): SharedProjectCard(), SharedProjectCardProps, ProductShell(), SessionStarted, StartPmSessionInput, useSharedProjects(), UseSharedProjectsResult, PmDashboardPage() (+4 more)

### Community 154 - "ui.ts"
Cohesion: 0.08
Nodes (23): createDeveloperProjectInputSchema, createDraftReviewRequestInputSchema, developerProjectReadinessSchema, developerProjectSessionSummarySchema, developerProjectSetupSchema, developerProjectSummaryListSchema, developerProjectSummarySchema, DeveloperSetupAgent (+15 more)

### Community 159 - "PairDock collaborative developer/PM prototype"
Cohesion: 0.40
Nodes (5): Agent → backend events, Backend → agent commands, Backend ↔ agent WebSocket contract, Common envelope, UI session-start contract

### Community 160 - "Frontend product surfaces"
Cohesion: 0.40
Nodes (5): Developer dashboard, Frontend product surfaces, Login, PM dashboard, Session workspace

## Knowledge Gaps
- **614 isolated node(s):** `ManagedSandboxProcess`, `SandboxSpawnOptions`, `SandboxSpawn`, `name`, `private` (+609 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PairDockIdentity` connect `PairDockIdentity` to `agent-command-routing.integration.test.ts`, `source-control-connections.repository.ts`, `SessionRegistry`, `ToolReadinessService`, `sessions.service.ts`, `tool-readiness.integration.test.ts`, `BT-050 — Same-email cross-role accounts remain independent`, `AuthenticatedRequest`, `SourceControlPort`, `agent-client.ts`, `Backend NestJS modules`, `AuthTokenService`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `resolve()` connect `support.js` to `slack-pm-identity.adapter.ts`, `resolve`, `validation.integration.test.ts`, `command-handling.integration.test.ts`, `shared-projects.integration.test.ts`, `example-project.integration.test.ts`, `AgentCommandEnvelope`, `github-developer-identity.adapter.ts`, `@nestjs/websockets`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `dependencies` connect `support.js` to `package.json`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `ManagedSandboxProcess`, `SandboxSpawnOptions`, `SandboxSpawn` to the rest of the system?**
  _614 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agent-config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13825757575757575 - nodes in this community are weakly interconnected._
- **Should `create-draft-review-request.use-case.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06558441558441558 - nodes in this community are weakly interconnected._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.038461538461538464 - nodes in this community are weakly interconnected._