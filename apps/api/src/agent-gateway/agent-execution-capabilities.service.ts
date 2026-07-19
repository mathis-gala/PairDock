import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { DeveloperSetupAgentModel } from '@pairdock/shared-contracts';
import { ConnectedAgentsRegistry } from './connected-agents.registry.js';

export interface SessionExecutionSelection {
  modelId: string;
  reasoningEffort: string;
}

@Injectable()
export class AgentExecutionCapabilitiesService {
  constructor(
    @Inject(ConnectedAgentsRegistry)
    private readonly connectedAgentsRegistry: ConnectedAgentsRegistry,
  ) {}

  listModelsForProject(projectKey: string): DeveloperSetupAgentModel[] {
    const snapshot = this.connectedAgentsRegistry
      .listSnapshots()
      .find(
        (candidate) =>
          candidate.agentId === projectKey || candidate.projects.some((project) => project.key === projectKey),
      );

    if (!snapshot) {
      return [];
    }

    const project = snapshot.projects.find((candidate) => candidate.key === projectKey);
    const allowedModelIds = project?.models?.length ? new Set(project.models) : null;

    return snapshot.models
      .filter((model) => !allowedModelIds || allowedModelIds.has(model.id))
      .map((model) => {
        const reasoningEfforts = model.reasoningEfforts?.length
          ? model.reasoningEfforts
          : [{ id: 'medium', label: 'Medium' }];
        const defaultReasoningEffort = reasoningEfforts.some((effort) => effort.id === model.defaultReasoningEffort)
          ? (model.defaultReasoningEffort ?? reasoningEfforts[0]?.id ?? 'medium')
          : (reasoningEfforts[0]?.id ?? 'medium');

        return {
          id: model.id,
          label: model.label,
          provider: model.provider,
          reasoningEfforts: reasoningEfforts.map((effort) => ({ ...effort })),
          defaultReasoningEffort,
        };
      });
  }

  resolveSessionSelection(projectKey: string, selection: SessionExecutionSelection): SessionExecutionSelection {
    const models = this.listModelsForProject(projectKey);

    if (models.length === 0) {
      return selection;
    }

    const model = models.find((candidate) => candidate.id === selection.modelId);

    if (!model) {
      throw new BadRequestException('Selected model is not published by the owning local agent project.');
    }

    if (!model.reasoningEfforts?.some((effort) => effort.id === selection.reasoningEffort)) {
      throw new BadRequestException('Selected reasoning effort is not supported by the selected model.');
    }

    return selection;
  }
}
