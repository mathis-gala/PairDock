import { ConflictException, Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { Project } from '@pairdock/domain';
import { ConnectedAgentsRegistry } from './connected-agents.registry.js';

@Injectable()
export class AgentProjectBindingService {
  constructor(
    @Inject(ConnectedAgentsRegistry)
    private readonly connectedAgentsRegistry: ConnectedAgentsRegistry,
  ) {}

  isConnected(project: Project): boolean {
    const publishedProject = this.findPublishedProject(project.agentProjectKey);
    return Boolean(publishedProject && repositoriesMatch(publishedProject.repoFullName, project.repoFullName));
  }

  assertConnected(project: Project): void {
    if (!this.connectedAgentsRegistry.findSocketId(project.agentProjectKey)) {
      throw new ServiceUnavailableException(`Owning agent ${project.agentProjectKey} is offline.`);
    }

    this.assertPublishedRepositoryMatches(project);
  }

  assertCompatibleIfConnected(project: Project): void {
    if (!this.connectedAgentsRegistry.findSocketId(project.agentProjectKey)) {
      return;
    }

    this.assertPublishedRepositoryMatches(project);
  }

  private assertPublishedRepositoryMatches(project: Project): void {
    const publishedProject = this.findPublishedProject(project.agentProjectKey);

    if (!publishedProject || !repositoriesMatch(publishedProject.repoFullName, project.repoFullName)) {
      throw new ConflictException(
        'Owning agent project is configured for a different repository. Reconnect the intended agent project before continuing.',
      );
    }
  }

  private findPublishedProject(projectKey: string) {
    for (const snapshot of this.connectedAgentsRegistry.listSnapshots()) {
      const project = snapshot.projects.find((candidate) => candidate.key === projectKey);

      if (project) {
        return project;
      }
    }

    return null;
  }
}

function repositoriesMatch(left: string, right: string): boolean {
  return left.trim().toLocaleLowerCase('en-US') === right.trim().toLocaleLowerCase('en-US');
}
