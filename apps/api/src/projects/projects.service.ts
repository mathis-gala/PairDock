import { ForbiddenException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import type { PairDockIdentity } from '@pairdock/domain';
import type { SharedProjectSummary } from '@pairdock/shared-contracts';
import { ConnectedAgentsRegistry } from '../agent-gateway/connected-agents.registry.js';
import { PROJECT_READINESS_REPOSITORY, PROJECTS_REPOSITORY } from '../persistence/persistence.tokens.js';
import type { ProjectReadinessRepository } from '../persistence/ports/project-readiness.repository.js';
import type { ProjectsRepository } from '../persistence/ports/projects.repository.js';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(PROJECTS_REPOSITORY)
    private readonly projectsRepository: ProjectsRepository,
    @Inject(PROJECT_READINESS_REPOSITORY)
    private readonly projectReadinessRepository: ProjectReadinessRepository,
    @Inject(ConnectedAgentsRegistry)
    private readonly connectedAgentsRegistry: ConnectedAgentsRegistry,
  ) {}

  listSharedProjectsResponse(user: PairDockIdentity | undefined): Promise<SharedProjectSummary[]> {
    return this.listSharedProjects(this.requireUser(user));
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
        defaultModelId: project.defaultModelId,
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
