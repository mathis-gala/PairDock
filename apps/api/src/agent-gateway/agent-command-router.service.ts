import { Inject, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { AgentCommandEnvelope } from '@pairdock/shared-contracts';
import { PROJECTS_REPOSITORY, SESSIONS_REPOSITORY } from '../persistence/persistence.tokens.js';
import type { ProjectsRepository } from '../persistence/ports/projects.repository.js';
import type { SessionsRepository } from '../persistence/ports/sessions.repository.js';
import { AgentGateway } from './agent.gateway.js';
import { AgentProjectBindingService } from './agent-project-binding.service.js';

@Injectable()
export class AgentCommandRouterService {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessionsRepository: SessionsRepository,
    @Inject(PROJECTS_REPOSITORY)
    private readonly projectsRepository: ProjectsRepository,
    @Inject(AgentGateway)
    private readonly agentGateway: AgentGateway,
    @Inject(AgentProjectBindingService)
    private readonly agentProjectBinding: AgentProjectBindingService,
  ) {}

  async routeToOwningAgent(
    sessionId: string,
    command: AgentCommandEnvelope,
    options: { waitForCompletion?: boolean } = {},
  ): Promise<void> {
    const session = await this.sessionsRepository.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} was not found.`);
    }

    const project = await this.projectsRepository.findById(session.projectId);

    if (!project) {
      throw new NotFoundException(`Project ${session.projectId} was not found.`);
    }

    if (command.type !== 'session.close') {
      this.agentProjectBinding.assertConnected(project);
    }

    const delivered = options.waitForCompletion
      ? await this.agentGateway.emitToAgentAndWait(project.agentProjectKey, command)
      : this.agentGateway.emitToAgent(project.agentProjectKey, command);

    if (!delivered) {
      throw new ServiceUnavailableException(`Agent ${project.agentProjectKey} is not connected.`);
    }
  }
}
