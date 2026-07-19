import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { PairDockIdentity, PairDockUser, ProjectReadinessSnapshot, Session } from '@pairdock/domain';
import {
  type CreateDeveloperProjectInput,
  createDeveloperProjectInputSchema,
  type DeveloperProjectSetup,
  type DeveloperProjectSummary,
  type SharedProjectSummary,
  type SharedSessionHistoryItem,
  shareDeveloperProjectInputSchema,
  updateProjectExecutionDefaultsInputSchema,
} from '@pairdock/shared-contracts';
import { AgentExecutionCapabilitiesService } from '../agent-gateway/agent-execution-capabilities.service.js';
import { ConnectedAgentsRegistry } from '../agent-gateway/connected-agents.registry.js';
import {
  EXTERNAL_IDENTITIES_REPOSITORY,
  PROJECT_MEMBERS_REPOSITORY,
  PROJECT_READINESS_REPOSITORY,
  PROJECTS_REPOSITORY,
  REVIEW_REQUESTS_REPOSITORY,
  SESSIONS_REPOSITORY,
  SOURCE_CONTROL_CONNECTIONS_REPOSITORY,
  USERS_REPOSITORY,
} from '../persistence/persistence.tokens.js';
import type { ExternalIdentitiesRepository } from '../persistence/ports/external-identities.repository.js';
import type { ProjectMembersRepository } from '../persistence/ports/project-members.repository.js';
import type { ProjectReadinessRepository } from '../persistence/ports/project-readiness.repository.js';
import type { DeveloperProjectRecord, ProjectsRepository } from '../persistence/ports/projects.repository.js';
import type { ReviewRequestsRepository } from '../persistence/ports/review-requests.repository.js';
import type { SessionsRepository } from '../persistence/ports/sessions.repository.js';
import type { SourceControlConnectionsRepository } from '../persistence/ports/source-control-connections.repository.js';
import type { UsersRepository } from '../persistence/ports/users.repository.js';
import type { SourceControlPort } from '../source-control/source-control.port.js';
import { SOURCE_CONTROL_PORT } from '../source-control/source-control.tokens.js';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(PROJECTS_REPOSITORY)
    private readonly projectsRepository: ProjectsRepository,
    @Inject(EXTERNAL_IDENTITIES_REPOSITORY)
    private readonly externalIdentitiesRepository: ExternalIdentitiesRepository,
    @Inject(PROJECT_READINESS_REPOSITORY)
    private readonly projectReadinessRepository: ProjectReadinessRepository,
    @Inject(PROJECT_MEMBERS_REPOSITORY)
    private readonly projectMembersRepository: ProjectMembersRepository,
    @Inject(SOURCE_CONTROL_CONNECTIONS_REPOSITORY)
    private readonly sourceControlConnectionsRepository: SourceControlConnectionsRepository,
    @Inject(REVIEW_REQUESTS_REPOSITORY)
    private readonly reviewRequestsRepository: ReviewRequestsRepository,
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessionsRepository: SessionsRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
    @Inject(ConnectedAgentsRegistry)
    private readonly connectedAgentsRegistry: ConnectedAgentsRegistry,
    @Inject(AgentExecutionCapabilitiesService)
    private readonly agentExecutionCapabilities: AgentExecutionCapabilitiesService,
    @Inject(SOURCE_CONTROL_PORT)
    private readonly sourceControl: SourceControlPort,
  ) {}

  listSharedProjectsResponse(user: PairDockIdentity | undefined): Promise<SharedProjectSummary[]> {
    return this.listSharedProjects(this.requireUser(user));
  }

  listSharedSessionHistoryResponse(user: PairDockIdentity | undefined): Promise<SharedSessionHistoryItem[]> {
    return this.listSharedSessionHistory(this.requireUser(user));
  }

  async listDeveloperProjectsResponse(user: PairDockIdentity | undefined): Promise<DeveloperProjectSummary[]> {
    return this.listDeveloperProjects(this.requireDeveloper(user));
  }

  async getDeveloperProjectSetupResponse(user: PairDockIdentity | undefined): Promise<DeveloperProjectSetup> {
    return this.getDeveloperProjectSetup(this.requireDeveloper(user));
  }

  async createDeveloperProjectResponse(
    body: unknown,
    user: PairDockIdentity | undefined,
  ): Promise<DeveloperProjectSummary> {
    const input = this.parseCreateProjectInput(body);
    return this.createDeveloperProject(input, this.requireDeveloper(user));
  }

  async shareDeveloperProjectResponse(
    projectId: string,
    body: unknown,
    user: PairDockIdentity | undefined,
  ): Promise<DeveloperProjectSummary> {
    const input = shareDeveloperProjectInputSchema.safeParse(body);

    if (!input.success) {
      throw new BadRequestException('PM email is required.');
    }

    return this.shareDeveloperProject(projectId, input.data.pmEmail.toLowerCase(), this.requireDeveloper(user));
  }

  async updateExecutionDefaultsResponse(projectId: string, body: unknown, user: PairDockIdentity | undefined) {
    const input = updateProjectExecutionDefaultsInputSchema.safeParse(body);

    if (!input.success) {
      throw new BadRequestException('Model and reasoning effort are required.');
    }

    return this.updateExecutionDefaults(projectId, input.data, this.requireDeveloper(user));
  }

  async listSharedProjects(user: PairDockIdentity): Promise<SharedProjectSummary[]> {
    if (user.kind !== 'pm') {
      throw new ForbiddenException('Only PM users can access the shared-project dashboard.');
    }

    const sharedProjects = await this.projectsRepository.listSharedByUserId(user.id);
    const readinessByProjectId = new Map(
      (await this.projectReadinessRepository.findManyByProjectIds(sharedProjects.map(({ project }) => project.id))).map(
        (snapshot) => [snapshot.projectId, snapshot],
      ),
    );

    return sharedProjects.map(({ project, ownerDisplayName }) => {
      const agentAvailability = this.connectedAgentsRegistry.findSocketId(project.agentProjectKey)
        ? 'online'
        : 'offline';
      const readinessSnapshot = readinessByProjectId.get(project.id);
      const readinessOk = readinessSnapshot?.ok ?? false;
      const canStartSession = project.pmCanStartSessions && agentAvailability === 'online' && readinessOk;

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        ownerDisplayName,
        repoFullName: project.repoFullName,
        defaultBranch: project.defaultBranch,
        agentAvailability,
        canStartSession,
        unavailableReason: canStartSession
          ? undefined
          : resolveUnavailableReason({
              pmCanStartSessions: project.pmCanStartSessions,
              agentAvailability,
              readinessOk,
            }),
      } satisfies SharedProjectSummary;
    });
  }

  async listSharedSessionHistory(user: PairDockIdentity): Promise<SharedSessionHistoryItem[]> {
    if (user.kind !== 'pm') {
      throw new ForbiddenException('Only PM users can access shared session history.');
    }

    const sharedProjectRecords = await this.projectsRepository.listSharedByUserId(user.id);
    const projectsById = new Map(sharedProjectRecords.map(({ project }) => [project.id, project]));
    const sessions = await this.sessionsRepository.listByProjectIds([...projectsById.keys()]);
    const reviewRequests = await this.reviewRequestsRepository.findManyBySessionIds(
      sessions.map((session) => session.id),
    );
    const reviewRequestBySessionId = new Map(
      reviewRequests.map((reviewRequest) => [reviewRequest.sessionId, reviewRequest]),
    );

    return sessions.flatMap((session) => {
      const project = projectsById.get(session.projectId);

      if (!project) {
        return [];
      }

      const reviewRequest = reviewRequestBySessionId.get(session.id);
      return [
        {
          id: session.id,
          projectId: project.id,
          projectName: project.name,
          repoFullName: project.repoFullName,
          status: session.status,
          reviewRequest: reviewRequest
            ? {
                url: reviewRequest.reviewRequestUrl,
                number: reviewRequest.reviewRequestNumber,
                status: reviewRequest.status,
              }
            : null,
          createdAt: session.createdAt.toISOString(),
          closedAt: session.closedAt?.toISOString() ?? null,
        },
      ];
    });
  }

  async listDeveloperProjects(user: PairDockIdentity): Promise<DeveloperProjectSummary[]> {
    const projectRecords = await this.projectsRepository.listOwnedByUserId(user.id);
    const readinessByProjectId = new Map(
      (await this.projectReadinessRepository.findManyByProjectIds(projectRecords.map(({ project }) => project.id))).map(
        (snapshot) => [snapshot.projectId, snapshot],
      ),
    );
    const sessionsByProjectId = await this.listSessionsByProjectId(projectRecords.map(({ project }) => project.id));
    const reviewRequestUrlsBySessionId = await this.listReviewRequestUrlsBySessionId(
      [...sessionsByProjectId.values()].flat().map((session) => session.id),
    );

    return projectRecords.map((record) =>
      this.buildDeveloperProjectSummary(
        record,
        sessionsByProjectId.get(record.project.id) ?? [],
        reviewRequestUrlsBySessionId,
        readinessByProjectId.get(record.project.id) ?? null,
      ),
    );
  }

  async createDeveloperProject(
    input: CreateDeveloperProjectInput,
    user: PairDockIdentity,
  ): Promise<DeveloperProjectSummary> {
    const sourceControlInput = await this.resolveSourceControlInput(user, input.repoFullName);
    await this.validateCreateProjectSelection(input, user, sourceControlInput.providerConnectionId);
    const sourceControlConnection =
      (await this.sourceControlConnectionsRepository.findByOwnerAndProviderConnection({
        ownerUserId: user.id,
        providerConnectionId: sourceControlInput.providerConnectionId,
      })) ??
      (await this.sourceControlConnectionsRepository.create({
        ownerUserId: user.id,
        provider: 'github',
        providerConnectionId: sourceControlInput.providerConnectionId,
        accountLogin: sourceControlInput.accountLogin,
      }));

    const project = await this.projectsRepository.create({
      ownerUserId: user.id,
      sourceControlConnectionId: sourceControlConnection.id,
      name: input.name,
      description: input.description || null,
      repoFullName: input.repoFullName,
      defaultBranch: input.defaultBranch,
      defaultModelId: input.defaultModelId,
      defaultReasoningEffort: input.defaultReasoningEffort,
      pmCanStartSessions: input.pmCanStartSessions ?? true,
      agentProjectKey: input.agentProjectKey,
    });

    return this.buildDeveloperProjectSummary(
      {
        project,
        sourceControlAccountLogin: sourceControlConnection.accountLogin,
        pmMemberCount: 0,
        pmMembers: [],
      },
      [],
      new Map(),
      null,
    );
  }

  async getDeveloperProjectSetup(user: PairDockIdentity): Promise<DeveloperProjectSetup> {
    const sourceControlInputs = await this.resolveSourceControlInputs(user);
    const repositories = (
      await Promise.all(
        sourceControlInputs.map(async (sourceControlInput) =>
          Promise.all(
            (
              await this.sourceControl.listInstallationRepositories({
                ownerUserId: user.id,
                providerConnectionId: sourceControlInput.providerConnectionId,
              })
            ).map(async (repository) => ({
              ...repository,
              branches: await this.sourceControl.listRepositoryBranches({
                ownerUserId: user.id,
                providerConnectionId: sourceControlInput.providerConnectionId,
                repoFullName: repository.fullName,
              }),
            })),
          ),
        ),
      )
    ).flat();

    const agents = this.connectedAgentsRegistry.listSnapshots().map((agent) => ({
      agentId: agent.agentId,
      capabilities: agent.capabilities,
      models: agent.models,
      projects: agent.projects.map((project) => ({
        ...project,
        readiness: null,
      })),
    }));

    return { repositories, agents };
  }

  async shareDeveloperProject(
    projectId: string,
    pmEmail: string,
    user: PairDockIdentity,
  ): Promise<DeveloperProjectSummary> {
    const projectRecord = await this.findOwnedProjectRecord(projectId, user.id);
    const pmUser = await this.findOrCreatePmUser(pmEmail);

    await this.projectMembersRepository.add({
      projectId,
      userId: pmUser.id,
      role: 'pm',
    });

    const refreshedRecord = await this.findOwnedProjectRecord(projectId, user.id);
    const sessionsByProjectId = await this.listSessionsByProjectId([projectRecord.project.id]);

    const projectSessions = sessionsByProjectId.get(projectRecord.project.id) ?? [];
    const reviewRequestUrlsBySessionId = await this.listReviewRequestUrlsBySessionId(
      projectSessions.map((session) => session.id),
    );

    return this.buildDeveloperProjectSummary(refreshedRecord, projectSessions, reviewRequestUrlsBySessionId, null);
  }

  async updateExecutionDefaults(
    projectId: string,
    input: { modelId: string; reasoningEffort: string },
    user: PairDockIdentity,
  ): Promise<DeveloperProjectSummary> {
    const projectRecord = await this.findOwnedProjectRecord(projectId, user.id);
    const selection = this.agentExecutionCapabilities.resolveSessionSelection(projectRecord.project.agentProjectKey, {
      modelId: input.modelId,
      reasoningEffort: input.reasoningEffort,
    });

    await this.projectsRepository.updateExecutionDefaults({
      id: projectId,
      defaultModelId: selection.modelId,
      defaultReasoningEffort: selection.reasoningEffort,
    });

    const refreshedRecord = await this.findOwnedProjectRecord(projectId, user.id);
    const sessionsByProjectId = await this.listSessionsByProjectId([projectId]);
    const sessions = sessionsByProjectId.get(projectId) ?? [];
    const reviewRequestUrlsBySessionId = await this.listReviewRequestUrlsBySessionId(
      sessions.map((session) => session.id),
    );
    const readiness = await this.projectReadinessRepository.findByProjectId(projectId);

    return this.buildDeveloperProjectSummary(refreshedRecord, sessions, reviewRequestUrlsBySessionId, readiness);
  }

  private parseCreateProjectInput(body: unknown): CreateDeveloperProjectInput {
    const parsed = createDeveloperProjectInputSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException('Project name, repository, branch, model, agent key, and connection are required.');
    }

    return parsed.data;
  }

  private async resolveSourceControlInput(
    user: PairDockIdentity,
    repoFullName: string,
  ): Promise<{ providerConnectionId: string; accountLogin: string }> {
    const sourceControlInputs = await this.resolveSourceControlInputs(user);

    if (sourceControlInputs.length === 0) {
      throw new BadRequestException('Install the GitHub App before creating a project.');
    }

    for (const sourceControlInput of sourceControlInputs) {
      const repositories = await this.sourceControl.listInstallationRepositories({
        ownerUserId: user.id,
        providerConnectionId: sourceControlInput.providerConnectionId,
      });

      if (repositories.some((repository) => repository.fullName === repoFullName)) {
        return sourceControlInput;
      }
    }

    throw new BadRequestException('Selected repository is not available through any GitHub App installation.');
  }

  private async resolveSourceControlInputs(
    user: PairDockIdentity,
  ): Promise<Array<{ providerConnectionId: string; accountLogin: string }>> {
    const githubIdentity = await this.externalIdentitiesRepository.findByUserAndProvider({
      userId: user.id,
      provider: 'github',
    });
    const installations = githubIdentity?.metadata.installations;

    if (Array.isArray(installations)) {
      const parsedInstallations = installations.flatMap((installation) => {
        if (!isRecord(installation)) {
          return [];
        }

        const { accountLogin, installationId } = installation;

        return typeof accountLogin === 'string' && accountLogin && typeof installationId === 'string' && installationId
          ? [{ accountLogin, providerConnectionId: installationId }]
          : [];
      });

      if (parsedInstallations.length > 0) {
        return parsedInstallations;
      }
    }

    const installationId = githubIdentity?.metadata.installationId;
    const accountLogin = githubIdentity?.metadata.installationAccountLogin ?? githubIdentity?.metadata.login;

    if (typeof installationId !== 'string' || !installationId) {
      return [];
    }

    return [
      {
        providerConnectionId: installationId,
        accountLogin:
          typeof accountLogin === 'string' && accountLogin ? accountLogin : (user.displayName ?? user.email),
      },
    ];
  }

  private async validateCreateProjectSelection(
    input: CreateDeveloperProjectInput,
    user: PairDockIdentity,
    providerConnectionId: string,
  ): Promise<void> {
    const repositories = await this.sourceControl.listInstallationRepositories({
      ownerUserId: user.id,
      providerConnectionId,
    });
    const selectedRepository = repositories.find((repository) => repository.fullName === input.repoFullName);

    if (!selectedRepository) {
      throw new BadRequestException('Selected repository is not available through the GitHub App installation.');
    }

    const branches = await this.sourceControl.listRepositoryBranches({
      ownerUserId: user.id,
      providerConnectionId,
      repoFullName: input.repoFullName,
    });

    if (!branches.includes(input.defaultBranch)) {
      throw new BadRequestException('Selected branch does not exist in the GitHub App repository.');
    }

    const agent = this.connectedAgentsRegistry
      .listSnapshots()
      .find((snapshot) => snapshot.projects.some((project) => project.key === input.agentProjectKey));
    const agentProject = agent?.projects.find((project) => project.key === input.agentProjectKey);

    if (!agent || !agentProject) {
      throw new BadRequestException('Selected local agent project is offline or not published.');
    }

    if (agentProject.repoFullName !== input.repoFullName) {
      throw new BadRequestException('Selected local agent project does not match the GitHub repository.');
    }

    this.agentExecutionCapabilities.resolveSessionSelection(input.agentProjectKey, {
      modelId: input.defaultModelId,
      reasoningEffort: input.defaultReasoningEffort,
    });
  }

  private async findOwnedProjectRecord(projectId: string, ownerUserId: string): Promise<DeveloperProjectRecord> {
    const record = (await this.projectsRepository.listOwnedByUserId(ownerUserId)).find(
      ({ project }) => project.id === projectId,
    );

    if (!record) {
      throw new NotFoundException(`Project ${projectId} was not found.`);
    }

    return record;
  }

  private async findOrCreatePmUser(pmEmail: string): Promise<PairDockUser> {
    const existingUser = await this.usersRepository.findByEmail(pmEmail, 'pm');

    if (existingUser) {
      return existingUser;
    }

    return this.usersRepository.create({
      email: pmEmail,
      displayName: null,
      kind: 'pm',
    });
  }

  private async listSessionsByProjectId(projectIds: string[]): Promise<Map<string, Session[]>> {
    const sessions = await this.sessionsRepository.listByProjectIds(projectIds);
    const sessionsByProjectId = new Map<string, Session[]>();

    for (const session of sessions) {
      const projectSessions = sessionsByProjectId.get(session.projectId) ?? [];
      projectSessions.push(session);
      sessionsByProjectId.set(session.projectId, projectSessions);
    }

    return sessionsByProjectId;
  }

  private async listReviewRequestUrlsBySessionId(sessionIds: string[]): Promise<Map<string, string | null>> {
    const reviewRequests = await this.reviewRequestsRepository.findManyBySessionIds(sessionIds);
    const urlsBySessionId = new Map<string, string | null>();

    for (const reviewRequest of reviewRequests) {
      if (!urlsBySessionId.has(reviewRequest.sessionId)) {
        urlsBySessionId.set(reviewRequest.sessionId, reviewRequest.reviewRequestUrl);
      }
    }

    return urlsBySessionId;
  }

  private buildDeveloperProjectSummary(
    record: DeveloperProjectRecord,
    sessions: Session[],
    reviewRequestUrlsBySessionId: Map<string, string | null> = new Map(),
    readinessSnapshot: ProjectReadinessSnapshot | null = null,
  ): DeveloperProjectSummary {
    return {
      id: record.project.id,
      name: record.project.name,
      description: record.project.description,
      repoFullName: record.project.repoFullName,
      defaultBranch: record.project.defaultBranch,
      defaultModelId: record.project.defaultModelId,
      defaultReasoningEffort: record.project.defaultReasoningEffort,
      models: this.agentExecutionCapabilities.listModelsForProject(record.project.agentProjectKey),
      agentProjectKey: record.project.agentProjectKey,
      sourceControlAccountLogin: record.sourceControlAccountLogin,
      pmCanStartSessions: record.project.pmCanStartSessions,
      pmMemberCount: record.pmMemberCount,
      pmMembers: record.pmMembers,
      agentAvailability: this.connectedAgentsRegistry.findSocketId(record.project.agentProjectKey)
        ? 'online'
        : 'offline',
      readiness: readinessSnapshot
        ? {
            ok: readinessSnapshot.ok,
            checks: readinessSnapshot.checks,
          }
        : null,
      sessions: sessions.slice(0, 5).map((session) => ({
        id: session.id,
        status: session.status,
        modelId: session.modelId,
        ...(reviewRequestUrlsBySessionId.has(session.id)
          ? { reviewRequestUrl: reviewRequestUrlsBySessionId.get(session.id) }
          : {}),
        createdAt: session.createdAt.toISOString(),
        closedAt: session.closedAt?.toISOString() ?? null,
      })),
    };
  }

  private requireDeveloper(user: PairDockIdentity | undefined): PairDockIdentity {
    const currentUser = this.requireUser(user);

    if (currentUser.kind !== 'developer') {
      throw new ForbiddenException('Only developer users can access developer project controls.');
    }

    return currentUser;
  }

  private requireUser(user: PairDockIdentity | undefined): PairDockIdentity {
    if (!user) {
      throw new InternalServerErrorException('Authenticated user was not resolved.');
    }

    return user;
  }
}

function resolveUnavailableReason(input: {
  pmCanStartSessions: boolean;
  agentAvailability: 'online' | 'offline';
  readinessOk: boolean;
}): string {
  if (!input.pmCanStartSessions) {
    return 'PM session start is disabled for this project.';
  }

  if (input.agentAvailability !== 'online') {
    return 'Owning agent is offline.';
  }

  if (!input.readinessOk) {
    return 'Project setup is not ready for PM-started sessions.';
  }

  return 'This project is currently unavailable.';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
