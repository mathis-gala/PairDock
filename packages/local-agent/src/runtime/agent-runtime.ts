import type { AgentConfig } from '../config/agent-config.js';
import { DockerDependencyPrewarmer } from '../docker/docker-dependency-prewarmer.js';
import type { PreviewCompanionPort, PreviewCompanionRuntime } from '../preview/preview-companion-manager.js';
import { FileSessionWorkspaceStore } from '../session/file-session-workspace.store.js';
import { SessionRegistry } from '../session/session-registry.js';
import { SessionRunner } from '../session/session-runner.js';
import { AgentClient, type AgentClientLogger } from '../websocket/agent-client.js';

interface StartAgentRuntimeInput {
  config: AgentConfig;
  logger?: AgentClientLogger;
  previewCompanionPort?: PreviewCompanionPort;
  runtimeOwnerId?: string;
  statePath?: string;
}

export async function startAgentRuntime(input: StartAgentRuntimeInput): Promise<PreviewCompanionRuntime> {
  const logger = input.logger ?? console;
  const runtimeOwnerId = input.runtimeOwnerId ?? input.config.agentId;
  const previewConfigs = await new DockerDependencyPrewarmer({}, logger).prepareAll({
    ownerId: input.config.agentId,
    projectPaths: input.config.projectPaths,
    previewConfigs: input.config.previewConfigs,
  });
  const config = { ...input.config, previewConfigs };
  const sessionRunner = new SessionRunner(
    {
      runtimeOwnerId,
      projectPaths: config.projectPaths,
      previewConfigs: config.previewConfigs,
      logger,
    },
    {
      previewCompanionPort: input.previewCompanionPort,
      sessionRegistry: new SessionRegistry(new FileSessionWorkspaceStore(input.statePath)),
    },
  );
  const client = new AgentClient(config, logger, { sessionRunner });

  await client.start();

  return {
    async stop({ cleanupSessions }) {
      const errors: unknown[] = [];

      try {
        await client.stop();
      } catch (error) {
        errors.push(error);
      }

      if (cleanupSessions) {
        try {
          await sessionRunner.cleanupAll('delete-local');
        } catch (error) {
          errors.push(error);
        }
      }

      if (errors.length > 0) {
        throw new AggregateError(errors, errors.map(errorMessage).join('; '));
      }
    },
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
