# Graph Report - feat-docker-validation-feedback  (2026-07-23)

## Corpus Check
- 279 files · ~122,988 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2607 nodes · 5697 edges · 158 communities (134 shown, 24 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 94 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `23807092`
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
- pm-session-start.integration.test.ts
- session-prompt.service.ts
- auth.service.ts
- AgentCommandEnvelope
- BT-050 — Same-email cross-role accounts remain independent
- Screens represented
- .create
- .authenticateDeveloper
- agent-command-routing.integration.test.ts
- agent-gateway.integration.test.ts
- package.json
- createRuntime
- PairDock Interactive Prototype
- auth.integration.test.ts
- persistence.boundaries.test.ts
- tsconfig.json
- package.json
- HealthController
- Correction Workflow State
- resolve
- package.json
- HealthController
- tsconfig.json
- Backend ↔ agent WebSocket contract
- dotenv
- MVP E2E scenario
- Q: Trace all suggested graph questions using documentation only
- tsconfig.json
- Frontend product surfaces
- tsconfig.json
- PairDock collaborative developer/PM prototype
- SourceControlPort
- ci-gates.test.ts
- main.tsx
- 01 Fixed — Nimbus Trial Button Fix Preview
- ValidationService
- reflect-metadata
- 01 Flow — PM Shared Projects Dashboard
- 01 Session 2 — Responsive Fix Session Workspace
- AGENTS.md
- agent-prompt-command.integration.test.ts
- @nestjs/websockets
- SessionRegistry
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
- DeveloperProjectSetup
- Get
- SharedProjectSummary
- Deployment security audit — 2026-07-19
- pm-activity-page.tsx
- session-history.integration.test.ts
- ui.ts
- @pairdock/shared-contracts
- ValidationService
- ReadyPreviewTunnelPort
- preview-presets.ts
- agent-client.integration.test.ts
- @nestjs/common
- Prototype Reference Package

## God Nodes (most connected - your core abstractions)
1. `PairDockIdentity` - 51 edges
2. `Behavior test plan — PairDock MVP` - 51 edges
3. `parseJsonResponse()` - 46 edges
4. `DatabaseClient` - 41 edges
5. `Session` - 39 edges
6. `AppModule` - 36 edges
7. `Project` - 34 edges
8. `SandboxRef` - 34 edges
9. `AgentClient` - 34 edges
10. `ProjectsService` - 32 edges

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

## Communities (158 total, 24 thin omitted)

### Community 0 - "agent-config.ts"
Cohesion: 0.14
Nodes (32): agentConfigFileSchema, agentHarnessConfigSchema, agentModelConfigSchema, agentProjectDescriptorSchema, assertHttpUrlTemplate(), assertLoopbackPortMapping(), assertLoopbackUrlTemplate(), assertSafeContainerImage() (+24 more)

### Community 1 - "create-draft-review-request.use-case.ts"
Cohesion: 0.07
Nodes (10): HealthcheckWaitInput, SandboxPort, SandboxRef, ReadySandboxPort, ReadySandboxPort, ReadySandboxPort, TimeoutSandboxPort, ReadySandboxPort (+2 more)

### Community 2 - "Button"
Cohesion: 0.25
Nodes (3): prisma, startApplication(), waitFor()

### Community 3 - "events.ts"
Cohesion: 0.06
Nodes (39): AgentCancelCommandEnvelope, agentCancelCommandEnvelopeSchema, agentCommandEnvelopeSchema, AgentPromptCommandEnvelope, agentPromptCommandEnvelopeSchema, ChecksRunCommandEnvelope, checksRunCommandEnvelopeSchema, GitGetDiffCommandEnvelope (+31 more)

### Community 4 - "index.ts"
Cohesion: 0.13
Nodes (14): mapSourceControlConnection(), SourceControlConnectionsRepositoryAdapter, Injectable, CreateSourceControlConnectionInput, SourceControlConnectionsRepository, buildConventionalCommitMessage(), buildGitPushBranchCommand(), buildSessionBranchName() (+6 more)

### Community 5 - "index.ts"
Cohesion: 0.16
Nodes (9): requestJson(), FeedIdentity, feedRegistry, getFeed(), SessionEventFeed, useSessionEventFeed(), getBackendUrl(), FeedConnectionState (+1 more)

### Community 6 - "developer-home-page.tsx"
Cohesion: 0.07
Nodes (27): authApi, DeveloperLoginCard(), PmLoginCard(), PmLoginCardProps, BrandIconProps, GitHubIcon(), SlackIcon(), Button() (+19 more)

### Community 7 - "app-shell.tsx"
Cohesion: 0.14
Nodes (17): allocateHostPort(), appendLogs(), assertSafeContainerImage(), buildContainerHardeningArgs(), buildDockerCheckArgs(), buildDockerRunArgs(), DockerSandboxAdapter, DockerSandboxAdapterDependencies (+9 more)

### Community 8 - "SandboxRef"
Cohesion: 0.10
Nodes (20): Architecture style, Current repository context, Dependency rules, Diagram links, External ports/adapters, Frontend styling, Local agent structure, Login interface (+12 more)

### Community 9 - "persistence.module.ts"
Cohesion: 0.13
Nodes (22): AgentGatewayModule, Module, AuthModule, Module, InvitationsModule, Module, PersistenceModule, Module (+14 more)

### Community 10 - "PairDockUser"
Cohesion: 0.14
Nodes (10): mapUser(), Inject, Injectable, UsersRepositoryAdapter, CreateUserInput, UsersRepository, Inject, Injectable (+2 more)

### Community 11 - "client.ts"
Cohesion: 0.19
Nodes (11): Inject, isProjectMembershipRole(), mapProjectMembership(), parseProjectMembershipRole(), ProjectMembersRepositoryAdapter, Injectable, AddProjectMemberInput, ProjectMembersRepository (+3 more)

### Community 12 - "sessions.service.ts"
Cohesion: 0.17
Nodes (6): Inject, AuthService, buildFrontendAuthRedirectUrl(), readOAuthStartUrlConfig(), Inject, Injectable

### Community 13 - "session.ts"
Cohesion: 0.08
Nodes (19): ApiClient, authHeaders(), AuthProviders, authProvidersSchema, CreateSessionInput, jsonHeaders(), RequestOptions, responseErrorSchema (+11 more)

### Community 14 - "scripts"
Cohesion: 0.05
Nodes (36): @biomejs/biome, devDependencies, @biomejs/biome, tsx, @types/node, typescript, name, overrides (+28 more)

### Community 15 - "ConnectedAgentsRegistry"
Cohesion: 0.14
Nodes (16): AgentHarnessEvent, AgentHarnessEventQueue, buildCodexPrompt(), buildCodexSecurityArgs(), buildCommandArgs(), buildHarnessEnvironment(), CodexHarnessAdapter, isCodexCommand() (+8 more)

### Community 16 - "PairDockIdentity"
Cohesion: 0.15
Nodes (8): isRecord(), ProjectsService, resolveUnavailableReason(), Injectable, PairDockIdentity, CreateDeveloperProjectInput, DeveloperProjectSummary, SharedSessionHistoryItem

### Community 17 - "AuthService"
Cohesion: 0.25
Nodes (15): assertStateCookie(), AuthCallbackBody, AuthController, clearStateCookie(), HeaderResponse, readCookie(), readStateFromRedirectUrl(), secureCookieSuffix() (+7 more)

### Community 18 - "ProjectPreviewConfig"
Cohesion: 0.18
Nodes (11): @pairdock/shared-contracts, socket.io-client, zod, @tanstack/react-form, @tanstack/react-query, dependencies, @pairdock/shared-contracts, socket.io-client (+3 more)

### Community 19 - "support.js"
Cohesion: 0.12
Nodes (9): compileTemplate(), dcNameFromPath(), encodeCase(), isElementClass(), isRenderableType(), loadReactUmd(), loadScript(), rootNameForDocument() (+1 more)

### Community 20 - "json-parsers.ts"
Cohesion: 0.20
Nodes (5): createTempRepository(), execFileAsync, execGit(), HARNESS_SCRIPT_PATH, ReadyPreviewTunnelPort

### Community 21 - "pm-session-page.tsx"
Cohesion: 0.08
Nodes (18): Inject, mapMessage(), MessagesRepositoryAdapter, Inject, Injectable, Inject, Inject, Inject (+10 more)

### Community 22 - "includes"
Cohesion: 0.08
Nodes (24): **, !apps/api/prisma/migrations, !apps/api/src/generated, !**/coverage, !**/dist, !graphify-out, !**/node_modules, !prototype (+16 more)

### Community 23 - "package.json"
Cohesion: 0.08
Nodes (24): @pairdock/shared-contracts, socket.io, socket.io-client, zod, bin, pairdock-agent, dependencies, @pairdock/shared-contracts (+16 more)

### Community 24 - "readiness-runner.ts"
Cohesion: 0.22
Nodes (12): CommandResult, CommandRunner, failed(), failureMessage(), isCodexExecutable(), passed(), ReadinessResult, ReadinessRunner (+4 more)

### Community 25 - "agent-client.ts"
Cohesion: 0.14
Nodes (25): buildValidationRepairPrompt(), hasRepairableCheckFailure(), isRetryableError(), AgentEventEnvelopeInput, buildAgentConnectedEvent(), buildAgentDoneEvent(), buildAgentOutputEvent(), buildChecksResultEvent() (+17 more)

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
Cohesion: 0.07
Nodes (25): AuthTokenOptions, AuthTokenService, hasValidSignature(), isRecord(), isUserKind(), parseTokenPayload(), resolveSecret(), TokenPayload (+17 more)

### Community 30 - "github-developer-identity.adapter.ts"
Cohesion: 0.07
Nodes (33): AgentRegistrationsRepositoryAdapter, isRecord(), mapAgentRegistration(), parseModels(), parseProjects(), parseStringArray(), Inject, Injectable (+25 more)

### Community 31 - "agent-events.repository.ts"
Cohesion: 0.13
Nodes (7): CheckCommandExecutor, CheckResult, ChecksRunner, isTransientPackageExtractionFailure(), RunChecksInput, LogRedactor, RecordingChecksRunner

### Community 32 - "external-identities.repository.ts"
Cohesion: 0.14
Nodes (14): Fetcher, GithubDeveloperIdentityAdapter, GithubDeveloperIdentityConfig, GithubEmailResponse, githubHeaders(), GithubInstallationMetadata, GithubInstallationsResponse, GithubOAuthResponse (+6 more)

### Community 33 - "slack-pm-identity.adapter.ts"
Cohesion: 0.10
Nodes (25): ProjectChecksConfig, AgentConfig, AgentModelConfig, AgentProjectDescriptor, SaveAgentConfigInput, CommandResult, containerImageSchema, enrichConfigWithProjectManifests() (+17 more)

### Community 34 - "WorktreeService"
Cohesion: 0.21
Nodes (7): branchExists(), execFileAsync, execGit(), pathExists(), remoteExists(), WorktreeService, BlockingPushWorktreeService

### Community 35 - "sessions.controller.ts"
Cohesion: 0.33
Nodes (13): "agent_events", "agent_registrations", "external_identities", "github_installations", "messages", "project_members", "project_readiness_snapshots", "projects" (+5 more)

### Community 36 - "DatabaseExecutor"
Cohesion: 0.36
Nodes (3): AuthenticatedUserGuard, Injectable, RequireAuth()

### Community 37 - "ReviewRequestsRepository"
Cohesion: 0.15
Nodes (12): PreparedWorktree, DEFAULT_SESSION_STATE_PATH, FileSessionWorkspaceStore, isMissingFileError(), metadataSchema, stateSchema, toPersistedWorkspace(), workspaceSchema (+4 more)

### Community 38 - "SessionsController"
Cohesion: 0.25
Nodes (14): loadAgentConfig(), resolveAgentConfigPath(), saveAgentConfig(), summarizeAgentConfig(), main(), parseModelMapping(), parseModelMappings(), parseProjectMapping() (+6 more)

### Community 39 - "ToolReadinessService"
Cohesion: 0.12
Nodes (17): mapValidationRun(), Injectable, ValidationRunsRepositoryAdapter, CreateValidationRunInput, ValidationRunsRepository, Module, ValidationModule, Injectable (+9 more)

### Community 40 - "Implementation handoff — PairDock MVP"
Cohesion: 0.04
Nodes (51): Behavior test plan — PairDock MVP, BT-001 — Installable workspace, BT-002 — Session creation is persisted, BT-003 — Agent event is persisted, BT-004 — PM member access is allowed, BT-005 — Non-member access is denied, BT-006 — Valid session transitions, BT-007 — Invalid transition is rejected (+43 more)

### Community 41 - "docker-sandbox.adapter.ts"
Cohesion: 0.13
Nodes (16): assertSafeContainerImage(), buildCloudflareDockerArgs(), buildTunnelContainerName(), CloudflarePreviewTunnelAdapter, CloudflarePreviewTunnelDependencies, ManagedTunnelProcess, onceExit(), resolveRestoredTunnelContainerName() (+8 more)

### Community 42 - "session-runner.ts"
Cohesion: 0.11
Nodes (18): Implementation handoff — PairDock MVP, T01 — Monorepo and shared contracts, T02 — Prisma persistence foundation, T03 — Auth and session permissions, T04 — Backend session lifecycle, T05 — Backend ↔ agent WebSocket, T06 — Local agent: config, login, connection, T07 — Local agent: worktree and cleanup (+10 more)

### Community 43 - "ui.ts"
Cohesion: 0.38
Nodes (12): collectProps(), compileAttr(), cssToObj(), hostPositionStyle(), kebabToCamel(), walk(), walkChildren(), walkComponent() (+4 more)

### Community 44 - "tool-readiness.integration.test.ts"
Cohesion: 0.29
Nodes (7): get(), createExternalModules(), createHelmetManager(), createPseudoSheet(), createRegistry(), createRuntime(), Placeholder()

### Community 45 - "tool-readiness-panel.tsx"
Cohesion: 0.07
Nodes (22): AGENT_AUTHENTICATION_OPTIONS, AgentAuthenticationOptions, AgentAuthenticationService, AgentCredentialInput, AuthenticatedAgentPrincipal, extractBearerToken(), isRecord(), parseCredentials() (+14 more)

### Community 46 - "session-details.integration.test.ts"
Cohesion: 0.25
Nodes (8): findTopLevelEquality(), parensWrapWhole(), resolve(), resolvePath(), waitFor(), waitForReadiness(), waitForReadiness(), emitCommandWithAcknowledgement()

### Community 47 - "diff.service.ts"
Cohesion: 0.42
Nodes (4): githubHeaders(), GithubSourceControlAdapter, isTestConnection(), Injectable

### Community 48 - "command-handling.integration.test.ts"
Cohesion: 0.07
Nodes (17): HealthcheckService, HealthcheckTimeoutError, HealthcheckResult, ProjectPreviewConfig, SessionCloseResult, SessionPrepareHooks, SessionRecoveryResult, SessionRunnerConfig (+9 more)

### Community 49 - "codex-model-catalog.ts"
Cohesion: 0.19
Nodes (12): applyCodexCommandToProjects(), CodexCatalogOptions, CodexInstallation, codexModelCacheSchema, codexModelSchema, codexReasoningLevelSchema, compareVersions(), enrichConfigWithCodexModels() (+4 more)

### Community 50 - "DatabaseClient"
Cohesion: 0.17
Nodes (24): AGENT_EVENTS_REPOSITORY, AGENT_REGISTRATIONS_REPOSITORY, EXTERNAL_IDENTITIES_REPOSITORY, MESSAGES_REPOSITORY, PERSISTENCE_UNIT_OF_WORK, PROJECT_MEMBERS_REPOSITORY, PROJECT_READINESS_REPOSITORY, PROJECTS_REPOSITORY (+16 more)

### Community 51 - "example-project.integration.test.ts"
Cohesion: 0.16
Nodes (17): ConversationThread(), ConversationThreadProps, ReviewRequestDialog(), useSessionData(), asRecord(), buildSessionConversation(), extractErrorMessage(), humanizeAgentError() (+9 more)

### Community 53 - "test-json.ts"
Cohesion: 0.11
Nodes (9): AgentHarnessPort, RunPromptInput, SimulatedAgentHarness, AlwaysChangingHarnessPort, CancellableHarnessPort, InitialChangeOnlyHarnessPort, MutatingHarnessPort, RecordingHarnessPort (+1 more)

### Community 54 - "SessionsService"
Cohesion: 0.47
Nodes (3): ChecksResult, SequencedChecksRunner, WorktreeMutatingChecksRunner

### Community 55 - "AuthenticatedRequest"
Cohesion: 0.19
Nodes (9): DiffService, isSessionDiffPayload(), SessionDiffView, AgentEventsRepositoryAdapter, Injectable, mapAgentEvent(), AgentEventsRepository, CreateAgentEventInput (+1 more)

### Community 56 - "SessionsService"
Cohesion: 0.29
Nodes (7): createComponentFactory(), evalDcLogic(), getReact(), walkText(), warnUnresolved(), react, react

### Community 57 - "PRD — PairDock MVP"
Cohesion: 0.12
Nodes (15): Actors, Assumptions, Fixed constraints, Functional requirements, Goals, Handoff summary, Non-functional requirements, Non-goals for MVP (+7 more)

### Community 58 - "slack-pm-identity.adapter.ts"
Cohesion: 0.15
Nodes (11): Fetcher, parseFixtureIdentity(), SlackAuthTestResponse, slackHeaders(), SlackOAuthResponse, SlackPmIdentityAdapter, SlackPmIdentityConfig, SlackUserInfoResponse (+3 more)

### Community 59 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, dotenv, @nestjs/core, @nestjs/platform-socket.io, @pairdock/domain, @prisma/client, reflect-metadata, rxjs (+7 more)

### Community 60 - "Backend NestJS modules"
Cohesion: 0.12
Nodes (17): AgentGatewayModule, AuditLogModule, AuthModule, Backend NestJS modules, DiffModule, GithubModule, InvitationsModule, PersistenceModule (+9 more)

### Community 61 - "include"
Cohesion: 0.13
Nodes (14): src/**/*.ts, ../../tsconfig.base.json, DOM, DOM.Iterable, ES2022, src/**/*.tsx, ../../tests/apps/web/**/*.ts, ../../tests/apps/web/**/*.tsx (+6 more)

### Community 62 - "scripts"
Cohesion: 0.12
Nodes (16): scripts, build, db:migrate, db:migrate:dev, db:migrate:test, db:reset, db:seed:pm-demo, db:status (+8 more)

### Community 63 - "AgentAuthenticationService"
Cohesion: 0.25
Nodes (8): ChangedFile, CollectedDiff, DiffService, execFileAsync, execGit(), execGitAllowingDiffExitCode(), isGitDiffExitCode(), normalizeStatusPath()

### Community 64 - "source-control-connections.repository.ts"
Cohesion: 0.25
Nodes (11): AuthenticatedRequest, ProjectsController, Body, Controller, Get, Inject, Param, Post (+3 more)

### Community 65 - "use-app-route.ts"
Cohesion: 0.13
Nodes (22): AppShell(), getAppRouteSnapshot(), loginRoute, openDeveloperHome(), openLogin(), openPmDashboard(), openPmReviewRequests(), openPmSession() (+14 more)

### Community 66 - "compilerOptions"
Cohesion: 0.14
Nodes (13): node, compilerOptions, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, noEmit (+5 more)

### Community 68 - "json-parsers.ts"
Cohesion: 0.19
Nodes (9): mapProjectReadinessSnapshot(), ProjectReadinessRepositoryAdapter, Injectable, ProjectReadinessRepository, UpsertProjectReadinessInput, Inject, Inject, ProjectReadinessSnapshot (+1 more)

### Community 69 - "Product"
Cohesion: 0.22
Nodes (8): Accessibility & Inclusion, Anti-references, Brand Personality, Design Principles, Product, Product Purpose, Register, Users

### Community 70 - "dependencies"
Cohesion: 0.17
Nodes (6): authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication(), sessionPromptResponseSchema

### Community 71 - "developer-project-form.tsx"
Cohesion: 0.27
Nodes (5): errorMessage(), SessionRunner, GitPushBranchCommandEnvelope, SessionCloseCommandEnvelope, SessionPrepareCommandEnvelope

### Community 72 - "V1 developer setup"
Cohesion: 0.09
Nodes (20): Deploy, update, or roll back, Deployment environment, Local developer agent and previews, One-time server setup, PairDock production deployment, Release images, Security before exposing PairDock, 1. GitHub App (+12 more)

### Community 73 - "ui-gateway.browser-auth.integration.test.ts"
Cohesion: 0.15
Nodes (6): sessionIdResponseSchema, authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication()

### Community 74 - "DatabaseExecutor"
Cohesion: 0.08
Nodes (24): mapSessionMember(), SessionMembersRepositoryAdapter, Injectable, createPersistenceRepositories(), PersistenceUnitOfWorkAdapter, Inject, Injectable, DatabaseClient (+16 more)

### Community 75 - "ToolReadinessService"
Cohesion: 0.16
Nodes (12): ToolReadinessController, Controller, Get, HttpCode, Inject, Param, Post, Req (+4 more)

### Community 76 - "pm-activity-page.tsx"
Cohesion: 0.13
Nodes (15): ButtonProps, ButtonVariant, variantClasses, ConnectionActivityRail(), ConnectionActivityRailProps, RailMetricProps, SectionCard(), SectionCardProps (+7 more)

### Community 77 - "commands.ts"
Cohesion: 0.11
Nodes (13): AgentGateway, isLifecycleProgressStatus(), toSessionAgentEvent(), ConnectedSocket, Injectable, MessageBody, SubscribeMessage, WebSocketGateway (+5 more)

### Community 78 - "package.json"
Cohesion: 0.17
Nodes (11): zod, dependencies, zod, exports, name, private, scripts, build (+3 more)

### Community 79 - "validation.integration.test.ts"
Cohesion: 0.11
Nodes (14): AppModule, Module, bootstrap(), startApplication(), authenticatePm(), prisma, startApplication(), authenticatePm() (+6 more)

### Community 80 - "shared-projects.integration.test.ts"
Cohesion: 0.24
Nodes (7): announceAgent(), authenticatePm(), prisma, publishReadiness(), sendAgentEvent(), startApplication(), waitForConnect()

### Community 81 - "pm-session-start.integration.test.ts"
Cohesion: 0.24
Nodes (7): announceAgent(), authenticatePm(), prisma, publishReadiness(), sendAgentEvent(), startApplication(), waitForConnect()

### Community 82 - "session-prompt.service.ts"
Cohesion: 0.24
Nodes (11): DEVELOPMENT_PM, main(), assertLocalDevelopmentSeedTarget(), buildPmDemoSessions(), demoDiff(), deterministicUuid(), passingValidation(), PmDemoMessage (+3 more)

### Community 83 - "auth.service.ts"
Cohesion: 0.15
Nodes (12): AgentProjectOption, DeveloperProjectForm(), DeveloperProjectFormProps, ProjectFormState, ProjectSetupStateProps, resolveModelOptions(), ExecutionSelection, ExecutionSelectionControls() (+4 more)

### Community 84 - "AgentCommandEnvelope"
Cohesion: 0.18
Nodes (10): Architecture documents reconciled, Developer dashboard, Implementation guidance, Login, PM shared-project dashboard, Prototype notes — PairDock collaborative developer/PM, Purpose, Running/fixed/review states (+2 more)

### Community 85 - "BT-050 — Same-email cross-role accounts remain independent"
Cohesion: 0.22
Nodes (8): exports, name, private, scripts, build, typecheck, type, version

### Community 86 - "Screens represented"
Cohesion: 0.29
Nodes (8): boot(), getReactDOM(), init(), parseDataProps(), parseDcDocument(), parseDcText(), react-dom, react-dom

### Community 88 - ".authenticateDeveloper"
Cohesion: 0.52
Nodes (4): Body, HttpCode, Post, AuthResult

### Community 89 - "agent-command-routing.integration.test.ts"
Cohesion: 0.16
Nodes (6): createTempRepository(), execFileAsync, execGit(), prisma, ReadyPreviewTunnelPort, startApplication()

### Community 90 - "agent-gateway.integration.test.ts"
Cohesion: 0.17
Nodes (5): authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication()

### Community 92 - "package.json"
Cohesion: 0.20
Nodes (9): devDependencies, prisma, socket.io-client, socket.io-client, name, private, type, version (+1 more)

### Community 94 - "createRuntime"
Cohesion: 0.15
Nodes (8): isInsideSensitiveDirectory(), normalizeRelativePath(), SensitiveFilesPolicy, createTempRepository(), execFileAsync, execGit(), FailingClosePreviewTunnelPort, FakePreviewTunnelPort

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
Nodes (8): src/**/*.ts, ../../tsconfig.base.json, ../../tests/apps/api/**/*.ts, compilerOptions, emitDecoratorMetadata, experimentalDecorators, extends, include

### Community 99 - "package.json"
Cohesion: 0.25
Nodes (7): name, private, scripts, build, lint, test, type

### Community 101 - "HealthController"
Cohesion: 0.33
Nodes (4): createFakeGithubServer(), githubInstallations, json(), previousEnv

### Community 102 - "Correction Workflow State"
Cohesion: 0.25
Nodes (8): Clean Correction Prompt State, Developer Correction Request State, Correction Workflow State, Session Workspace State, Follow-up Workflow State, Follow-up Session Workspace State, Demo Navigation State, Session Correction Request State

### Community 103 - "resolve"
Cohesion: 0.40
Nodes (4): Fixtures, MVP E2E scenario, Reproduce locally, What it proves

### Community 104 - "package.json"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Trace all suggested graph questions using documentation only, Source Nodes

### Community 105 - "HealthController"
Cohesion: 0.22
Nodes (7): mapReviewRequest(), ReviewRequestsRepositoryAdapter, Injectable, CreateReviewRequestInput, ReviewRequestsRepository, ReviewRequestRecord, InMemoryReviewRequestsRepository

### Community 107 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): src/**/*.ts, ../../tsconfig.base.json, ../../tests/packages/local-agent/**/*.ts, extends, include

### Community 108 - "Backend ↔ agent WebSocket contract"
Cohesion: 0.40
Nodes (5): Agent → backend events, Backend → agent commands, Backend ↔ agent WebSocket contract, Common envelope, UI session-start contract

### Community 109 - "dotenv"
Cohesion: 0.16
Nodes (7): Inject, buildSessionPrepareCommand(), compareSessionMembers(), formatUserDisplayName(), sessionMemberOrder(), SessionsService, Injectable

### Community 110 - "MVP E2E scenario"
Cohesion: 0.40
Nodes (4): Architectural interpretation, Contents, How to view, PairDock collaborative developer/PM prototype

### Community 112 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): src/**/*.ts, ../../tsconfig.base.json, extends, include

### Community 113 - "Frontend product surfaces"
Cohesion: 0.40
Nodes (5): Developer dashboard, Frontend product surfaces, Login, PM dashboard, Session workspace

### Community 114 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): src/**/*.ts, ../../tsconfig.base.json, extends, include

### Community 117 - "ci-gates.test.ts"
Cohesion: 0.40
Nodes (3): repositoryRoot, rootPackageJson, workflowPath

### Community 118 - "main.tsx"
Cohesion: 0.33
Nodes (4): queryClient, rootElement, LoginPage(), renderLoginPage()

### Community 119 - "01 Fixed — Nimbus Trial Button Fix Preview"
Cohesion: 0.50
Nodes (4): 01 Clean — Blank Nimbus Landing Preview, 01 Fixed — Nimbus Trial Button Fix Preview, 02 Clean — Blank Nimbus Landing Preview, 02 Fixed — Nimbus Trial Button Fix Preview

### Community 120 - "ValidationService"
Cohesion: 0.06
Nodes (28): AgentCommandRouterService, Inject, Injectable, mapSession(), SessionsRepositoryAdapter, Injectable, SESSIONS_REPOSITORY, CreateSessionInput (+20 more)

### Community 122 - "01 Flow — PM Shared Projects Dashboard"
Cohesion: 0.67
Nodes (3): 01 Dev — Developer Shared Projects Dashboard, 01 Flow — PM Shared Projects Dashboard, 02 Flow — PM Shared Projects Dashboard

### Community 123 - "01 Session 2 — Responsive Fix Session Workspace"
Cohesion: 0.67
Nodes (3): 01 Session 2 — Responsive Fix Session Workspace, 01 Session 3 — Responsive Fix Session Workspace, 02 Dev — Responsive Fix Session Workspace

### Community 125 - "agent-prompt-command.integration.test.ts"
Cohesion: 0.13
Nodes (9): buildPrepareCommand(), createManagedWorktreeRoot(), createPreparedValidationFeedbackClient(), createTempRepository(), execFileAsync, execGit(), ReadySandboxPort, waitForAgentEvent() (+1 more)

### Community 130 - ".create"
Cohesion: 0.20
Nodes (8): AuthProvider, AuthProviders, hasAccessibleGithubInstallation(), OAuthStartUrlConfig, DEVELOPER_IDENTITY_PORT, PM_IDENTITY_PORT, AuthEnvironment, isDevelopmentPmAuthEnabled()

### Community 131 - "prisma.config.ts"
Cohesion: 0.24
Nodes (7): currentDirectory, databaseTargetEnvironment, buildAdapter(), DatabaseEnvironment, DatabaseTarget, parseDatabaseTarget(), resolveDatabaseConnectionString()

### Community 139 - "SessionMembersRepositoryAdapter"
Cohesion: 0.11
Nodes (15): AgentExecutionCapabilitiesService, SessionExecutionSelection, Inject, Injectable, Inject, AgentProjectBindingService, repositoriesMatch(), Inject (+7 more)

### Community 143 - "validation.integration.test.ts"
Cohesion: 0.11
Nodes (9): authenticateDeveloper(), createSession(), prisma, startApplication(), authenticateDeveloper(), prisma, startApplication(), idResponseSchema (+1 more)

### Community 144 - "pm-activity-page.tsx"
Cohesion: 0.47
Nodes (3): HealthController, Controller, Get

### Community 145 - ".assertConnected"
Cohesion: 0.11
Nodes (16): authenticateDeveloper(), authenticatePm(), prisma, startApplication(), authenticatePm(), prisma, authResponseSchema, developerProjectListResponseSchema (+8 more)

### Community 147 - "Get"
Cohesion: 0.18
Nodes (8): mapProject(), ProjectsRepositoryAdapter, Injectable, CreateProjectInput, DeveloperProjectRecord, ProjectsRepository, SharedProjectRecord, Project

### Community 150 - "SharedProjectSummary"
Cohesion: 0.14
Nodes (14): createApiClient(), SharedProjectCard(), SharedProjectCardProps, SessionStarted, StartPmSessionInput, useSharedProjects(), UseSharedProjectsResult, useSharedSessionHistory() (+6 more)

### Community 151 - "Deployment security audit — 2026-07-19"
Cohesion: 0.33
Nodes (5): Deployment security audit — 2026-07-19, Operational requirements and residual risk, Resolved findings, Scope, Verification

### Community 152 - "pm-activity-page.tsx"
Cohesion: 0.10
Nodes (16): DeveloperProjectCard(), DeveloperProjectCardProps, ProjectFactProps, ProjectShareForm(), ProjectShareFormProps, SessionControlCard(), SessionControlCardProps, checkLabels (+8 more)

### Community 153 - "session-history.integration.test.ts"
Cohesion: 0.27
Nodes (10): SessionsController, Body, Controller, Get, HttpCode, Param, Post, Req (+2 more)

### Community 154 - "ui.ts"
Cohesion: 0.08
Nodes (23): createDeveloperProjectInputSchema, createDraftReviewRequestInputSchema, developerProjectReadinessSchema, developerProjectSessionSummarySchema, developerProjectSetupSchema, developerProjectSummaryListSchema, developerProjectSummarySchema, DeveloperSetupAgent (+15 more)

### Community 158 - "ValidationService"
Cohesion: 0.29
Nodes (5): toValidationView(), Inject, Injectable, ValidationService, ChecksResultEventEnvelope

### Community 160 - "preview-presets.ts"
Cohesion: 0.20
Nodes (11): PreviewAreaSize, PreviewFrame(), PreviewFrameProps, PreviewToolbar(), PreviewToolbarProps, getFittedPreviewScale(), getPreviewFrameStyle(), isPreviewPresetId() (+3 more)

## Knowledge Gaps
- **591 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+586 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `resolve()` connect `session-details.integration.test.ts` to `Button`, `SessionsController`, `ui.ts`, `tool-readiness.integration.test.ts`, `ConnectedAgentsRegistry`, `command-handling.integration.test.ts`, `support.js`, `test-json.ts`, `SessionsService`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `dependencies` connect `ProjectPreviewConfig` to `SessionsService`, `package.json`, `Screens represented`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `createComponentFactory()` connect `SessionsService` to `support.js`, `tool-readiness.integration.test.ts`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _591 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agent-config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13636363636363635 - nodes in this community are weakly interconnected._
- **Should `create-draft-review-request.use-case.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07051282051282051 - nodes in this community are weakly interconnected._
- **Should `events.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05708245243128964 - nodes in this community are weakly interconnected._