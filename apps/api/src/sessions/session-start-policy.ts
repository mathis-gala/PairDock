import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { PairDockIdentity, Project } from '@pairdock/domain';
import { ConnectedAgentsRegistry } from '../agent-gateway/connected-agents.registry.js';
import {
  PROJECT_MEMBERS_REPOSITORY,
  PROJECT_READINESS_REPOSITORY,
  PROJECTS_REPOSITORY,
} from '../persistence/persistence.tokens.js';
import type { ProjectMembersRepository } from '../persistence/ports/project-members.repository.js';
import type { ProjectReadinessRepository } from '../persistence/ports/project-readiness.repository.js';
import type { ProjectsRepository } from '../persistence/ports/projects.repository.js';

export type SessionStartSource = 'developer' | 'pm';

@Injectable()
export class SessionStartPolicy {
  constructor(
    @Inject(PROJECTS_REPOSITORY)
    private readonly projectsRepository: ProjectsRepository,
    @Inject(PROJECT_MEMBERS_REPOSITORY)
    private readonly projectMembersRepository: ProjectMembersRepository,
    @Inject(PROJECT_READINESS_REPOSITORY)
    private readonly projectReadinessRepository: ProjectReadinessRepository,
    @Inject(ConnectedAgentsRegistry)
    private readonly connectedAgentsRegistry: ConnectedAgentsRegistry,
  ) {}

  async assertCanStart(
    projectId: string,
    user: PairDockIdentity,
    requestedStartSource?: SessionStartSource,
  ): Promise<Project> {
    const project = await this.projectsRepository.findById(projectId);

    if (!project) {
      throw new NotFoundException(`Project ${projectId} was not found.`);
    }

    const startSource = requestedStartSource ?? (user.kind === 'pm' ? 'pm' : 'developer');

    if (user.kind === 'developer') {
      if (startSource !== 'developer') {
        throw new ForbiddenException('Developer-authenticated requests must use the developer session flow.');
      }

      if (project.ownerUserId !== user.id) {
        throw new ForbiddenException('Only the owning developer can create sessions for this project.');
      }

      return project;
    }

    if (startSource !== 'pm') {
      throw new ForbiddenException('PM-authenticated requests must use the PM shared-project session flow.');
    }

    const membership = await this.projectMembersRepository.findByProjectIdAndUserId(project.id, user.id);

    if (!membership) {
      throw new ForbiddenException('You are not a member of this shared project.');
    }

    if (!project.pmCanStartSessions) {
      throw new ConflictException('PM-started sessions are disabled for this project.');
    }

    if (!this.connectedAgentsRegistry.findSocketId(project.agentProjectKey)) {
      throw new ServiceUnavailableException(`Owning agent ${project.agentProjectKey} is offline.`);
    }

    const readinessSnapshot = await this.projectReadinessRepository.findByProjectId(project.id);

    if (!readinessSnapshot?.ok) {
      throw new ConflictException('This project is not ready for PM-started sessions yet.');
    }

    return project;
  }
}
