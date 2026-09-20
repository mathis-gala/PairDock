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
    return Boolean(publishedProject && this.matchesProject(publishedProject, project));
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

  assertOwnershipIfConnected(project: Project): void {
    const published = this.findPublishedProject(project.agentProjectKey);
    if (published?.ownerUserId && published.ownerUserId !== project.ownerUserId) {
      throw new ConflictException('The local agent belongs to another developer.');
    }
  }

  private assertPublishedRepositoryMatches(project: Project): void {
    const publishedProject = this.findPublishedProject(project.agentProjectKey);

    if (!publishedProject || !this.matchesProject(publishedProject, project)) {
      throw new ConflictException(
        'Owning agent project is configured for a different repository. Reconnect the intended agent project before continuing.',
      );
    }
  }

  private findPublishedProject(projectKey: string) {
    for (const snapshot of this.connectedAgentsRegistry.listSnapshots()) {
      const project = snapshot.projects.find((candidate) => candidate.key === projectKey);

      if (project) {
        return { ...project, ownerUserId: snapshot.ownerUserId };
      }
    }

    return null;
  }

  private matchesProject(published: { repoFullName: string; ownerUserId?: string }, project: Project): boolean {
    return (
      repositoriesMatch(published.repoFullName, project.repoFullName) &&
      (!published.ownerUserId || published.ownerUserId === project.ownerUserId)
    );
  }
}

function repositoriesMatch(left: string, right: string): boolean {
  return left.trim().toLocaleLowerCase('en-US') === right.trim().toLocaleLowerCase('en-US');
}
