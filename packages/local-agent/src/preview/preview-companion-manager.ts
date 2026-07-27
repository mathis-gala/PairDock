import { randomBytes } from 'node:crypto';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { type AgentConfig, normalizeAgentConfig, type PreviewCompanionConfig } from '../config/agent-config.js';
import type { ProjectPreviewConfig } from '../docker/sandbox.port.js';

const AGENT_CREDENTIALS_ENVIRONMENT_KEY = 'AGENT_AUTH_CREDENTIALS_JSON';
const MINIMUM_AGENT_TOKEN_BYTES = 32;

export interface PreviewCompanionRuntime {
  stop(input: { cleanupSessions: boolean }): Promise<void>;
}

export interface PreviewCompanionRuntimeStartInput {
  config: AgentConfig;
  runtimeOwnerId: string;
  statePath: string;
}

export interface PreviewCompanionPort {
  prepare(input: {
    previewConfig?: ProjectPreviewConfig;
    projectKey: string;
    sessionId: string;
  }): Promise<ProjectPreviewConfig | undefined>;
  start(input: { localUrl: string; sessionId: string }): Promise<void>;
  stop(input: { cleanupSessions: boolean; sessionId: string }): Promise<void>;
}

interface PreviewCompanionManagerDependencies {
  loadAgentConfig(path: string): Promise<AgentConfig>;
  randomToken?: () => string;
  resolveStatePath?: (sessionId: string) => string;
  startRuntime(input: PreviewCompanionRuntimeStartInput): Promise<PreviewCompanionRuntime>;
}

interface PendingCompanion {
  config: AgentConfig;
  token: string;
}

export class PreviewCompanionManager implements PreviewCompanionPort {
  private readonly active = new Map<string, PreviewCompanionRuntime>();
  private readonly pending = new Map<string, PendingCompanion>();

  constructor(
    private readonly configs: Record<string, PreviewCompanionConfig>,
    private readonly dependencies: PreviewCompanionManagerDependencies,
  ) {}

  async prepare(input: {
    previewConfig?: ProjectPreviewConfig;
    projectKey: string;
    sessionId: string;
  }): Promise<ProjectPreviewConfig | undefined> {
    const companionConfig = this.configs[input.projectKey];

    if (!companionConfig) {
      return input.previewConfig;
    }

    const sandbox = input.previewConfig?.sandbox;
    if (!sandbox) {
      throw new Error(`Preview companion for ${input.projectKey} requires a configured preview sandbox.`);
    }
    if (sandbox.env?.[AGENT_CREDENTIALS_ENVIRONMENT_KEY] !== undefined) {
      throw new Error(
        `Preview companion for ${input.projectKey} cannot replace an existing ${AGENT_CREDENTIALS_ENVIRONMENT_KEY}.`,
      );
    }

    const config = await this.dependencies.loadAgentConfig(companionConfig.agentConfigPath);
    const projectKeys = Object.keys(config.projectPaths);
    if (projectKeys.length === 0) {
      throw new Error(`Preview companion ${config.agentId} must configure at least one project.`);
    }

    const token = (this.dependencies.randomToken ?? createCompanionToken)();
    if (Buffer.byteLength(token) < MINIMUM_AGENT_TOKEN_BYTES) {
      throw new Error(`Preview companion tokens must contain at least ${MINIMUM_AGENT_TOKEN_BYTES} bytes.`);
    }

    this.pending.set(input.sessionId, { config, token });

    return {
      ...input.previewConfig,
      sandbox: {
        ...sandbox,
        env: {
          ...sandbox.env,
          [AGENT_CREDENTIALS_ENVIRONMENT_KEY]: JSON.stringify({
            [config.agentId]: {
              projectKeys,
              token,
            },
          }),
        },
      },
    };
  }

  async start(input: { localUrl: string; sessionId: string }): Promise<void> {
    if (this.active.has(input.sessionId)) {
      return;
    }

    const pending = this.pending.get(input.sessionId);
    if (!pending) {
      return;
    }

    this.pending.delete(input.sessionId);
    const runtime = await this.dependencies.startRuntime({
      config: normalizeAgentConfig({
        ...pending.config,
        authToken: pending.token,
        backendUrl: input.localUrl,
        previewConfigs: requirePublicCompanionPreviews(pending.config.previewConfigs),
        previewCompanions: {},
      }),
      runtimeOwnerId: `${pending.config.agentId}-companion-${input.sessionId}`,
      statePath: (this.dependencies.resolveStatePath ?? resolveCompanionStatePath)(input.sessionId),
    });
    this.active.set(input.sessionId, runtime);
  }

  async stop(input: { cleanupSessions: boolean; sessionId: string }): Promise<void> {
    this.pending.delete(input.sessionId);
    const runtime = this.active.get(input.sessionId);

    if (!runtime) {
      return;
    }

    try {
      await runtime.stop({ cleanupSessions: input.cleanupSessions });
    } finally {
      this.active.delete(input.sessionId);
    }
  }
}

function createCompanionToken(): string {
  return randomBytes(32).toString('hex');
}

function requirePublicCompanionPreviews(previewConfigs: AgentConfig['previewConfigs']): AgentConfig['previewConfigs'] {
  return Object.fromEntries(
    Object.entries(previewConfigs).map(([projectKey, previewConfig]) => {
      const publicUrl = previewConfig.tunnel?.publicUrl;

      if (!publicUrl || !isLoopbackUrlTemplate(publicUrl)) {
        return [projectKey, previewConfig];
      }

      const tunnel = { ...previewConfig.tunnel };
      delete tunnel.publicUrl;

      return [
        projectKey,
        {
          ...previewConfig,
          tunnel,
        },
      ];
    }),
  );
}

function isLoopbackUrlTemplate(value: string): boolean {
  const url = new URL(value.replaceAll('{{hostPort}}', '4000').replaceAll('{{sessionId}}', 'session'));
  return url.hostname === '127.0.0.1' || url.hostname === 'localhost' || url.hostname === '[::1]';
}

function resolveCompanionStatePath(sessionId: string): string {
  return resolve(homedir(), '.pairdock', 'companion-sessions', `${sessionId}.json`);
}
