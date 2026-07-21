import { randomUUID } from 'node:crypto';
import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { PairDockIdentity, ProjectReadinessSnapshot } from '@pairdock/domain';
import { AGENT_PROTOCOL_VERSION, type ReadinessCheckCommandEnvelope } from '@pairdock/shared-contracts';
import { AgentGateway } from '../agent-gateway/agent.gateway.js';
import { AgentProjectBindingService } from '../agent-gateway/agent-project-binding.service.js';
import { PROJECT_READINESS_REPOSITORY, PROJECTS_REPOSITORY } from '../persistence/persistence.tokens.js';
import type { ProjectReadinessRepository } from '../persistence/ports/project-readiness.repository.js';
import type { ProjectsRepository } from '../persistence/ports/projects.repository.js';

@Injectable()
export class ToolReadinessService {
  constructor(
    @Inject(PROJECTS_REPOSITORY)
    private readonly projectsRepository: ProjectsRepository,
    @Inject(PROJECT_READINESS_REPOSITORY)
    private readonly projectReadinessRepository: ProjectReadinessRepository,
    @Inject(AgentGateway)
    private readonly agentGateway: AgentGateway,
    @Inject(AgentProjectBindingService)
    private readonly agentProjectBinding: AgentProjectBindingService,
  ) {}

  async getProjectReadinessResponse(projectId: string, user: PairDockIdentity | undefined) {
    const project = await this.findOwnedProject(projectId, this.requireDeveloper(user));
    const snapshot = await this.projectReadinessRepository.findByProjectId(project.id);
    return toReadinessResponse(snapshot);
  }

  async requestProjectReadinessCheckResponse(projectId: string, user: PairDockIdentity | undefined) {
    const project = await this.findOwnedProject(projectId, this.requireDeveloper(user));
    this.agentProjectBinding.assertConnected(project);
    const command: ReadinessCheckCommandEnvelope = {
      protocolVersion: AGENT_PROTOCOL_VERSION,
      messageId: randomUUID(),
      type: 'readiness.check',
      payload: {
        projectKey: project.agentProjectKey,
      },
      sentAt: new Date().toISOString(),
    };

    const delivered = this.agentGateway.emitToAgent(project.agentProjectKey, command);

    if (!delivered) {
      throw new ServiceUnavailableException(`Agent ${project.agentProjectKey} is not connected.`);
    }

    return { requested: true };
  }

  private async findOwnedProject(projectId: string, user: PairDockIdentity) {
    const project = await this.projectsRepository.findById(projectId);

    if (!project) {
      throw new NotFoundException(`Project ${projectId} was not found.`);
    }

    if (project.ownerUserId !== user.id) {
      throw new ForbiddenException('Only the owning developer can access project readiness.');
    }

    return project;
  }

  private requireDeveloper(user: PairDockIdentity | undefined): PairDockIdentity {
    if (!user) {
      throw new InternalServerErrorException('Authenticated user was not resolved.');
    }

    if (user.kind !== 'developer') {
      throw new ForbiddenException('Only developer users can access developer readiness checks.');
    }

    return user;
  }
}

function toReadinessResponse(snapshot: ProjectReadinessSnapshot | null) {
  return snapshot
    ? {
        ok: snapshot.ok,
        checks: snapshot.checks,
        updatedAt: snapshot.updatedAt.toISOString(),
      }
    : null;
}
