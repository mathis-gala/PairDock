# Graph Report - PairDock  (2026-07-26)

## Corpus Check
- 322 files · ~144,357 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2943 nodes · 6009 edges · 183 communities (152 shown, 31 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 115 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1f4b01b3`
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
- SharedProjectSummary
- Deployment security audit — 2026-07-19
- development-pm-auth.ts
- .constructor
- pm-session-page.tsx
- @pairdock/shared-contracts
- MVP E2E scenario
- Q: Trace all suggested graph questions using documentation only
- authenticated-request.ts
- PairDock collaborative developer/PM prototype
- Frontend product surfaces
- session-state-machine.ts
- ChecksResult
- Containers
- tool-readiness-panel.tsx
- .create
- ReadyPreviewTunnelPort
- session-attachments.service.ts
- ChecksResult
- .register
- EmptySessionAttachmentsService
- Prototype Reference Package
- Res
- @nestjs/core
- @nestjs/websockets
- @prisma/adapter-pg
- socket.io
- migration.sql
- Post
- RequireAuth

## God Nodes (most connected - your core abstractions)
1. `PairDockIdentity` - 51 edges
2. `Behavior test plan — PairDock MVP` - 51 edges
3. `parseJsonResponse()` - 46 edges
4. `SandboxRef` - 45 edges
5. `Session` - 39 edges
6. `SessionRunner` - 37 edges
7. `DatabaseClient` - 35 edges
8. `Project` - 34 edges
9. `AgentClient` - 32 edges
10. `AppModule` - 32 edges

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
  tests/apps/api/integration/projects/shared-projects.integration.test.ts → apps/api/src/app.module.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Nimbus Trial Button Correction States** — prototype_screenshots_01_clean_blank_landing_preview, prototype_screenshots_01_fixed_nimbus_trial_button_fix, prototype_screenshots_02_clean_blank_landing_preview, prototype_screenshots_02_fixed_nimbus_trial_button_fix [INFERRED 0.85]
- **Responsive Fix Session Workspace States** — prototype_screenshots_01_sess2_responsive_session_workspace, prototype_screenshots_01_sess3_responsive_session_workspace, prototype_screenshots_02_dev_responsive_session_workspace, prototype_screenshots_02_sess2_responsive_session_workspace, prototype_screenshots_02_sess3_responsive_session_workspace [INFERRED 0.85]
- **Correction Workflow Screenshots** — prototype_screenshots_03_clean_clean_correction_prompt_state, prototype_screenshots_03_dev_developer_correction_request_state, prototype_screenshots_03_flow_correction_workflow_state, prototype_screenshots_sess4_session_correction_request_state [INFERRED 0.85]

## Communities (183 total, 31 thin omitted)

### Community 0 - "agent-config.ts"
Cohesion: 0.14
Nodes (32): agentConfigFileSchema, agentHarnessConfigSchema, agentModelConfigSchema, agentProjectDescriptorSchema, assertHttpUrlTemplate(), assertLoopbackPortMapping(), assertLoopbackUrlTemplate(), assertSafeContainerImage() (+24 more)

### Community 1 - "create-draft-review-request.use-case.ts"
Cohesion: 0.07
Nodes (14): HealthcheckWaitInput, SandboxPort, SandboxRef, SandboxStartInput, PreviewRuntimeRouter, PreviewRuntimeRouterDependencies, ReadySandboxPort, ReadySandboxPort (+6 more)

### Community 2 - "Button"
Cohesion: 0.04
Nodes (51): Behavior test plan — PairDock MVP, BT-001 — Installable workspace, BT-002 — Session creation is persisted, BT-003 — Agent event is persisted, BT-004 — PM member access is allowed, BT-005 — Non-member access is denied, BT-006 — Valid session transitions, BT-007 — Invalid transition is rejected (+43 more)

### Community 3 - "events.ts"
Cohesion: 0.16
Nodes (11): AGENT_AUTHENTICATION_OPTIONS, AgentAuthenticationOptions, AgentAuthenticationService, AgentCredentialInput, AuthenticatedAgentPrincipal, extractBearerToken(), isRecord(), parseCredentials() (+3 more)

### Community 4 - "index.ts"
Cohesion: 0.08
Nodes (27): checkResultSchema, envelopeBaseSchema, isoDateTimeSchema, promptableSessionStatuses, sessionEnvelope(), SessionStatus, sessionStatusSchema, toolReadinessCheckSchema (+19 more)

### Community 5 - "index.ts"
Cohesion: 0.13
Nodes (18): allocateHostPort(), assertSafeContainerImage(), buildContainerHardeningArgs(), buildDockerRunArgs(), buildManagedResourceLabels(), buildNodeModulesTmpfsArg(), discardStaleDependencyCache(), DockerSandboxAdapter (+10 more)

### Community 6 - "developer-home-page.tsx"
Cohesion: 0.08
Nodes (22): authApi, DeveloperLoginCard(), PmLoginCard(), PmLoginCardProps, GitHubIcon(), SlackIcon(), Button(), ProjectShareFormProps (+14 more)

### Community 7 - "app-shell.tsx"
Cohesion: 0.11
Nodes (25): AgentHarnessEvent, AgentHarnessEventQueue, buildCodexPrompt(), buildCodexSecurityArgs(), buildCommandArgs(), buildHarnessEnvironment(), CodexHarnessAdapter, denySiblingPaths() (+17 more)

### Community 8 - "SandboxRef"
Cohesion: 0.10
Nodes (20): Architecture style, Current repository context, Dependency rules, Diagram links, External ports/adapters, Frontend styling, Local agent structure, Login interface (+12 more)

### Community 9 - "persistence.module.ts"
Cohesion: 0.13
Nodes (21): AgentGatewayModule, Module, AuthModule, Module, InvitationsModule, Module, PersistenceModule, Module (+13 more)

### Community 10 - "PairDockUser"
Cohesion: 0.16
Nodes (9): mapUser(), Injectable, UsersRepositoryAdapter, CreateUserInput, UsersRepository, Inject, Injectable, UsersService (+1 more)

### Community 11 - "client.ts"
Cohesion: 0.18
Nodes (10): createApiClient(), ConversationScreenshot(), useSharedSessionHistory(), filterSharedSessionHistory(), SessionHistoryFilters, SessionHistoryStatusFilter, PmActivityPage(), PmActivityPageProps (+2 more)

### Community 12 - "sessions.service.ts"
Cohesion: 0.10
Nodes (20): errorMessage(), SessionRunner, AgentCancelCommandEnvelope, agentCancelCommandEnvelopeSchema, agentCommandEnvelopeSchema, AgentPromptCommandEnvelope, agentPromptCommandEnvelopeSchema, ChecksRunCommandEnvelope (+12 more)

### Community 13 - "session.ts"
Cohesion: 0.07
Nodes (16): ApiClient, authHeaders(), AuthProviders, authProvidersSchema, CreateSessionInput, jsonHeaders(), RequestOptions, responseErrorSchema (+8 more)

### Community 14 - "scripts"
Cohesion: 0.05
Nodes (36): @biomejs/biome, apps/*, packages/*, tsx, @types/node, typescript, devDependencies, @biomejs/biome (+28 more)

### Community 15 - "ConnectedAgentsRegistry"
Cohesion: 0.20
Nodes (11): PreviewAreaSize, PreviewFrame(), PreviewFrameProps, PreviewToolbar(), PreviewToolbarProps, getFittedPreviewScale(), getPreviewFrameStyle(), isPreviewPresetId() (+3 more)

### Community 16 - "PairDockIdentity"
Cohesion: 0.17
Nodes (8): isRecord(), ProjectsService, resolveUnavailableReason(), Injectable, PairDockIdentity, DeveloperProjectSetup, DeveloperProjectSummary, SharedSessionHistoryItem

### Community 17 - "AuthService"
Cohesion: 0.25
Nodes (15): assertStateCookie(), AuthCallbackBody, AuthController, clearStateCookie(), HeaderResponse, readCookie(), readStateFromRedirectUrl(), secureCookieSuffix() (+7 more)

### Community 18 - "ProjectPreviewConfig"
Cohesion: 0.11
Nodes (17): AttachmentsRepositoryAdapter, Inject, Injectable, isExternalIdentityProvider(), isProjectMembershipRole(), mapAttachment(), parseAttachmentPurpose(), parseAttachmentVisibility() (+9 more)

### Community 19 - "support.js"
Cohesion: 0.09
Nodes (17): get(), compileTemplate(), createExternalModules(), createHelmetManager(), createPseudoSheet(), createRegistry(), createRuntime(), dcNameFromPath() (+9 more)

### Community 20 - "json-parsers.ts"
Cohesion: 0.13
Nodes (10): isCommandAcknowledgement(), AgentProjectBindingService, repositoriesMatch(), Inject, Injectable, resolveDeveloperReadinessFailure(), SessionStartPolicy, Inject (+2 more)

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
Nodes (14): CommandResult, CommandRunner, failed(), failureMessage(), isCodexExecutable(), passed(), ReadinessResult, ReadinessRunner (+6 more)

### Community 25 - "agent-client.ts"
Cohesion: 0.07
Nodes (29): DEVELOPMENT_PM, main(), assertLocalDevelopmentSeedTarget(), buildPmDemoSessions(), demoDiff(), deterministicUuid(), passingValidation(), PmDemoMessage (+21 more)

### Community 26 - "github-source-control.adapter.ts"
Cohesion: 0.24
Nodes (7): ExternalIdentitiesRepositoryAdapter, Injectable, serializeJsonObject(), mapExternalIdentity(), CreateExternalIdentityInput, ExternalIdentitiesRepository, ExternalIdentity

### Community 27 - "package.json"
Cohesion: 0.15
Nodes (13): tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, devDependencies, tailwindcss, @tailwindcss/vite, @types/react (+5 more)

### Community 28 - "mvp-flow.e2e.test.ts"
Cohesion: 0.08
Nodes (21): authenticateDeveloper(), authenticatePm(), closeSession(), createDeveloperProject(), createReviewRequest(), createSession(), createTestRepository(), EXAMPLE_REPOSITORY_FIXTURE (+13 more)

### Community 29 - "AuthTokenService"
Cohesion: 0.12
Nodes (14): AuthTokenOptions, AuthTokenService, hasValidSignature(), isRecord(), isUserKind(), parseTokenPayload(), resolveSecret(), TokenPayload (+6 more)

### Community 30 - "github-developer-identity.adapter.ts"
Cohesion: 0.25
Nodes (8): findTopLevelEquality(), parensWrapWhole(), resolve(), resolvePath(), waitFor(), waitForReadiness(), waitForReadiness(), emitCommandWithAcknowledgement()

### Community 31 - "agent-events.repository.ts"
Cohesion: 0.14
Nodes (10): CheckCommandExecutor, CheckResult, ChecksResult, ChecksRunner, isTransientPackageExtractionFailure(), RunChecksInput, compactValidationLogs(), RecordingChecksRunner (+2 more)

### Community 32 - "external-identities.repository.ts"
Cohesion: 0.07
Nodes (30): Fetcher, GithubDeveloperIdentityAdapter, GithubDeveloperIdentityConfig, GithubEmailResponse, githubHeaders(), GithubInstallationMetadata, GithubInstallationsResponse, GithubOAuthResponse (+22 more)

### Community 34 - "WorktreeService"
Cohesion: 0.06
Nodes (31): DeveloperProjectFormProps, ShareDeveloperProjectInput, UpdateExecutionDefaultsInput, CreateDeveloperProjectInput, CreateDraftReviewRequestInput, createDraftReviewRequestInputSchema, developerProjectReadinessSchema, DeveloperProjectSessionSummary (+23 more)

### Community 35 - "sessions.controller.ts"
Cohesion: 0.06
Nodes (29): buildPrepareRunArgs(), createDockerDependencyCacheKey(), createMissingMountpoints(), DockerCommandResult, DockerDependencyPrewarmer, DockerDependencyPrewarmerDependencies, DockerDependencyPrewarmerLogger, errorMessage() (+21 more)

### Community 36 - "DatabaseExecutor"
Cohesion: 0.19
Nodes (9): DiffService, isSessionDiffPayload(), SessionDiffView, AgentEventsRepositoryAdapter, Injectable, mapAgentEvent(), AgentEventsRepository, CreateAgentEventInput (+1 more)

### Community 37 - "ReviewRequestsRepository"
Cohesion: 0.10
Nodes (12): PreparedWorktree, DEFAULT_SESSION_STATE_PATH, FileSessionWorkspaceStore, isMissingFileError(), metadataSchema, stateSchema, toPersistedWorkspace(), workspaceSchema (+4 more)

### Community 38 - "SessionsController"
Cohesion: 0.14
Nodes (16): CommandResult, containerImageSchema, enrichConfigWithProjectManifests(), healthcheckUrlTemplateSchema, isLoopbackPortMappingTemplate(), isValidPort(), loadProjectManifest(), loopbackPortMappingSchema (+8 more)

### Community 39 - "ToolReadinessService"
Cohesion: 0.11
Nodes (24): AgentEventEnvelopeInput, buildAgentConnectedEvent(), buildAgentDoneEvent(), buildAgentOutputEvent(), buildChecksResultEvent(), buildEnvelope(), buildErrorEvent(), buildGitBranchPushedEvent() (+16 more)

### Community 40 - "Implementation handoff — PairDock MVP"
Cohesion: 0.28
Nodes (7): mapProjectMembership(), ProjectMembersRepositoryAdapter, Injectable, AddProjectMemberInput, ProjectMembersRepository, ProjectMembership, ProjectMembershipRole

### Community 41 - "docker-sandbox.adapter.ts"
Cohesion: 0.16
Nodes (15): assertSafeContainerImage(), buildCloudflareDockerArgs(), buildTunnelContainerName(), CloudflarePreviewTunnelAdapter, CloudflarePreviewTunnelDependencies, ManagedTunnelProcess, onceExit(), resolveRestoredTunnelContainerName() (+7 more)

### Community 42 - "session-runner.ts"
Cohesion: 0.07
Nodes (22): buildHostCommandEnvironment(), HostCheckCommandExecutor, HostCheckCommandExecutorDependencies, HostCheckCommandInput, HostCheckCommandRunner, HostCommandSpawnOptions, SAFE_HOST_COMMAND_ENVIRONMENT_KEYS, appendLogs() (+14 more)

### Community 43 - "ui.ts"
Cohesion: 0.31
Nodes (10): ProjectChecksConfig, AgentConfig, AgentProjectDescriptor, SaveAgentConfigInput, ProjectManifestLoadResult, PrepareAllInput, ProjectPreviewConfig, ProjectAgentHarnessConfig (+2 more)

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
Cohesion: 0.22
Nodes (6): DeveloperProjectCard(), DeveloperProjectCardProps, ProjectFactProps, ProjectShareForm(), SessionControlCard(), SessionControlCardProps

### Community 48 - "command-handling.integration.test.ts"
Cohesion: 0.09
Nodes (11): HealthcheckService, HealthcheckTimeoutError, HealthcheckResult, SessionCloseResult, SessionRecoveryResult, createTempRepository(), execFileAsync, execGit() (+3 more)

### Community 49 - "codex-model-catalog.ts"
Cohesion: 0.11
Nodes (16): SessionsController, Controller, Get, Inject, Param, Req, RequireSessionAccess, buildSessionPrepareCommand() (+8 more)

### Community 50 - "DatabaseClient"
Cohesion: 0.26
Nodes (7): mapMessage(), MessagesRepositoryAdapter, Inject, Injectable, CreateMessageInput, MessagesRepository, SessionMessage

### Community 51 - "example-project.integration.test.ts"
Cohesion: 0.11
Nodes (9): AgentHarnessPort, RunPromptInput, SimulatedAgentHarness, AlwaysChangingHarnessPort, CancellableHarnessPort, InitialChangeOnlyHarnessPort, MutatingHarnessPort, RecordingHarnessPort (+1 more)

### Community 52 - "AgentClient"
Cohesion: 0.13
Nodes (13): mapSession(), SessionsRepositoryAdapter, Injectable, agentEvents, externalIdentities, prisma, projects, seedSessionFixture() (+5 more)

### Community 53 - "test-json.ts"
Cohesion: 0.09
Nodes (15): AppModule, Module, bootstrap(), startApplication(), authenticatePm(), prisma, startApplication(), startApplication() (+7 more)

### Community 54 - "SessionsService"
Cohesion: 0.09
Nodes (20): authenticateDeveloper(), authenticatePm(), prisma, startApplication(), authenticatePm(), prisma, authenticatePm(), prisma (+12 more)

### Community 55 - "AuthenticatedRequest"
Cohesion: 0.28
Nodes (7): mapProjectReadinessSnapshot(), ProjectReadinessRepositoryAdapter, Injectable, ProjectReadinessRepository, UpsertProjectReadinessInput, ProjectReadinessSnapshot, ToolReadinessCheck

### Community 57 - "PRD — PairDock MVP"
Cohesion: 0.11
Nodes (17): createAttachmentStorage(), normalizePublicBaseUrl(), R2_ENVIRONMENT_KEYS, ATTACHMENT_STORAGE, AttachmentObject, AttachmentStoragePort, PutAttachmentObjectInput, AttachmentsController (+9 more)

### Community 58 - "slack-pm-identity.adapter.ts"
Cohesion: 0.25
Nodes (10): AgentRegistrationsRepositoryAdapter, isRecord(), mapAgentRegistration(), parseModels(), parseProjects(), parseStringArray(), Injectable, AgentRegistrationsRepository (+2 more)

### Community 59 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @aws-sdk/client-s3, dotenv, @nestjs/platform-socket.io, @pairdock/shared-contracts, @prisma/adapter-pg, @prisma/client, reflect-metadata (+7 more)

### Community 60 - "Backend NestJS modules"
Cohesion: 0.10
Nodes (17): InvitationsService, Inject, Injectable, mapSessionMember(), SessionMembersRepositoryAdapter, Injectable, AddSessionMemberInput, SessionMembersRepository (+9 more)

### Community 61 - "include"
Cohesion: 0.13
Nodes (14): compilerOptions, jsx, lib, extends, include, src/**/*.ts, ../../tsconfig.base.json, DOM (+6 more)

### Community 62 - "scripts"
Cohesion: 0.12
Nodes (17): AgentGatewayModule, AuditLogModule, AuthModule, Backend NestJS modules, DiffModule, GithubModule, InvitationsModule, PersistenceModule (+9 more)

### Community 63 - "AgentAuthenticationService"
Cohesion: 0.19
Nodes (10): boundRenderedDiff(), ChangedFile, CollectedDiff, DiffService, DiffSnapshot, execGitText(), GitOutput, normalizeStatusPath() (+2 more)

### Community 64 - "source-control-connections.repository.ts"
Cohesion: 0.20
Nodes (8): AuthProvider, AuthProviders, hasAccessibleGithubInstallation(), OAuthStartUrlConfig, DEVELOPER_IDENTITY_PORT, PM_IDENTITY_PORT, AuthEnvironment, isDevelopmentPmAuthEnabled()

### Community 65 - "use-app-route.ts"
Cohesion: 0.17
Nodes (14): AppShell(), getAppRouteSnapshot(), loginRoute, openDeveloperHome(), openLogin(), openPmDashboard(), openPmReviewRequests(), openPmSession() (+6 more)

### Community 66 - "compilerOptions"
Cohesion: 0.14
Nodes (13): node, compilerOptions, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, noEmit (+5 more)

### Community 67 - "session-access.guard.ts"
Cohesion: 0.33
Nodes (13): "agent_events", "agent_registrations", "external_identities", "github_installations", "messages", "project_members", "project_readiness_snapshots", "projects" (+5 more)

### Community 68 - "json-parsers.ts"
Cohesion: 0.33
Nodes (4): port, server, createAgentServer(), createAgentServer()

### Community 69 - "Product"
Cohesion: 0.23
Nodes (9): BrandIconProps, GitMergeIcon(), GitPullRequestClosedIcon(), GitPullRequestIcon(), PullRequestStatusLink(), resolvePullRequestLabel(), resolvePullRequestState(), ReviewRequest (+1 more)

### Community 70 - "dependencies"
Cohesion: 0.18
Nodes (13): AgentModelConfig, applyCodexCommandToProjects(), CodexCatalogOptions, CodexInstallation, codexModelCacheSchema, codexModelSchema, codexReasoningLevelSchema, compareVersions() (+5 more)

### Community 71 - "developer-project-form.tsx"
Cohesion: 0.25
Nodes (11): AuthenticatedRequest, ProjectsController, Body, Controller, Get, Inject, Param, Post (+3 more)

### Community 72 - "V1 developer setup"
Cohesion: 0.09
Nodes (21): Deploy, update, or roll back, Deployment environment, Local developer agent and previews, One-time server setup, PairDock production deployment, Release images, Security before exposing PairDock, 1. GitHub App (+13 more)

### Community 73 - "ui-gateway.browser-auth.integration.test.ts"
Cohesion: 0.17
Nodes (5): sessionIdResponseSchema, authenticateDeveloper(), authenticatePm(), createSession(), prisma

### Community 74 - "external-identities.repository.ts"
Cohesion: 0.16
Nodes (12): ToolReadinessController, Controller, Get, HttpCode, Inject, Param, Post, Req (+4 more)

### Community 75 - "ToolReadinessService"
Cohesion: 0.18
Nodes (8): mapProject(), ProjectsRepositoryAdapter, Injectable, CreateProjectInput, DeveloperProjectRecord, ProjectsRepository, SharedProjectRecord, Project

### Community 76 - "pm-activity-page.tsx"
Cohesion: 0.09
Nodes (19): ButtonProps, ButtonVariant, variantClasses, ConnectionActivityRail(), ConnectionActivityRailProps, RailMetricProps, DropdownMenuField(), DropdownMenuFieldProps (+11 more)

### Community 77 - "commands.ts"
Cohesion: 0.19
Nodes (9): AgentGateway, ConnectedSocket, Injectable, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, Inject (+1 more)

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
Cohesion: 0.08
Nodes (13): Inject, Inject, Inject, Inject, Inject, Inject, Inject, Inject (+5 more)

### Community 82 - "session-prompt.service.ts"
Cohesion: 0.23
Nodes (11): isToolReadinessKey(), isToolReadinessStatus(), parseToolReadinessCheck(), parseToolReadinessChecks(), serializeChecks(), serializeJsonValue(), serializeToolReadinessCheck(), toInputJsonObject() (+3 more)

### Community 83 - "auth.service.ts"
Cohesion: 0.22
Nodes (6): ImageLightbox(), ImageLightboxProps, ConversationThread(), ConversationThreadProps, SessionConversationItem, LONG_PATH_ITEM

### Community 84 - "AgentCommandEnvelope"
Cohesion: 0.25
Nodes (14): loadAgentConfig(), resolveAgentConfigPath(), saveAgentConfig(), summarizeAgentConfig(), main(), parseModelMapping(), parseModelMappings(), parseProjectMapping() (+6 more)

### Community 85 - "BT-050 — Same-email cross-role accounts remain independent"
Cohesion: 0.18
Nodes (13): PromptComposer(), PromptComposerProps, ReviewRequestDialogProps, ACCEPTED_IMAGE_TYPES, appendScreenshotFiles(), AppendScreenshotFilesOptions, ClipboardDataWithItems, getPastedImageFiles() (+5 more)

### Community 86 - "Screens represented"
Cohesion: 0.18
Nodes (10): Architecture documents reconciled, Developer dashboard, Implementation guidance, Login, PM shared-project dashboard, Prototype notes — PairDock collaborative developer/PM, Purpose, Running/fixed/review states (+2 more)

### Community 87 - ".create"
Cohesion: 0.22
Nodes (8): exports, name, private, scripts, build, typecheck, type, version

### Community 88 - ".authenticateDeveloper"
Cohesion: 0.44
Nodes (7): asRecord(), buildSessionConversation(), extractErrorMessage(), humanizeAgentError(), mergeAdjacentAgentOutput(), promoteFinalAgentMessages(), toConversationEvent()

### Community 89 - "agent-command-routing.integration.test.ts"
Cohesion: 0.11
Nodes (31): SessionExecutionSelection, isLifecycleProgressStatus(), toSessionAgentEvent(), ConnectedAgentSnapshot, AGENT_EVENTS_REPOSITORY, AGENT_REGISTRATIONS_REPOSITORY, ATTACHMENTS_REPOSITORY, EXTERNAL_IDENTITIES_REPOSITORY (+23 more)

### Community 90 - "agent-gateway.integration.test.ts"
Cohesion: 0.17
Nodes (5): authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication()

### Community 91 - "AgentCommandEnvelope"
Cohesion: 0.29
Nodes (8): boot(), getReactDOM(), init(), parseDataProps(), parseDcDocument(), parseDcText(), react-dom, react-dom

### Community 92 - "package.json"
Cohesion: 0.20
Nodes (9): devDependencies, prisma, socket.io-client, name, private, type, version, prisma (+1 more)

### Community 94 - "createRuntime"
Cohesion: 0.11
Nodes (8): createTempRepository(), execFileAsync, execGit(), FailingClosePreviewTunnelPort, FailingHealthcheckService, FakeHostCommandExecutor, FakePreviewTunnelPort, UnavailableHealthcheckService

### Community 95 - "PairDock Interactive Prototype"
Cohesion: 0.13
Nodes (12): assertInstallationId(), GithubAuthStateOptions, GithubAuthStatePayload, GithubAuthStatePurpose, GithubAuthStateService, hasValidSignature(), invalidState(), isInstallationId() (+4 more)

### Community 96 - "auth.integration.test.ts"
Cohesion: 0.22
Nodes (5): announceAgent(), authenticateDeveloper(), authenticatePm(), prisma, waitForConnect()

### Community 97 - "persistence.boundaries.test.ts"
Cohesion: 0.20
Nodes (8): apiSourceRoot, cwd, domainContractFile, generatedPrismaRoot, persistenceAdapterRoot, persistencePortRoot, persistenceRoot, persistenceSurfaceFiles

### Community 98 - "tsconfig.json"
Cohesion: 0.22
Nodes (8): compilerOptions, emitDecoratorMetadata, experimentalDecorators, extends, include, src/**/*.ts, ../../tsconfig.base.json, ../../tests/apps/api/**/*.ts

### Community 99 - "SessionRegistry"
Cohesion: 0.13
Nodes (13): AgentCommandRouterService, Inject, Injectable, CreateSessionInput, SessionsRepository, buildSessionCloseCommand(), SessionCloseService, Inject (+5 more)

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
Cohesion: 0.14
Nodes (6): AgentConnectedEventEnvelope, RecordedHandshake, RecordingRestoreSessionRunner, SessionRunnerWithRecoveredWorkspace, SessionRunnerWithRecoveryFailure, waitFor()

### Community 104 - "package.json"
Cohesion: 0.19
Nodes (7): DockerOrphanReconcileInput, DockerOrphanReconciler, DockerOrphanReconcilerDependencies, execFileAsync, listManagedContainers(), ManagedDockerContainer, stopContainers()

### Community 105 - "HealthController"
Cohesion: 0.20
Nodes (7): mapReviewRequest(), ReviewRequestsRepositoryAdapter, Injectable, CreateReviewRequestInput, ReviewRequestsRepository, ReviewRequestRecord, InMemoryReviewRequestsRepository

### Community 106 - "developer-project-form.tsx"
Cohesion: 0.08
Nodes (24): AttachmentsModule, Module, detectImageType(), isJpeg(), isPng(), isWebp(), safeOriginalName(), UploadedScreenshot (+16 more)

### Community 107 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): extends, include, src/**/*.ts, ../../tsconfig.base.json, ../../tests/packages/local-agent/**/*.ts

### Community 109 - "auth.service.ts"
Cohesion: 0.20
Nodes (5): Inject, AuthService, buildFrontendAuthRedirectUrl(), readOAuthStartUrlConfig(), Injectable

### Community 110 - "AgentEventEnvelope"
Cohesion: 0.13
Nodes (16): base64UrlEncode(), createGithubAppJwt(), deterministicReviewRequestNumber(), Fetcher, GithubBranchResponse, githubHeaders(), GithubInstallationRepositoriesResponse, GithubInstallationTokenResponse (+8 more)

### Community 112 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 113 - "GithubSourceControlAdapter"
Cohesion: 0.16
Nodes (10): AgentProjectOption, DeveloperProjectForm(), ProjectFormState, ProjectSetupStateProps, resolveModelOptions(), ExecutionSelection, ExecutionSelectionControls(), ExecutionSelectionProps (+2 more)

### Community 114 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 115 - "PairDock collaborative developer/PM prototype"
Cohesion: 0.25
Nodes (7): name, private, scripts, build, lint, test, type

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
Cohesion: 0.24
Nodes (7): BinaryResponse, sendAttachment(), Get, Param, Req, RequireSessionAccess, Res

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
Cohesion: 0.25
Nodes (8): SharedProjectCard(), SharedProjectCardProps, SessionStarted, StartPmSessionInput, UseSharedProjectsResult, SharedProjectSummary, blockedProject, readyProject

### Community 125 - "agent-prompt-command.integration.test.ts"
Cohesion: 0.11
Nodes (9): buildPrepareCommand(), createManagedWorktreeRoot(), createPreparedValidationFeedbackClient(), createTempRepository(), execFileAsync, execGit(), ReadyPreviewTunnelPort, ReadySandboxPort (+1 more)

### Community 126 - "dependencies"
Cohesion: 0.14
Nodes (14): @pairdock/shared-contracts, socket.io-client, zod, createComponentFactory(), react, @tanstack/react-form, @tanstack/react-query, dependencies (+6 more)

### Community 127 - "@nestjs/websockets"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, test, test:unit, typecheck (+2 more)

### Community 128 - "AGENTS.md"
Cohesion: 0.40
Nodes (4): Fixtures, MVP E2E scenario, Reproduce locally, What it proves

### Community 129 - "migration.sql"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Trace all suggested graph questions using documentation only, Source Nodes

### Community 130 - "review-requests.repository.ts"
Cohesion: 0.07
Nodes (13): PreviewTunnelPort, ReadyPreviewTunnelPort, createTempRepository(), execFileAsync, execGit(), prisma, ReadyPreviewTunnelPort, startApplication() (+5 more)

### Community 131 - "prisma.config.ts"
Cohesion: 0.32
Nodes (3): AgentExecutionCapabilitiesService, Inject, Injectable

### Community 137 - "Containers"
Cohesion: 0.40
Nodes (4): Architectural interpretation, Contents, How to view, PairDock collaborative developer/PM prototype

### Community 139 - "SessionMembersRepositoryAdapter"
Cohesion: 0.33
Nodes (5): Deployment security audit — 2026-07-19, Operational requirements and residual risk, Resolved findings, Scope, Verification

### Community 143 - "validation.integration.test.ts"
Cohesion: 0.15
Nodes (5): agentEventEnvelopeSchema, authenticateDeveloper(), createSession(), prisma, startApplication()

### Community 144 - "pm-activity-page.tsx"
Cohesion: 0.47
Nodes (3): HealthController, Controller, Get

### Community 147 - "Get"
Cohesion: 0.38
Nodes (6): checkLabels, statusTone(), ToolReadinessPanel(), ToolReadinessPanelProps, ToolReadinessRow(), DeveloperProjectReadiness

### Community 148 - "tool-readiness-panel.tsx"
Cohesion: 0.25
Nodes (7): mapSourceControlConnection(), SourceControlConnectionsRepositoryAdapter, Injectable, CreateSourceControlConnectionInput, SourceControlConnectionsRepository, Inject, SourceControlConnection

### Community 149 - "SessionRegistry"
Cohesion: 0.60
Nodes (3): isInsideSensitiveDirectory(), normalizeRelativePath(), SensitiveFilesPolicy

### Community 150 - "SharedProjectSummary"
Cohesion: 0.27
Nodes (8): cleanCallbackHash(), getAuthSessionSnapshot(), readCallbackSession(), subscribe(), useAuthSession(), useSharedProjects(), PmDashboardPage(), PmDashboardPageProps

### Community 151 - "Deployment security audit — 2026-07-19"
Cohesion: 0.12
Nodes (16): scripts, build, db:migrate, db:migrate:dev, db:migrate:test, db:reset, db:seed:pm-demo, db:status (+8 more)

### Community 153 - ".constructor"
Cohesion: 0.33
Nodes (4): extensionFor(), PromptAttachment, PromptAttachmentDownloader, resolveHarnessTempDirectory()

### Community 154 - "pm-session-page.tsx"
Cohesion: 0.20
Nodes (11): ReviewRequestDialog(), useSessionData(), FeedIdentity, feedRegistry, getFeed(), useSessionEventFeed(), sessionQueryKeys, formatSessionStatus() (+3 more)

### Community 158 - "authenticated-request.ts"
Cohesion: 0.27
Nodes (4): AuthenticatedUserGuard, Inject, Injectable, RequireAuth()

### Community 159 - "PairDock collaborative developer/PM prototype"
Cohesion: 0.40
Nodes (5): Agent → backend events, Backend → agent commands, Backend ↔ agent WebSocket contract, Common envelope, UI session-start contract

### Community 160 - "Frontend product surfaces"
Cohesion: 0.40
Nodes (5): Developer dashboard, Frontend product surfaces, Login, PM dashboard, Session workspace

### Community 161 - "session-state-machine.ts"
Cohesion: 0.15
Nodes (9): allowedProgressTransitions, interruptedOperationStatuses, interruptedPreparationStatuses, InvalidSessionTransitionError, NoChangesResumeStatus, ProgressStatus, SessionAgentEvent, SessionStateMachine (+1 more)

### Community 164 - "tool-readiness-panel.tsx"
Cohesion: 0.67
Nodes (3): buildGitDiffEvent(), createRepository(), execFileAsync

### Community 165 - ".create"
Cohesion: 0.07
Nodes (22): createPersistenceRepositories(), PersistenceUnitOfWorkAdapter, Inject, Injectable, PersistenceRepositories, PersistenceUnitOfWork, appendScreenshotsToReviewDescription(), buildConventionalCommitMessage() (+14 more)

### Community 166 - "ReadyPreviewTunnelPort"
Cohesion: 0.10
Nodes (13): currentDirectory, databaseTargetEnvironment, buildAdapter(), currentDirectory, DatabaseClient, Injectable, DatabaseEnvironment, DatabaseTarget (+5 more)

### Community 169 - ".register"
Cohesion: 0.17
Nodes (6): Inject, cloneSnapshot(), ConnectedAgentsRegistry, Injectable, createService(), project

## Knowledge Gaps
- **654 isolated node(s):** `Workspace`, `Commands`, `1. GitHub App`, `2. Slack App`, `3. Start PairDock` (+649 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `resolve()` connect `github-developer-identity.adapter.ts` to `ReadyPreviewTunnelPort`, `resolve`, `command-handling.integration.test.ts`, `support.js`, `AgentCommandEnvelope`, `example-project.integration.test.ts`, `walk`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `createApiClient()` connect `client.ts` to `WorktreeService`, `developer-home-page.tsx`, `session.ts`, `auth.service.ts`, `SharedProjectSummary`, `pm-session-page.tsx`, `GithubSourceControlAdapter`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `AgentCommandEnvelope`, `@nestjs/websockets`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `Workspace`, `Commands`, `1. GitHub App` to the rest of the system?**
  _654 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agent-config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13825757575757575 - nodes in this community are weakly interconnected._
- **Should `create-draft-review-request.use-case.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07227891156462585 - nodes in this community are weakly interconnected._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.038461538461538464 - nodes in this community are weakly interconnected._