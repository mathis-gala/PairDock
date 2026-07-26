# Graph Report - PairDock  (2026-07-26)

## Corpus Check
- 297 files · ~132,451 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2731 nodes · 5689 edges · 168 communities (143 shown, 25 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 95 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `011b35bd`
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
- DatabaseExecutor
- ToolReadinessService
- pm-activity-page.tsx
- commands.ts
- package.json
- validation.integration.test.ts
- shared-projects.integration.test.ts
- session-conversation.ts
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
- server
- tsconfig.json
- persistence.integration.test.ts
- dotenv
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
- reflect-metadata
- 01 Flow — PM Shared Projects Dashboard
- 01 Session 2 — Responsive Fix Session Workspace
- session-access.guard.ts
- agent-prompt-command.integration.test.ts
- tool-readiness-panel.tsx
- @nestjs/websockets
- AGENTS.md
- migration.sql
- .create
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
- .assertConnected
- @nestjs/common
- Get
- SharedProjectSummary
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
3. `SandboxRef` - 45 edges
4. `SessionRunner` - 38 edges
5. `DatabaseClient` - 38 edges
6. `Session` - 38 edges
7. `parseJsonResponse()` - 35 edges
8. `AgentClient` - 34 edges
9. `Project` - 34 edges
10. `ProjectsService` - 32 edges

## Surprising Connections (you probably didn't know these)
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/agent-gateway/agent-gateway.integration.test.ts → apps/api/src/app.module.ts
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/auth/auth.integration.test.ts → apps/api/src/app.module.ts
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/projects/shared-projects.integration.test.ts → apps/api/src/app.module.ts
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/sessions/pm-session-start.integration.test.ts → apps/api/src/app.module.ts
- `startApplication()` --indirect_call--> `AppModule`  [INFERRED]
  tests/apps/api/integration/sessions/session-history.integration.test.ts → apps/api/src/app.module.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Nimbus Trial Button Correction States** — prototype_screenshots_01_clean_blank_landing_preview, prototype_screenshots_01_fixed_nimbus_trial_button_fix, prototype_screenshots_02_clean_blank_landing_preview, prototype_screenshots_02_fixed_nimbus_trial_button_fix [INFERRED 0.85]
- **Responsive Fix Session Workspace States** — prototype_screenshots_01_sess2_responsive_session_workspace, prototype_screenshots_01_sess3_responsive_session_workspace, prototype_screenshots_02_dev_responsive_session_workspace, prototype_screenshots_02_sess2_responsive_session_workspace, prototype_screenshots_02_sess3_responsive_session_workspace [INFERRED 0.85]
- **Correction Workflow Screenshots** — prototype_screenshots_03_clean_clean_correction_prompt_state, prototype_screenshots_03_dev_developer_correction_request_state, prototype_screenshots_03_flow_correction_workflow_state, prototype_screenshots_sess4_session_correction_request_state [INFERRED 0.85]

## Communities (168 total, 25 thin omitted)

### Community 0 - "agent-config.ts"
Cohesion: 0.06
Nodes (62): agentConfigFileSchema, agentHarnessConfigSchema, agentModelConfigSchema, agentProjectDescriptorSchema, assertHttpUrlTemplate(), assertLoopbackPortMapping(), assertLoopbackUrlTemplate(), assertSafeContainerImage() (+54 more)

### Community 1 - "create-draft-review-request.use-case.ts"
Cohesion: 0.07
Nodes (13): SandboxPort, SandboxRef, SandboxStartInput, PreviewRuntimeRouter, PreviewRuntimeRouterDependencies, ReadySandboxPort, ReadySandboxPort, ReadySandboxPort (+5 more)

### Community 2 - "Button"
Cohesion: 0.04
Nodes (51): Behavior test plan — PairDock MVP, BT-001 — Installable workspace, BT-002 — Session creation is persisted, BT-003 — Agent event is persisted, BT-004 — PM member access is allowed, BT-005 — Non-member access is denied, BT-006 — Valid session transitions, BT-007 — Invalid transition is rejected (+43 more)

### Community 3 - "events.ts"
Cohesion: 0.10
Nodes (18): AgentCancelCommandEnvelope, agentCancelCommandEnvelopeSchema, agentCommandEnvelopeSchema, AgentPromptCommandEnvelope, agentPromptCommandEnvelopeSchema, ChecksRunCommandEnvelope, checksRunCommandEnvelopeSchema, GitGetDiffCommandEnvelope (+10 more)

### Community 4 - "index.ts"
Cohesion: 0.10
Nodes (23): checkResultSchema, envelopeBaseSchema, isoDateTimeSchema, promptableSessionStatuses, sessionEnvelope(), SessionStatus, sessionStatusSchema, toolReadinessCheckSchema (+15 more)

### Community 5 - "index.ts"
Cohesion: 0.07
Nodes (28): requestJson(), PreviewAreaSize, PreviewFrame(), PreviewFrameProps, PreviewToolbar(), PreviewToolbarProps, PromptComposer(), ReviewRequestDialog() (+20 more)

### Community 6 - "developer-home-page.tsx"
Cohesion: 0.08
Nodes (22): authApi, DeveloperLoginCard(), PmLoginCard(), PmLoginCardProps, GitHubIcon(), SlackIcon(), Button(), PromptComposerProps (+14 more)

### Community 7 - "app-shell.tsx"
Cohesion: 0.15
Nodes (14): allocateHostPort(), assertSafeContainerImage(), buildContainerHardeningArgs(), buildDockerRunArgs(), buildManagedResourceLabels(), DockerSandboxAdapter, DockerSandboxAdapterDependencies, inferPortsFromHealthcheck() (+6 more)

### Community 8 - "SandboxRef"
Cohesion: 0.10
Nodes (20): Architecture style, Current repository context, Dependency rules, Diagram links, External ports/adapters, Frontend styling, Local agent structure, Login interface (+12 more)

### Community 9 - "persistence.module.ts"
Cohesion: 0.13
Nodes (26): AgentGatewayModule, Module, AuthModule, Module, InvitationsModule, Module, PersistenceModule, Module (+18 more)

### Community 10 - "PairDockUser"
Cohesion: 0.16
Nodes (9): mapUser(), Injectable, UsersRepositoryAdapter, CreateUserInput, UsersRepository, Inject, Injectable, UsersService (+1 more)

### Community 11 - "client.ts"
Cohesion: 0.20
Nodes (9): createApiClient(), useSharedSessionHistory(), filterSharedSessionHistory(), SessionHistoryFilters, SessionHistoryStatusFilter, PmActivityPage(), PmActivityPageProps, SESSION_STATUS_FILTER_OPTIONS (+1 more)

### Community 12 - "sessions.service.ts"
Cohesion: 0.15
Nodes (8): Inject, AuthService, buildFrontendAuthRedirectUrl(), hasAccessibleGithubInstallation(), readOAuthStartUrlConfig(), Inject, Injectable, NormalizedIdentity

### Community 13 - "session.ts"
Cohesion: 0.08
Nodes (19): ApiClient, authHeaders(), AuthProviders, authProvidersSchema, CreateSessionInput, jsonHeaders(), RequestOptions, responseErrorSchema (+11 more)

### Community 14 - "scripts"
Cohesion: 0.05
Nodes (36): @biomejs/biome, apps/*, packages/*, tsx, @types/node, typescript, devDependencies, @biomejs/biome (+28 more)

### Community 15 - "ConnectedAgentsRegistry"
Cohesion: 0.09
Nodes (12): Inject, Inject, Inject, Inject, Inject, Inject, Inject, Inject (+4 more)

### Community 16 - "PairDockIdentity"
Cohesion: 0.21
Nodes (5): ProjectsService, resolveUnavailableReason(), Injectable, DeveloperProjectSummary, SharedSessionHistoryItem

### Community 17 - "AuthService"
Cohesion: 0.23
Nodes (16): assertStateCookie(), AuthCallbackBody, AuthController, clearStateCookie(), HeaderResponse, readCookie(), readStateFromRedirectUrl(), secureCookieSuffix() (+8 more)

### Community 18 - "ProjectPreviewConfig"
Cohesion: 0.21
Nodes (11): ProjectChecksConfig, AgentConfig, SaveAgentConfigInput, ProjectManifestLoadResult, ProjectPreviewConfig, ReadinessRunnerConfig, SessionCloseResult, SessionPrepareHooks (+3 more)

### Community 19 - "support.js"
Cohesion: 0.05
Nodes (61): @pairdock/shared-contracts, socket.io-client, zod, get(), boot(), collectProps(), compileAttr(), compileTemplate() (+53 more)

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
Cohesion: 0.19
Nodes (12): CommandResult, CommandRunner, failed(), failureMessage(), isCodexExecutable(), passed(), ReadinessResult, ReadinessRunner (+4 more)

### Community 25 - "agent-client.ts"
Cohesion: 0.28
Nodes (7): AgentModelConfig, AgentProjectDescriptor, AgentClientConfig, BackendEventRejectedError, buildValidationRepairPrompt(), hasRepairableCheckFailure(), isRetryableError()

### Community 26 - "github-source-control.adapter.ts"
Cohesion: 0.14
Nodes (15): readGithubConfig(), readSlackConfig(), areIdentityFixturesEnabled(), base64UrlEncode(), createGithubAppJwt(), deterministicReviewRequestNumber(), Fetcher, GithubBranchResponse (+7 more)

### Community 27 - "package.json"
Cohesion: 0.08
Nodes (23): tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, devDependencies, tailwindcss, @tailwindcss/vite, @types/react (+15 more)

### Community 28 - "mvp-flow.e2e.test.ts"
Cohesion: 0.09
Nodes (9): createTestRepository(), EXAMPLE_REPOSITORY_FIXTURE, execFileAsync, execGit(), prisma, reviewRequestResponseSchema, SimulatedAgentHarness, waitFor() (+1 more)

### Community 29 - "AuthTokenService"
Cohesion: 0.19
Nodes (10): AuthTokenOptions, AuthTokenService, hasValidSignature(), isRecord(), isUserKind(), parseTokenPayload(), resolveSecret(), TokenPayload (+2 more)

### Community 30 - "github-developer-identity.adapter.ts"
Cohesion: 0.11
Nodes (24): AgentEventEnvelopeInput, buildAgentConnectedEvent(), buildAgentDoneEvent(), buildAgentOutputEvent(), buildChecksResultEvent(), buildEnvelope(), buildErrorEvent(), buildGitBranchPushedEvent() (+16 more)

### Community 31 - "agent-events.repository.ts"
Cohesion: 0.12
Nodes (9): CheckCommandExecutor, CheckResult, ChecksResult, ChecksRunner, isTransientPackageExtractionFailure(), RunChecksInput, RecordingChecksRunner, SequencedChecksRunner (+1 more)

### Community 32 - "external-identities.repository.ts"
Cohesion: 0.14
Nodes (14): Fetcher, GithubDeveloperIdentityAdapter, GithubDeveloperIdentityConfig, GithubEmailResponse, githubHeaders(), GithubInstallationMetadata, GithubInstallationsResponse, GithubOAuthResponse (+6 more)

### Community 33 - "slack-pm-identity.adapter.ts"
Cohesion: 0.23
Nodes (8): mapProjectReadinessSnapshot(), ProjectReadinessRepositoryAdapter, Injectable, ProjectReadinessRepository, UpsertProjectReadinessInput, Inject, ProjectReadinessSnapshot, ToolReadinessCheck

### Community 34 - "WorktreeService"
Cohesion: 0.24
Nodes (6): isRecord(), ToolReadinessService, toReadinessResponse(), Injectable, PairDockIdentity, DeveloperProjectSetup

### Community 35 - "sessions.controller.ts"
Cohesion: 0.23
Nodes (10): SessionsController, Body, Controller, Get, HttpCode, Param, Post, Req (+2 more)

### Community 36 - "DatabaseExecutor"
Cohesion: 0.15
Nodes (13): mapValidationRun(), Injectable, ValidationRunsRepositoryAdapter, VALIDATION_RUNS_REPOSITORY, CreateValidationRunInput, ValidationRunsRepository, Injectable, ValidationPolicy (+5 more)

### Community 37 - "ReviewRequestsRepository"
Cohesion: 0.15
Nodes (10): DEFAULT_SESSION_STATE_PATH, FileSessionWorkspaceStore, isMissingFileError(), metadataSchema, stateSchema, toPersistedWorkspace(), workspaceSchema, SessionWorkspace (+2 more)

### Community 38 - "SessionsController"
Cohesion: 0.19
Nodes (8): ConnectedSocket, Inject, Injectable, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, UiGateway

### Community 39 - "ToolReadinessService"
Cohesion: 0.24
Nodes (7): ExternalIdentitiesRepositoryAdapter, Injectable, serializeJsonObject(), mapExternalIdentity(), CreateExternalIdentityInput, ExternalIdentitiesRepository, ExternalIdentity

### Community 40 - "Implementation handoff — PairDock MVP"
Cohesion: 0.07
Nodes (41): AgentCommandRouterService, Inject, Injectable, AgentExecutionCapabilitiesService, SessionExecutionSelection, Injectable, AgentProjectBindingService, Injectable (+33 more)

### Community 41 - "docker-sandbox.adapter.ts"
Cohesion: 0.12
Nodes (17): assertSafeContainerImage(), buildCloudflareDockerArgs(), buildTunnelContainerName(), CloudflarePreviewTunnelAdapter, CloudflarePreviewTunnelDependencies, ManagedTunnelProcess, onceExit(), resolveRestoredTunnelContainerName() (+9 more)

### Community 42 - "session-runner.ts"
Cohesion: 0.07
Nodes (22): buildHostCommandEnvironment(), HostCheckCommandExecutor, HostCheckCommandExecutorDependencies, HostCheckCommandInput, HostCheckCommandRunner, HostCommandSpawnOptions, SAFE_HOST_COMMAND_ENVIRONMENT_KEYS, appendLogs() (+14 more)

### Community 43 - "ui.ts"
Cohesion: 0.33
Nodes (5): DeveloperProjectFormProps, ShareDeveloperProjectInput, UpdateExecutionDefaultsInput, CreateDeveloperProjectInput, UpdateProjectExecutionDefaultsInput

### Community 44 - "tool-readiness.integration.test.ts"
Cohesion: 0.16
Nodes (10): AgentProjectOption, DeveloperProjectForm(), ProjectFormState, ProjectSetupStateProps, resolveModelOptions(), ExecutionSelection, ExecutionSelectionControls(), ExecutionSelectionProps (+2 more)

### Community 45 - "tool-readiness-panel.tsx"
Cohesion: 0.12
Nodes (15): Actors, Assumptions, Fixed constraints, Functional requirements, Goals, Handoff summary, Non-functional requirements, Non-goals for MVP (+7 more)

### Community 46 - "session-details.integration.test.ts"
Cohesion: 0.15
Nodes (5): createTempRepository(), execFileAsync, execGit(), prisma, ReadyPreviewTunnelPort

### Community 47 - "diff.service.ts"
Cohesion: 0.09
Nodes (18): ConnectionActivityRail(), ConnectionActivityRailProps, RailMetricProps, DeveloperProjectCard(), DeveloperProjectCardProps, ProjectFactProps, ProjectShareForm(), ProjectShareFormProps (+10 more)

### Community 48 - "command-handling.integration.test.ts"
Cohesion: 0.10
Nodes (6): createTempRepository(), execFileAsync, execGit(), FailOnceClosePreviewTunnelPort, ImmediateTimeoutHealthcheckService, ReadyPreviewTunnelPort

### Community 49 - "codex-model-catalog.ts"
Cohesion: 0.22
Nodes (12): applyCodexCommandToProjects(), CodexCatalogOptions, CodexInstallation, codexModelCacheSchema, codexModelSchema, codexReasoningLevelSchema, compareVersions(), enrichConfigWithCodexModels() (+4 more)

### Community 50 - "DatabaseClient"
Cohesion: 0.19
Nodes (9): DiffService, isSessionDiffPayload(), SessionDiffView, AgentEventsRepositoryAdapter, Injectable, mapAgentEvent(), AgentEventsRepository, CreateAgentEventInput (+1 more)

### Community 51 - "example-project.integration.test.ts"
Cohesion: 0.09
Nodes (19): AgentHarnessEvent, AgentHarnessPort, ProjectAgentHarnessConfig, RunPromptInput, AgentHarnessEventQueue, buildCodexPrompt(), buildCodexSecurityArgs(), buildCommandArgs() (+11 more)

### Community 53 - "test-json.ts"
Cohesion: 0.15
Nodes (10): authenticateDeveloper(), authenticatePm(), prisma, startApplication(), developerProjectResponseSchema, parseJsonResponse(), authenticateDeveloper(), authenticatePm() (+2 more)

### Community 54 - "SessionsService"
Cohesion: 0.12
Nodes (15): authenticatePm(), prisma, authenticatePm(), prisma, startApplication(), authenticateDeveloper(), prisma, startApplication() (+7 more)

### Community 55 - "AuthenticatedRequest"
Cohesion: 0.23
Nodes (12): isToolReadinessKey(), isToolReadinessStatus(), parseJsonObject(), parseToolReadinessCheck(), parseToolReadinessChecks(), serializeChecks(), serializeJsonValue(), serializeToolReadinessCheck() (+4 more)

### Community 57 - "PRD — PairDock MVP"
Cohesion: 0.12
Nodes (16): scripts, build, db:migrate, db:migrate:dev, db:migrate:test, db:reset, db:seed:pm-demo, db:status (+8 more)

### Community 58 - "slack-pm-identity.adapter.ts"
Cohesion: 0.15
Nodes (10): Fetcher, parseFixtureIdentity(), SlackAuthTestResponse, slackHeaders(), SlackOAuthResponse, SlackPmIdentityAdapter, SlackPmIdentityConfig, SlackUserInfoResponse (+2 more)

### Community 59 - "dependencies"
Cohesion: 0.13
Nodes (15): @pairdock/shared-contracts, socket.io, @nestjs/common, @nestjs/core, @nestjs/websockets, @prisma/adapter-pg, @prisma/client, dependencies (+7 more)

### Community 60 - "Backend NestJS modules"
Cohesion: 0.08
Nodes (28): mapSessionMember(), mapSourceControlConnection(), SessionMembersRepositoryAdapter, Injectable, SourceControlConnectionsRepositoryAdapter, Injectable, createPersistenceRepositories(), PersistenceUnitOfWorkAdapter (+20 more)

### Community 61 - "include"
Cohesion: 0.13
Nodes (14): compilerOptions, jsx, lib, extends, include, src/**/*.ts, ../../tsconfig.base.json, DOM (+6 more)

### Community 62 - "scripts"
Cohesion: 0.12
Nodes (17): AgentGatewayModule, AuditLogModule, AuthModule, Backend NestJS modules, DiffModule, GithubModule, InvitationsModule, PersistenceModule (+9 more)

### Community 63 - "AgentAuthenticationService"
Cohesion: 0.09
Nodes (24): boundRenderedDiff(), ChangedFile, CollectedDiff, DiffService, DiffSnapshot, execGitText(), GitOutput, normalizeStatusPath() (+16 more)

### Community 64 - "source-control-connections.repository.ts"
Cohesion: 0.25
Nodes (4): buildSessionPrepareCommand(), formatUserDisplayName(), SessionsService, Injectable

### Community 65 - "use-app-route.ts"
Cohesion: 0.17
Nodes (15): AppShell(), getAppRouteSnapshot(), loginRoute, openDeveloperHome(), openLogin(), openPmDashboard(), openPmReviewRequests(), openPmSession() (+7 more)

### Community 66 - "compilerOptions"
Cohesion: 0.14
Nodes (13): node, compilerOptions, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, noEmit (+5 more)

### Community 67 - "session-access.guard.ts"
Cohesion: 0.33
Nodes (13): "agent_events", "agent_registrations", "external_identities", "github_installations", "messages", "project_members", "project_readiness_snapshots", "projects" (+5 more)

### Community 69 - "Product"
Cohesion: 0.23
Nodes (9): BrandIconProps, GitMergeIcon(), GitPullRequestClosedIcon(), GitPullRequestIcon(), PullRequestStatusLink(), resolvePullRequestLabel(), resolvePullRequestState(), ReviewRequest (+1 more)

### Community 70 - "dependencies"
Cohesion: 0.17
Nodes (6): authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication(), sessionPromptResponseSchema

### Community 72 - "V1 developer setup"
Cohesion: 0.14
Nodes (13): 1. GitHub App, 2. Slack App, 3. Start PairDock, 4. Cloudflare Tunnel, 5. Add `pairdock.yml`, 6. Configure the local agent, 7. Create a PairDock project, Commands (+5 more)

### Community 73 - "ui-gateway.browser-auth.integration.test.ts"
Cohesion: 0.15
Nodes (6): sessionIdResponseSchema, authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication()

### Community 74 - "DatabaseExecutor"
Cohesion: 0.18
Nodes (7): mapSession(), SessionsRepositoryAdapter, Injectable, CreateSessionInput, buildSessionCloseCommand(), SessionStateMachine, Session

### Community 75 - "ToolReadinessService"
Cohesion: 0.21
Nodes (9): ToolReadinessController, Controller, Get, HttpCode, Inject, Param, Post, Req (+1 more)

### Community 76 - "pm-activity-page.tsx"
Cohesion: 0.11
Nodes (16): ButtonProps, ButtonVariant, variantClasses, DropdownMenuField(), DropdownMenuFieldProps, DropdownMenuItem(), DropdownMenuOption, ConversationThread() (+8 more)

### Community 77 - "commands.ts"
Cohesion: 0.06
Nodes (28): AgentAuthenticationService, Injectable, Inject, AgentGateway, isLifecycleProgressStatus(), toSessionAgentEvent(), Inject, Injectable (+20 more)

### Community 78 - "package.json"
Cohesion: 0.17
Nodes (11): dependencies, zod, exports, zod, name, private, scripts, build (+3 more)

### Community 79 - "validation.integration.test.ts"
Cohesion: 0.21
Nodes (8): announceAgent(), authenticatePm(), prisma, publishReadiness(), sendAgentEvent(), startApplication(), waitForConnect(), sessionCreateResponseSchema

### Community 80 - "shared-projects.integration.test.ts"
Cohesion: 0.21
Nodes (8): announceAgent(), authenticatePm(), prisma, publishReadiness(), sendAgentEvent(), startApplication(), waitForConnect(), sharedProjectListResponseSchema

### Community 81 - "session-conversation.ts"
Cohesion: 0.30
Nodes (10): asRecord(), buildSessionConversation(), extractErrorMessage(), humanizeAgentError(), mergeAdjacentAgentOutput(), promoteFinalAgentMessages(), toConversationEvent(), checksResultPayloadSchema (+2 more)

### Community 82 - "session-prompt.service.ts"
Cohesion: 0.14
Nodes (14): DEVELOPMENT_PM, main(), assertLocalDevelopmentSeedTarget(), buildPmDemoSessions(), demoDiff(), deterministicUuid(), passingValidation(), PmDemoMessage (+6 more)

### Community 83 - "auth.service.ts"
Cohesion: 0.25
Nodes (10): AgentRegistrationsRepositoryAdapter, isRecord(), mapAgentRegistration(), parseModels(), parseProjects(), parseStringArray(), Injectable, AgentRegistrationsRepository (+2 more)

### Community 84 - "AgentCommandEnvelope"
Cohesion: 0.27
Nodes (4): AuthenticatedUserGuard, Inject, Injectable, RequireAuth()

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
Cohesion: 0.52
Nodes (4): Body, HttpCode, Post, AuthResult

### Community 89 - "agent-command-routing.integration.test.ts"
Cohesion: 0.24
Nodes (5): buildAgentCancelCommand(), buildAgentPromptCommand(), SessionPromptService, Injectable, Inject

### Community 90 - "agent-gateway.integration.test.ts"
Cohesion: 0.17
Nodes (5): authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication()

### Community 91 - "AgentCommandEnvelope"
Cohesion: 0.15
Nodes (9): AGENT_AUTHENTICATION_OPTIONS, AgentAuthenticationOptions, AgentCredentialInput, AuthenticatedAgentPrincipal, extractBearerToken(), isRecord(), parseCredentials(), Inject (+1 more)

### Community 92 - "package.json"
Cohesion: 0.20
Nodes (9): socket.io-client, prisma, devDependencies, prisma, socket.io-client, name, private, type (+1 more)

### Community 94 - "createRuntime"
Cohesion: 0.09
Nodes (9): BlockingPushWorktreeService, createTempRepository(), execFileAsync, execGit(), FailingClosePreviewTunnelPort, FailingHealthcheckService, FakeHostCommandExecutor, FakePreviewTunnelPort (+1 more)

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
Cohesion: 0.20
Nodes (5): isCommandAcknowledgement(), AgentCommandEnvelope, RecordingAgentCommandRouter, port, server

### Community 105 - "HealthController"
Cohesion: 0.19
Nodes (8): mapReviewRequest(), ReviewRequestsRepositoryAdapter, Inject, Injectable, CreateReviewRequestInput, ReviewRequestsRepository, ReviewRequestRecord, InMemoryReviewRequestsRepository

### Community 106 - "server"
Cohesion: 0.12
Nodes (16): InvitationsService, Inject, Injectable, isExternalIdentityProvider(), isProjectMembershipRole(), mapProjectMembership(), parseExternalIdentityProvider(), parseProjectMembershipRole() (+8 more)

### Community 107 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): extends, include, src/**/*.ts, ../../tsconfig.base.json, ../../tests/packages/local-agent/**/*.ts

### Community 108 - "persistence.integration.test.ts"
Cohesion: 0.17
Nodes (10): agentEvents, externalIdentities, prisma, projects, seedSessionFixture(), sessionMembers, sessions, sourceControlConnections (+2 more)

### Community 109 - "dotenv"
Cohesion: 0.26
Nodes (7): mapMessage(), MessagesRepositoryAdapter, Inject, Injectable, CreateMessageInput, MessagesRepository, SessionMessage

### Community 110 - "AgentEventEnvelope"
Cohesion: 0.29
Nodes (5): ConnectedSocket, MessageBody, SubscribeMessage, AgentEventEnvelope, ErrorEventEnvelope

### Community 112 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 113 - "GithubSourceControlAdapter"
Cohesion: 0.42
Nodes (4): githubHeaders(), GithubSourceControlAdapter, isTestConnection(), Injectable

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

### Community 121 - "reflect-metadata"
Cohesion: 0.19
Nodes (7): DockerOrphanReconcileInput, DockerOrphanReconciler, DockerOrphanReconcilerDependencies, execFileAsync, listManagedContainers(), ManagedDockerContainer, stopContainers()

### Community 122 - "01 Flow — PM Shared Projects Dashboard"
Cohesion: 0.67
Nodes (3): 01 Dev — Developer Shared Projects Dashboard, 01 Flow — PM Shared Projects Dashboard, 02 Flow — PM Shared Projects Dashboard

### Community 123 - "01 Session 2 — Responsive Fix Session Workspace"
Cohesion: 0.67
Nodes (3): 01 Session 2 — Responsive Fix Session Workspace, 01 Session 3 — Responsive Fix Session Workspace, 02 Dev — Responsive Fix Session Workspace

### Community 124 - "session-access.guard.ts"
Cohesion: 0.29
Nodes (4): RequireSessionAccess(), SessionAccessGuard, Inject, Injectable

### Community 125 - "agent-prompt-command.integration.test.ts"
Cohesion: 0.06
Nodes (16): AlwaysChangingHarnessPort, buildPrepareCommand(), CancellableHarnessPort, createAgentServer(), createManagedWorktreeRoot(), createPreparedValidationFeedbackClient(), createTempRepository(), execFileAsync (+8 more)

### Community 126 - "tool-readiness-panel.tsx"
Cohesion: 0.38
Nodes (6): checkLabels, statusTone(), ToolReadinessPanelProps, ToolReadinessRow(), ToolReadinessCheck, DeveloperProjectReadiness

### Community 127 - "@nestjs/websockets"
Cohesion: 0.12
Nodes (11): AppModule, Module, bootstrap(), prisma, startApplication(), waitFor(), authenticatePm(), prisma (+3 more)

### Community 128 - "AGENTS.md"
Cohesion: 0.40
Nodes (4): Fixtures, MVP E2E scenario, Reproduce locally, What it proves

### Community 129 - "migration.sql"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Trace all suggested graph questions using documentation only, Source Nodes

### Community 130 - ".create"
Cohesion: 0.25
Nodes (6): AuthProvider, OAuthStartUrlConfig, DEVELOPER_IDENTITY_PORT, PM_IDENTITY_PORT, AuthEnvironment, isDevelopmentPmAuthEnabled()

### Community 131 - "prisma.config.ts"
Cohesion: 0.24
Nodes (8): currentDirectory, databaseTargetEnvironment, buildAdapter(), currentDirectory, DatabaseEnvironment, DatabaseTarget, parseDatabaseTarget(), resolveDatabaseConnectionString()

### Community 137 - "Containers"
Cohesion: 0.40
Nodes (4): Architectural interpretation, Contents, How to view, PairDock collaborative developer/PM prototype

### Community 139 - "SessionMembersRepositoryAdapter"
Cohesion: 0.33
Nodes (5): Deployment security audit — 2026-07-19, Operational requirements and residual risk, Resolved findings, Scope, Verification

### Community 144 - "pm-activity-page.tsx"
Cohesion: 0.47
Nodes (3): HealthController, Controller, Get

### Community 145 - ".assertConnected"
Cohesion: 0.33
Nodes (4): HealthcheckService, HealthcheckTimeoutError, HealthcheckWaitInput, HealthcheckResult

### Community 147 - "Get"
Cohesion: 0.18
Nodes (8): mapProject(), ProjectsRepositoryAdapter, Injectable, CreateProjectInput, DeveloperProjectRecord, ProjectsRepository, SharedProjectRecord, Project

### Community 148 - "SharedProjectSummary"
Cohesion: 0.60
Nodes (4): SessionStarted, StartPmSessionInput, UseSharedProjectsResult, SharedProjectSummary

### Community 150 - "SharedProjectSummary"
Cohesion: 0.20
Nodes (12): SharedProjectCard(), cleanCallbackHash(), clearAuthSession(), getAuthSessionSnapshot(), readCallbackSession(), subscribe(), useAuthSession(), useSharedProjects() (+4 more)

### Community 154 - "ui.ts"
Cohesion: 0.08
Nodes (23): createDeveloperProjectInputSchema, createDraftReviewRequestInputSchema, developerProjectReadinessSchema, developerProjectSessionSummarySchema, developerProjectSetupSchema, developerProjectSummaryListSchema, developerProjectSummarySchema, DeveloperSetupAgent (+15 more)

### Community 158 - "ValidationService"
Cohesion: 0.27
Nodes (5): toValidationView(), Inject, Injectable, ValidationService, ChecksResultEventEnvelope

### Community 159 - "PairDock collaborative developer/PM prototype"
Cohesion: 0.40
Nodes (5): Agent → backend events, Backend → agent commands, Backend ↔ agent WebSocket contract, Common envelope, UI session-start contract

### Community 160 - "Frontend product surfaces"
Cohesion: 0.40
Nodes (5): Developer dashboard, Frontend product surfaces, Login, PM dashboard, Session workspace

## Knowledge Gaps
- **620 isolated node(s):** `Workspace`, `Commands`, `1. GitHub App`, `2. Slack App`, `3. Start PairDock` (+615 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AgentClient` connect `AgentClient` to `agent-config.ts`, `developer-project-form.tsx`, `resolve`, `@nestjs/websockets`, `session-details.integration.test.ts`, `command-handling.integration.test.ts`, `readiness-runner.ts`, `agent-client.ts`, `mvp-flow.e2e.test.ts`, `agent-prompt-command.integration.test.ts`, `agent-events.repository.ts`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `SessionRunner` connect `developer-project-form.tsx` to `agent-config.ts`, `create-draft-review-request.use-case.ts`, `SessionRegistry`, `ReviewRequestsRepository`, `resolve`, `session-runner.ts`, `session-details.integration.test.ts`, `command-handling.integration.test.ts`, `ProjectPreviewConfig`, `json-parsers.ts`, `AgentClient`, `createRuntime`, `reflect-metadata`, `mvp-flow.e2e.test.ts`, `agent-prompt-command.integration.test.ts`, `agent-client.ts`, `agent-events.repository.ts`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `DatabaseClient` connect `session-prompt.service.ts` to `prisma.config.ts`, `persistence.module.ts`, `PairDockUser`, `Get`, `slack-pm-identity.adapter.ts`, `DatabaseExecutor`, `ToolReadinessService`, `DatabaseClient`, `test-json.ts`, `SessionsService`, `Backend NestJS modules`, `dependencies`, `ui-gateway.browser-auth.integration.test.ts`, `DatabaseExecutor`, `validation.integration.test.ts`, `shared-projects.integration.test.ts`, `auth.service.ts`, `agent-gateway.integration.test.ts`, `auth.integration.test.ts`, `HealthController`, `server`, `persistence.integration.test.ts`, `dotenv`, `@nestjs/websockets`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `Workspace`, `Commands`, `1. GitHub App` to the rest of the system?**
  _620 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agent-config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.057902973395931145 - nodes in this community are weakly interconnected._
- **Should `create-draft-review-request.use-case.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07358156028368794 - nodes in this community are weakly interconnected._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.038461538461538464 - nodes in this community are weakly interconnected._