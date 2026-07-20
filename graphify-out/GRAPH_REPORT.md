# Graph Report - PairDock  (2026-07-20)

## Corpus Check
- 270 files · ~136,961 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2526 nodes · 5393 edges · 166 communities (145 shown, 21 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 89 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `12d4ffb1`
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
- Button
- pm-activity-page.tsx
- commands.ts
- package.json
- validation.integration.test.ts
- shared-projects.integration.test.ts
- pm-session-start.integration.test.ts
- SourceControlConnection
- auth.service.ts
- dependencies
- BT-050 — Same-email cross-role accounts remain independent
- Screens represented
- .create
- .authenticateDeveloper
- agent-command-routing.integration.test.ts
- agent-gateway.integration.test.ts
- developer-project-card.tsx
- package.json
- createRuntime
- PairDock Interactive Prototype
- auth.integration.test.ts
- persistence.boundaries.test.ts
- tsconfig.json
- package.json
- SessionPromptService
- HealthController
- Correction Workflow State
- resolve
- package.json
- HealthController
- agent-client.integration.test.ts
- tsconfig.json
- Backend ↔ agent WebSocket contract
- dotenv
- MVP E2E scenario
- Q: Trace all suggested graph questions using documentation only
- tsconfig.json
- Frontend product surfaces
- tsconfig.json
- PairDock collaborative developer/PM prototype
- .create
- ci-gates.test.ts
- main.tsx
- 01 Fixed — Nimbus Trial Button Fix Preview
- ValidationService
- reflect-metadata
- 01 Flow — PM Shared Projects Dashboard
- 01 Session 2 — Responsive Fix Session Workspace
- AGENTS.md
- walk
- createRuntime
- @nestjs/websockets
- @pairdock/domain
- migration.sql
- Body
- prisma.config.ts
- 01 Session — Blank Capture
- 02 Session 2 — Responsive Fix Session Workspace
- Containers
- deployment.test.ts
- SessionMembersRepositoryAdapter
- vite-env.d.ts
- Automated Full MVP Flow
- ReadySandboxPort
- pm-activity-page.tsx
- resolve
- DeveloperProjectSetup
- Get
- agent-client.integration.test.ts
- tool-readiness-panel.tsx
- SharedProjectSummary
- Deployment security audit — 2026-07-19
- getReact
- dotenv
- ui.ts
- @pairdock/shared-contracts
- @nestjs/common
- pm-dashboard-page.tsx
- ValidationService
- PairDock production deployment
- CreateDraftReviewRequestInput
- pm-session-page.tsx
- @nestjs/websockets
- Prototype Reference Package

## God Nodes (most connected - your core abstractions)
1. `PairDockIdentity` - 51 edges
2. `Behavior test plan — PairDock MVP` - 51 edges
3. `parseJsonResponse()` - 46 edges
4. `DatabaseClient` - 39 edges
5. `Session` - 38 edges
6. `AppModule` - 36 edges
7. `ProjectsService` - 32 edges
8. `AgentClient` - 31 edges
9. `ConnectedAgentsRegistry` - 29 edges
10. `SessionRunner` - 29 edges

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

## Communities (166 total, 21 thin omitted)

### Community 0 - "agent-config.ts"
Cohesion: 0.14
Nodes (23): agentConfigFileSchema, agentHarnessConfigSchema, AgentModelConfig, agentModelConfigSchema, AgentProjectDescriptor, agentProjectDescriptorSchema, assertHttpUrlTemplate(), assertLoopbackPortMapping() (+15 more)

### Community 1 - "create-draft-review-request.use-case.ts"
Cohesion: 0.07
Nodes (9): SandboxPort, SandboxRef, ReadySandboxPort, ReadySandboxPort, ReadySandboxPort, TimeoutSandboxPort, ReadySandboxPort, FakeSandboxPort (+1 more)

### Community 2 - "Button"
Cohesion: 0.14
Nodes (12): isExternalIdentityProvider(), isProjectMembershipRole(), mapProjectMembership(), parseExternalIdentityProvider(), parseProjectMembershipRole(), ProjectMembersRepositoryAdapter, Inject, Injectable (+4 more)

### Community 3 - "events.ts"
Cohesion: 0.06
Nodes (37): AgentCancelCommandEnvelope, agentCancelCommandEnvelopeSchema, agentCommandEnvelopeSchema, agentPromptCommandEnvelopeSchema, ChecksRunCommandEnvelope, checksRunCommandEnvelopeSchema, GitGetDiffCommandEnvelope, gitGetDiffCommandEnvelopeSchema (+29 more)

### Community 4 - "index.ts"
Cohesion: 0.10
Nodes (18): AgentCommandRouterService, Inject, Injectable, SESSIONS_REPOSITORY, CreateSessionInput, SessionsRepository, Inject, buildSessionCloseCommand() (+10 more)

### Community 5 - "index.ts"
Cohesion: 0.16
Nodes (9): requestJson(), FeedIdentity, feedRegistry, getFeed(), SessionEventFeed, useSessionEventFeed(), getBackendUrl(), FeedConnectionState (+1 more)

### Community 6 - "developer-home-page.tsx"
Cohesion: 0.11
Nodes (13): ProductShellProps, useDeveloperProjects(), normalizeSeed(), AuthenticatedUser, authenticatedUserSchema, authResponseSchema, AuthSession, authSessionSchema (+5 more)

### Community 7 - "app-shell.tsx"
Cohesion: 0.47
Nodes (3): useSharedSessionHistory(), PmActivityPage(), PmActivityPageProps

### Community 8 - "SandboxRef"
Cohesion: 0.10
Nodes (20): Architecture style, Current repository context, Dependency rules, Diagram links, External ports/adapters, Frontend styling, Local agent structure, Login interface (+12 more)

### Community 9 - "persistence.module.ts"
Cohesion: 0.13
Nodes (27): AgentGatewayModule, Module, AuthModule, Module, InvitationsModule, Module, PersistenceUnitOfWorkAdapter, Injectable (+19 more)

### Community 10 - "PairDockUser"
Cohesion: 0.11
Nodes (10): Inject, mapUser(), Inject, Injectable, UsersRepositoryAdapter, CreateUserInput, Inject, Injectable (+2 more)

### Community 11 - "client.ts"
Cohesion: 0.23
Nodes (6): InvitationsService, Inject, Injectable, SessionMembersRepository, CreatePromptRequest, SessionMember

### Community 12 - "sessions.service.ts"
Cohesion: 0.31
Nodes (4): mapSession(), SessionsRepositoryAdapter, Inject, Injectable

### Community 13 - "session.ts"
Cohesion: 0.08
Nodes (20): ApiClient, authHeaders(), createApiClient(), CreateSessionInput, jsonHeaders(), RequestOptions, responseErrorSchema, ShareDeveloperProjectInput (+12 more)

### Community 14 - "scripts"
Cohesion: 0.06
Nodes (35): @biomejs/biome, devDependencies, @biomejs/biome, tsx, @types/node, typescript, name, overrides (+27 more)

### Community 15 - "ConnectedAgentsRegistry"
Cohesion: 0.14
Nodes (14): AgentHarnessEventQueue, buildCodexSecurityArgs(), buildCommandArgs(), buildHarnessEnvironment(), CodexHarnessAdapter, isCodexCommand(), isRecord(), normalizeExitCode() (+6 more)

### Community 16 - "PairDockIdentity"
Cohesion: 0.19
Nodes (7): isRecord(), ProjectsService, resolveUnavailableReason(), Injectable, PairDockIdentity, DeveloperProjectSummary, SharedSessionHistoryItem

### Community 17 - "AuthService"
Cohesion: 0.25
Nodes (15): assertStateCookie(), AuthCallbackBody, AuthController, clearStateCookie(), HeaderResponse, readCookie(), readStateFromRedirectUrl(), secureCookieSuffix() (+7 more)

### Community 18 - "ProjectPreviewConfig"
Cohesion: 0.20
Nodes (11): PreviewAreaSize, PreviewFrame(), PreviewFrameProps, PreviewToolbar(), PreviewToolbarProps, getFittedPreviewScale(), getPreviewFrameStyle(), isPreviewPresetId() (+3 more)

### Community 19 - "support.js"
Cohesion: 0.11
Nodes (15): boot(), compileTemplate(), dcNameFromPath(), encodeCase(), getReactDOM(), init(), isElementClass(), isRenderableType() (+7 more)

### Community 20 - "json-parsers.ts"
Cohesion: 0.08
Nodes (11): AgentHarnessEvent, AgentHarnessPort, RunPromptInput, SimulatedAgentHarness, CancellableHarnessPort, createTempRepository(), execFileAsync, execGit() (+3 more)

### Community 21 - "pm-session-page.tsx"
Cohesion: 0.26
Nodes (7): mapMessage(), MessagesRepositoryAdapter, Inject, Injectable, CreateMessageInput, MessagesRepository, SessionMessage

### Community 22 - "includes"
Cohesion: 0.08
Nodes (24): files, includes, formatter, enabled, indentStyle, lineWidth, quoteStyle, semicolons (+16 more)

### Community 23 - "package.json"
Cohesion: 0.08
Nodes (24): bin, pairdock-agent, dependencies, @pairdock/shared-contracts, socket.io-client, yaml, zod, devDependencies (+16 more)

### Community 24 - "readiness-runner.ts"
Cohesion: 0.22
Nodes (12): CommandResult, CommandRunner, failed(), failureMessage(), isCodexExecutable(), passed(), ReadinessResult, ReadinessRunner (+4 more)

### Community 25 - "agent-client.ts"
Cohesion: 0.15
Nodes (24): isRetryableError(), AgentEventEnvelopeInput, buildAgentConnectedEvent(), buildAgentDoneEvent(), buildAgentOutputEvent(), buildChecksResultEvent(), buildEnvelope(), buildErrorEvent() (+16 more)

### Community 26 - "github-source-control.adapter.ts"
Cohesion: 0.10
Nodes (17): base64UrlEncode(), createGithubAppJwt(), deterministicReviewRequestNumber(), Fetcher, GithubBranchResponse, githubHeaders(), GithubInstallationRepositoriesResponse, GithubInstallationTokenResponse (+9 more)

### Community 27 - "package.json"
Cohesion: 0.08
Nodes (23): devDependencies, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, vite, @vitejs/plugin-react, name (+15 more)

### Community 28 - "mvp-flow.e2e.test.ts"
Cohesion: 0.13
Nodes (16): authenticateDeveloper(), authenticatePm(), closeSession(), createDeveloperProject(), createReviewRequest(), createSession(), createTestRepository(), EXAMPLE_REPOSITORY_FIXTURE (+8 more)

### Community 29 - "AuthTokenService"
Cohesion: 0.19
Nodes (10): AuthTokenOptions, AuthTokenService, hasValidSignature(), isRecord(), isUserKind(), parseTokenPayload(), resolveSecret(), TokenPayload (+2 more)

### Community 30 - "github-developer-identity.adapter.ts"
Cohesion: 0.18
Nodes (10): ExternalIdentitiesRepositoryAdapter, Inject, Injectable, parseJsonObject(), serializeJsonObject(), mapExternalIdentity(), CreateExternalIdentityInput, ExternalIdentitiesRepository (+2 more)

### Community 31 - "agent-events.repository.ts"
Cohesion: 0.16
Nodes (7): CheckCommandExecutor, CheckResult, ChecksResult, ChecksRunner, isTransientPackageExtractionFailure(), RunChecksInput, RecordingChecksRunner

### Community 32 - "external-identities.repository.ts"
Cohesion: 0.13
Nodes (14): Fetcher, GithubDeveloperIdentityAdapter, GithubDeveloperIdentityConfig, GithubEmailResponse, githubHeaders(), GithubInstallationMetadata, GithubInstallationsResponse, GithubOAuthResponse (+6 more)

### Community 33 - "slack-pm-identity.adapter.ts"
Cohesion: 0.13
Nodes (17): CommandResult, containerImageSchema, enrichConfigWithProjectManifests(), healthcheckUrlTemplateSchema, isLoopbackPortMappingTemplate(), isValidPort(), loadProjectManifest(), loopbackPortMappingSchema (+9 more)

### Community 34 - "WorktreeService"
Cohesion: 0.21
Nodes (7): branchExists(), execFileAsync, execGit(), pathExists(), remoteExists(), WorktreeService, BlockingPushWorktreeService

### Community 35 - "sessions.controller.ts"
Cohesion: 0.33
Nodes (13): "agent_events", "agent_registrations", "external_identities", "github_installations", "messages", "project_members", "project_readiness_snapshots", "projects" (+5 more)

### Community 36 - "DatabaseExecutor"
Cohesion: 0.21
Nodes (11): AgentRegistrationsRepositoryAdapter, isRecord(), mapAgentRegistration(), parseModels(), parseProjects(), parseStringArray(), Inject, Injectable (+3 more)

### Community 37 - "ReviewRequestsRepository"
Cohesion: 0.16
Nodes (12): PreparedWorktree, DEFAULT_SESSION_STATE_PATH, FileSessionWorkspaceStore, isMissingFileError(), metadataSchema, stateSchema, toPersistedWorkspace(), workspaceSchema (+4 more)

### Community 38 - "SessionsController"
Cohesion: 0.25
Nodes (14): loadAgentConfig(), resolveAgentConfigPath(), saveAgentConfig(), summarizeAgentConfig(), main(), parseModelMapping(), parseModelMappings(), parseProjectMapping() (+6 more)

### Community 39 - "ToolReadinessService"
Cohesion: 0.12
Nodes (15): VALIDATION_RUNS_REPOSITORY, UpsertProjectReadinessInput, CreateValidationRunInput, ValidationRunsRepository, Injectable, ValidationPolicy, SessionValidationView, SessionStatus (+7 more)

### Community 40 - "Implementation handoff — PairDock MVP"
Cohesion: 0.11
Nodes (18): Implementation handoff — PairDock MVP, T01 — Monorepo and shared contracts, T02 — Prisma persistence foundation, T03 — Auth and session permissions, T04 — Backend session lifecycle, T05 — Backend ↔ agent WebSocket, T06 — Local agent: config, login, connection, T07 — Local agent: worktree and cleanup (+10 more)

### Community 41 - "docker-sandbox.adapter.ts"
Cohesion: 0.07
Nodes (30): appendLogs(), assertSafeContainerImage(), buildContainerHardeningArgs(), buildDockerCheckArgs(), buildDockerRunArgs(), DockerSandboxAdapter, DockerSandboxAdapterDependencies, inferPortsFromHealthcheck() (+22 more)

### Community 42 - "session-runner.ts"
Cohesion: 0.15
Nodes (12): assertInstallationId(), GithubAuthStateOptions, GithubAuthStatePayload, GithubAuthStatePurpose, GithubAuthStateService, hasValidSignature(), invalidState(), isInstallationId() (+4 more)

### Community 43 - "ui.ts"
Cohesion: 0.27
Nodes (4): AuthenticatedUserGuard, Inject, Injectable, RequireAuth()

### Community 44 - "tool-readiness.integration.test.ts"
Cohesion: 0.19
Nodes (8): ConnectedSocket, Inject, Injectable, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, UiGateway

### Community 45 - "tool-readiness-panel.tsx"
Cohesion: 0.11
Nodes (15): AGENT_AUTHENTICATION_OPTIONS, AgentAuthenticationOptions, AgentAuthenticationService, AgentCredentialInput, AuthenticatedAgentPrincipal, extractBearerToken(), isRecord(), parseCredentials() (+7 more)

### Community 46 - "session-details.integration.test.ts"
Cohesion: 0.12
Nodes (14): mapSessionMember(), SessionMembersRepositoryAdapter, Inject, Injectable, AddSessionMemberInput, agentEvents, externalIdentities, prisma (+6 more)

### Community 48 - "command-handling.integration.test.ts"
Cohesion: 0.08
Nodes (13): HealthcheckService, HealthcheckTimeoutError, HealthcheckWaitInput, HealthcheckResult, SandboxCommandResult, SandboxStartInput, createTempRepository(), execFileAsync (+5 more)

### Community 49 - "codex-model-catalog.ts"
Cohesion: 0.19
Nodes (12): applyCodexCommandToProjects(), CodexCatalogOptions, CodexInstallation, codexModelCacheSchema, codexModelSchema, codexReasoningLevelSchema, compareVersions(), enrichConfigWithCodexModels() (+4 more)

### Community 50 - "DatabaseClient"
Cohesion: 0.10
Nodes (33): AgentExecutionCapabilitiesService, SessionExecutionSelection, Injectable, EXTERNAL_IDENTITIES_REPOSITORY, MESSAGES_REPOSITORY, PROJECT_MEMBERS_REPOSITORY, PROJECT_READINESS_REPOSITORY, PROJECTS_REPOSITORY (+25 more)

### Community 51 - "example-project.integration.test.ts"
Cohesion: 0.20
Nodes (5): createTempRepository(), execFileAsync, execGit(), HARNESS_SCRIPT_PATH, ReadyPreviewTunnelPort

### Community 53 - "test-json.ts"
Cohesion: 0.13
Nodes (12): authenticatePm(), prisma, authenticatePm(), prisma, startApplication(), authenticatePm(), prisma, authResponseSchema (+4 more)

### Community 54 - "SessionsService"
Cohesion: 0.19
Nodes (5): resolveDeveloperReadinessFailure(), buildSessionPrepareCommand(), formatUserDisplayName(), SessionsService, Injectable

### Community 55 - "AuthenticatedRequest"
Cohesion: 0.16
Nodes (11): DiffService, isSessionDiffPayload(), SessionDiffView, AgentEventsRepositoryAdapter, Inject, Injectable, serializeJsonValue(), mapAgentEvent() (+3 more)

### Community 56 - "SessionsService"
Cohesion: 0.25
Nodes (11): AuthenticatedRequest, ProjectsController, Body, Controller, Get, Inject, Param, Post (+3 more)

### Community 57 - "PRD — PairDock MVP"
Cohesion: 0.12
Nodes (15): Actors, Assumptions, Fixed constraints, Functional requirements, Goals, Handoff summary, Non-functional requirements, Non-goals for MVP (+7 more)

### Community 58 - "slack-pm-identity.adapter.ts"
Cohesion: 0.14
Nodes (11): Fetcher, parseFixtureIdentity(), SlackAuthTestResponse, slackHeaders(), SlackOAuthResponse, SlackPmIdentityAdapter, SlackPmIdentityConfig, SlackUserInfoResponse (+3 more)

### Community 59 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @nestjs/common, @nestjs/core, @nestjs/platform-express, @prisma/adapter-pg, @prisma/client, rxjs, socket.io (+7 more)

### Community 60 - "Backend NestJS modules"
Cohesion: 0.12
Nodes (17): AgentGatewayModule, AuditLogModule, AuthModule, Backend NestJS modules, DiffModule, GithubModule, InvitationsModule, PersistenceModule (+9 more)

### Community 61 - "include"
Cohesion: 0.13
Nodes (14): compilerOptions, jsx, lib, extends, include, src/**/*.ts, ../../tsconfig.base.json, DOM (+6 more)

### Community 62 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, db:migrate, db:migrate:dev, db:migrate:test, db:reset, db:status, dev (+7 more)

### Community 63 - "AgentAuthenticationService"
Cohesion: 0.17
Nodes (9): ChangedFile, CollectedDiff, DiffService, execFileAsync, execGit(), execGitAllowingDiffExitCode(), isGitDiffExitCode(), normalizeStatusPath() (+1 more)

### Community 64 - "source-control-connections.repository.ts"
Cohesion: 0.16
Nodes (8): AppModule, Module, bootstrap(), startApplication(), prisma, startApplication(), waitFor(), startApplication()

### Community 65 - "use-app-route.ts"
Cohesion: 0.14
Nodes (21): AppShell(), getAppRouteSnapshot(), loginRoute, openDeveloperHome(), openLogin(), openPmDashboard(), openPmReviewRequests(), openPmSession() (+13 more)

### Community 66 - "compilerOptions"
Cohesion: 0.14
Nodes (13): node, compilerOptions, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, noEmit (+5 more)

### Community 67 - "session-access.guard.ts"
Cohesion: 0.22
Nodes (6): RequireSessionAccess(), SessionAccessGuard, Inject, Injectable, CreatePromptBody, createDraftReviewRequestInputSchema

### Community 68 - "json-parsers.ts"
Cohesion: 0.15
Nodes (14): isToolReadinessKey(), isToolReadinessStatus(), parseToolReadinessCheck(), parseToolReadinessChecks(), serializeChecks(), serializeToolReadinessCheck(), toInputJsonObject(), toInputJsonValue() (+6 more)

### Community 69 - "Product"
Cohesion: 0.22
Nodes (8): Accessibility & Inclusion, Anti-references, Brand Personality, Design Principles, Product, Product Purpose, Register, Users

### Community 70 - "dependencies"
Cohesion: 0.17
Nodes (6): authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication(), sessionPromptResponseSchema

### Community 71 - "developer-project-form.tsx"
Cohesion: 0.18
Nodes (8): errorMessage(), SessionCloseResult, SessionPrepareHooks, SessionRecoveryResult, SessionRunner, GitPushBranchCommandEnvelope, SessionCloseCommandEnvelope, SessionPrepareCommandEnvelope

### Community 72 - "V1 developer setup"
Cohesion: 0.15
Nodes (12): 1. GitHub App, 2. Slack App, 3. Start PairDock, 4. Cloudflare Tunnel, 5. Add `pairdock.yml`, 6. Configure the local agent, 7. Create a PairDock project, Commands (+4 more)

### Community 73 - "ui-gateway.browser-auth.integration.test.ts"
Cohesion: 0.15
Nodes (6): sessionIdResponseSchema, authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication()

### Community 74 - "DatabaseExecutor"
Cohesion: 0.13
Nodes (12): mapValidationRun(), Inject, createPersistenceRepositories(), Inject, Inject, Injectable, ValidationRunsRepositoryAdapter, buildAdapter() (+4 more)

### Community 75 - "Button"
Cohesion: 0.18
Nodes (8): authApi, DeveloperLoginCard(), PmLoginCard(), BrandIconProps, GitHubIcon(), SlackIcon(), Button(), PromptComposerProps

### Community 76 - "pm-activity-page.tsx"
Cohesion: 0.15
Nodes (14): ButtonProps, ButtonVariant, variantClasses, ConversationThread(), ConversationThreadProps, SectionCard(), SectionCardProps, SelectInput() (+6 more)

### Community 77 - "commands.ts"
Cohesion: 0.18
Nodes (6): ConnectedSocket, MessageBody, SubscribeMessage, AgentEventEnvelope, ChecksResultEventEnvelope, ErrorEventEnvelope

### Community 78 - "package.json"
Cohesion: 0.17
Nodes (11): dependencies, zod, exports, zod, name, private, scripts, build (+3 more)

### Community 79 - "validation.integration.test.ts"
Cohesion: 0.11
Nodes (9): authenticateDeveloper(), createSession(), prisma, startApplication(), authenticateDeveloper(), prisma, startApplication(), idResponseSchema (+1 more)

### Community 80 - "shared-projects.integration.test.ts"
Cohesion: 0.21
Nodes (8): announceAgent(), authenticatePm(), prisma, publishReadiness(), sendAgentEvent(), startApplication(), waitForConnect(), sharedProjectListResponseSchema

### Community 81 - "pm-session-start.integration.test.ts"
Cohesion: 0.21
Nodes (8): announceAgent(), authenticatePm(), prisma, publishReadiness(), sendAgentEvent(), startApplication(), waitForConnect(), sessionCreateResponseSchema

### Community 82 - "SourceControlConnection"
Cohesion: 0.22
Nodes (6): mapSourceControlConnection(), SourceControlConnectionsRepositoryAdapter, Inject, Injectable, CreateSourceControlConnectionInput, SourceControlConnection

### Community 83 - "auth.service.ts"
Cohesion: 0.18
Nodes (9): AgentProjectOption, DeveloperProjectForm(), ProjectFormState, ProjectSetupStateProps, resolveModelOptions(), ExecutionSelection, ExecutionSelectionProps, DeveloperSetupAgentModel (+1 more)

### Community 84 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, @pairdock/shared-contracts, react-dom, socket.io-client, @tanstack/react-form, @tanstack/react-query, zod, @pairdock/shared-contracts (+5 more)

### Community 85 - "BT-050 — Same-email cross-role accounts remain independent"
Cohesion: 0.04
Nodes (51): Behavior test plan — PairDock MVP, BT-001 — Installable workspace, BT-002 — Session creation is persisted, BT-003 — Agent event is persisted, BT-004 — PM member access is allowed, BT-005 — Non-member access is denied, BT-006 — Valid session transitions, BT-007 — Invalid transition is rejected (+43 more)

### Community 86 - "Screens represented"
Cohesion: 0.18
Nodes (10): Architecture documents reconciled, Developer dashboard, Implementation guidance, Login, PM shared-project dashboard, Prototype notes — PairDock collaborative developer/PM, Purpose, Running/fixed/review states (+2 more)

### Community 88 - ".authenticateDeveloper"
Cohesion: 0.43
Nodes (4): Body, HttpCode, Post, AuthResult

### Community 89 - "agent-command-routing.integration.test.ts"
Cohesion: 0.09
Nodes (9): PreviewTunnelPort, ReadyPreviewTunnelPort, createTempRepository(), execFileAsync, execGit(), prisma, ReadyPreviewTunnelPort, startApplication() (+1 more)

### Community 90 - "agent-gateway.integration.test.ts"
Cohesion: 0.17
Nodes (5): authenticateDeveloper(), authenticatePm(), createSession(), prisma, startApplication()

### Community 91 - "developer-project-card.tsx"
Cohesion: 0.17
Nodes (8): DeveloperProjectCard(), DeveloperProjectCardProps, ProjectFactProps, ProjectShareForm(), ProjectShareFormProps, ExecutionSelectionControls(), blockedProject, project

### Community 92 - "package.json"
Cohesion: 0.20
Nodes (9): devDependencies, prisma, socket.io-client, socket.io-client, name, private, type, version (+1 more)

### Community 94 - "createRuntime"
Cohesion: 0.15
Nodes (8): isInsideSensitiveDirectory(), normalizeRelativePath(), SensitiveFilesPolicy, createTempRepository(), execFileAsync, execGit(), FailingClosePreviewTunnelPort, FakePreviewTunnelPort

### Community 95 - "PairDock Interactive Prototype"
Cohesion: 0.18
Nodes (8): ConnectionActivityRail(), ConnectionActivityRailProps, RailMetricProps, SessionControlCard(), SessionControlCardProps, SharedProjectCardProps, StatusBadge(), DeveloperProjectSessionSummary

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

### Community 100 - "SessionPromptService"
Cohesion: 0.24
Nodes (5): buildAgentCancelCommand(), buildAgentPromptCommand(), SessionPromptService, Injectable, Inject

### Community 101 - "HealthController"
Cohesion: 0.33
Nodes (4): createFakeGithubServer(), githubInstallations, json(), previousEnv

### Community 102 - "Correction Workflow State"
Cohesion: 0.25
Nodes (8): Clean Correction Prompt State, Developer Correction Request State, Correction Workflow State, Session Workspace State, Follow-up Workflow State, Follow-up Session Workspace State, Demo Navigation State, Session Correction Request State

### Community 103 - "resolve"
Cohesion: 0.13
Nodes (10): Inject, AuthProvider, AuthService, buildFrontendAuthRedirectUrl(), hasAccessibleGithubInstallation(), OAuthStartUrlConfig, readOAuthStartUrlConfig(), Injectable (+2 more)

### Community 104 - "package.json"
Cohesion: 0.25
Nodes (7): name, private, scripts, build, lint, test, type

### Community 105 - "HealthController"
Cohesion: 0.16
Nodes (7): mapReviewRequest(), ReviewRequestsRepositoryAdapter, Inject, Injectable, CreateReviewRequestInput, ReviewRequestRecord, InMemoryReviewRequestsRepository

### Community 106 - "agent-client.integration.test.ts"
Cohesion: 0.32
Nodes (12): normalizeAgentConfig(), normalizeAgentHarnessConfig(), normalizeAgentHarnessConfigs(), normalizeBackendUrl(), normalizeCapabilities(), normalizeChecksConfigs(), normalizeModels(), normalizeOptionalValue() (+4 more)

### Community 107 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): extends, include, src/**/*.ts, ../../tsconfig.base.json, ../../tests/packages/local-agent/**/*.ts

### Community 108 - "Backend ↔ agent WebSocket contract"
Cohesion: 0.40
Nodes (5): Agent → backend events, Backend → agent commands, Backend ↔ agent WebSocket contract, Common envelope, UI session-start contract

### Community 109 - "dotenv"
Cohesion: 0.36
Nodes (8): ProjectChecksConfig, AgentConfig, SaveAgentConfigInput, ProjectPreviewConfig, ProjectAgentHarnessConfig, ReadinessRunnerConfig, SessionRunnerConfig, PreviewTunnelOpenInput

### Community 110 - "MVP E2E scenario"
Cohesion: 0.40
Nodes (4): Fixtures, MVP E2E scenario, Reproduce locally, What it proves

### Community 111 - "Q: Trace all suggested graph questions using documentation only"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Trace all suggested graph questions using documentation only, Source Nodes

### Community 112 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 113 - "Frontend product surfaces"
Cohesion: 0.40
Nodes (5): Developer dashboard, Frontend product surfaces, Login, PM dashboard, Session workspace

### Community 114 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 115 - "PairDock collaborative developer/PM prototype"
Cohesion: 0.40
Nodes (4): Architectural interpretation, Contents, How to view, PairDock collaborative developer/PM prototype

### Community 116 - ".create"
Cohesion: 0.19
Nodes (9): SESSION_MEMBERS_REPOSITORY, SOURCE_CONTROL_CONNECTIONS_REPOSITORY, buildConventionalCommitMessage(), buildGitPushBranchCommand(), buildSessionBranchName(), CreateDraftReviewRequestUseCase, DraftReviewRequestResult, Injectable (+1 more)

### Community 117 - "ci-gates.test.ts"
Cohesion: 0.40
Nodes (3): repositoryRoot, rootPackageJson, workflowPath

### Community 119 - "01 Fixed — Nimbus Trial Button Fix Preview"
Cohesion: 0.50
Nodes (4): 01 Clean — Blank Nimbus Landing Preview, 01 Fixed — Nimbus Trial Button Fix Preview, 02 Clean — Blank Nimbus Landing Preview, 02 Fixed — Nimbus Trial Button Fix Preview

### Community 120 - "ValidationService"
Cohesion: 0.23
Nodes (10): SessionsController, Body, Controller, Get, HttpCode, Param, Post, Req (+2 more)

### Community 122 - "01 Flow — PM Shared Projects Dashboard"
Cohesion: 0.67
Nodes (3): 01 Dev — Developer Shared Projects Dashboard, 01 Flow — PM Shared Projects Dashboard, 02 Flow — PM Shared Projects Dashboard

### Community 123 - "01 Session 2 — Responsive Fix Session Workspace"
Cohesion: 0.67
Nodes (3): 01 Session 2 — Responsive Fix Session Workspace, 01 Session 3 — Responsive Fix Session Workspace, 02 Dev — Responsive Fix Session Workspace

### Community 125 - "walk"
Cohesion: 0.40
Nodes (11): collectProps(), compileAttr(), cssToObj(), hostPositionStyle(), kebabToCamel(), walk(), walkChildren(), walkComponent() (+3 more)

### Community 126 - "createRuntime"
Cohesion: 0.20
Nodes (10): react, get(), createComponentFactory(), createExternalModules(), createHelmetManager(), createPseudoSheet(), createRegistry(), createRuntime() (+2 more)

### Community 130 - "Body"
Cohesion: 0.33
Nodes (9): asRecord(), buildSessionConversation(), extractErrorMessage(), humanizeAgentError(), mergeAdjacentAgentOutput(), toConversationEvent(), checksResultPayloadSchema, extractUsefulLogLine() (+1 more)

### Community 131 - "prisma.config.ts"
Cohesion: 0.31
Nodes (6): currentDirectory, databaseTargetEnvironment, DatabaseEnvironment, DatabaseTarget, parseDatabaseTarget(), resolveDatabaseConnectionString()

### Community 139 - "SessionMembersRepositoryAdapter"
Cohesion: 0.11
Nodes (11): authenticateDeveloper(), authenticatePm(), prisma, startApplication(), developerProjectListResponseSchema, developerProjectResponseSchema, authenticateDeveloper(), authenticatePm() (+3 more)

### Community 143 - "ReadySandboxPort"
Cohesion: 0.16
Nodes (12): ToolReadinessController, Controller, Get, HttpCode, Inject, Param, Post, Req (+4 more)

### Community 144 - "pm-activity-page.tsx"
Cohesion: 0.47
Nodes (3): HealthController, Controller, Get

### Community 145 - "resolve"
Cohesion: 0.25
Nodes (8): findTopLevelEquality(), parensWrapWhole(), resolve(), resolvePath(), waitFor(), waitForReadiness(), waitForReadiness(), emitCommandWithAcknowledgement()

### Community 146 - "DeveloperProjectSetup"
Cohesion: 0.31
Nodes (3): DeveloperProjectFormProps, CreateDeveloperProjectInput, DeveloperProjectSetup

### Community 147 - "Get"
Cohesion: 0.18
Nodes (8): mapProject(), ProjectsRepositoryAdapter, Injectable, CreateProjectInput, DeveloperProjectRecord, ProjectsRepository, SharedProjectRecord, Project

### Community 149 - "tool-readiness-panel.tsx"
Cohesion: 0.38
Nodes (6): checkLabels, statusTone(), ToolReadinessPanel(), ToolReadinessPanelProps, ToolReadinessRow(), DeveloperProjectReadiness

### Community 150 - "SharedProjectSummary"
Cohesion: 0.60
Nodes (4): SessionStarted, StartPmSessionInput, UseSharedProjectsResult, SharedProjectSummary

### Community 151 - "Deployment security audit — 2026-07-19"
Cohesion: 0.33
Nodes (5): Deployment security audit — 2026-07-19, Operational requirements and residual risk, Resolved findings, Scope, Verification

### Community 152 - "getReact"
Cohesion: 0.50
Nodes (5): evalDcLogic(), getReact(), walkFor(), walkText(), warnUnresolved()

### Community 154 - "ui.ts"
Cohesion: 0.10
Nodes (20): developerProjectReadinessSchema, developerProjectSessionSummarySchema, developerProjectSetupSchema, developerProjectSummaryListSchema, developerProjectSummarySchema, DeveloperSetupAgent, developerSetupAgentModelSchema, DeveloperSetupAgentProject (+12 more)

### Community 157 - "pm-dashboard-page.tsx"
Cohesion: 0.25
Nodes (7): SharedProjectCard(), ProductShell(), useSharedProjects(), PmDashboardPage(), PmDashboardPageProps, blockedProject, readyProject

### Community 158 - "ValidationService"
Cohesion: 0.06
Nodes (27): Inject, AgentGateway, isCommandAcknowledgement(), isLifecycleProgressStatus(), toSessionAgentEvent(), Inject, Injectable, WebSocketGateway (+19 more)

### Community 159 - "PairDock production deployment"
Cohesion: 0.25
Nodes (7): Deploy, update, or roll back, Deployment environment, Local developer agent and previews, One-time server setup, PairDock production deployment, Release images, Security before exposing PairDock

### Community 160 - "CreateDraftReviewRequestInput"
Cohesion: 0.50
Nodes (3): ReviewRequestDialog(), ReviewRequestDialogProps, CreateDraftReviewRequestInput

### Community 161 - "pm-session-page.tsx"
Cohesion: 0.67
Nodes (3): formatSessionStatus(), PmSessionPage(), PmSessionPageProps

## Knowledge Gaps
- **579 isolated node(s):** `Workspace`, `Commands`, `1. GitHub App`, `2. Slack App`, `3. Start PairDock` (+574 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `resolve()` connect `resolve` to `source-control-connections.repository.ts`, `SessionsController`, `command-handling.integration.test.ts`, `support.js`, `json-parsers.ts`, `getReact`, `walk`, `createRuntime`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`, `createRuntime`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `PairDockIdentity` connect `PairDockIdentity` to `index.ts`, `resolve`, `ToolReadinessService`, `ui.ts`, `client.ts`, `ReadySandboxPort`, `DatabaseClient`, `DeveloperProjectSetup`, `.create`, `SessionsService`, `.authenticateDeveloper`, `SessionsService`, `AuthTokenService`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `Workspace`, `Commands`, `1. GitHub App` to the rest of the system?**
  _579 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agent-config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13768115942028986 - nodes in this community are weakly interconnected._
- **Should `create-draft-review-request.use-case.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07152496626180836 - nodes in this community are weakly interconnected._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.1380952380952381 - nodes in this community are weakly interconnected._