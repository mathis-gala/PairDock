import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import type { ProjectPreviewConfig } from '../docker/sandbox.port.js';

export interface AgentConfig {
  backendUrl: string;
  agentId: string;
  authToken?: string;
  capabilities: string[];
  projectPaths: Record<string, string>;
  previewConfigs: Record<string, ProjectPreviewConfig>;
}

export interface SaveAgentConfigInput {
  backendUrl: string;
  agentId: string;
  authToken?: string;
  capabilities?: string[];
  projectPaths?: Record<string, string>;
  previewConfigs?: Record<string, ProjectPreviewConfig>;
}

const DEFAULT_CONFIG_PATH = resolve(homedir(), '.pairdock', 'agent.json');
const CONFIG_PATH_ENV_VAR = 'PAIRDOCK_AGENT_CONFIG_PATH';

export function resolveAgentConfigPath(): string {
  return process.env[CONFIG_PATH_ENV_VAR] || DEFAULT_CONFIG_PATH;
}

export function normalizeAgentConfig(input: SaveAgentConfigInput): AgentConfig {
  const backendUrl = normalizeBackendUrl(input.backendUrl);
  const agentId = normalizeRequiredValue(input.agentId, 'agentId');
  const authToken = normalizeOptionalValue(input.authToken);
  const capabilities = normalizeCapabilities(input.capabilities ?? []);
  const projectPaths = normalizeProjectPaths(input.projectPaths ?? {});
  const previewConfigs = normalizePreviewConfigs(input.previewConfigs ?? {});

  return {
    backendUrl,
    agentId,
    authToken,
    capabilities,
    projectPaths,
    previewConfigs,
  };
}

export async function saveAgentConfig(input: SaveAgentConfigInput): Promise<{ config: AgentConfig; path: string }> {
  const config = normalizeAgentConfig(input);
  const path = resolveAgentConfigPath();

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(config, null, 2));

  return { config, path };
}

export async function loadAgentConfig(): Promise<AgentConfig> {
  const path = resolveAgentConfigPath();
  const rawConfig = await readFile(path, 'utf8');

  return normalizeAgentConfig(JSON.parse(rawConfig) as SaveAgentConfigInput);
}

export function summarizeAgentConfig(config: AgentConfig) {
  return {
    agentId: config.agentId,
    backendUrl: config.backendUrl,
    capabilities: [...config.capabilities],
    projectCount: Object.keys(config.projectPaths).length,
    tokenConfigured: Boolean(config.authToken),
    previewConfigCount: Object.keys(config.previewConfigs).length,
  };
}

function normalizeBackendUrl(value: string): string {
  const normalized = normalizeRequiredValue(value, 'backendUrl');
  const url = new URL(normalized);

  if (!url.protocol.startsWith('http')) {
    throw new Error('backendUrl must use http or https.');
  }

  url.pathname = '';
  url.search = '';
  url.hash = '';

  return url.toString().replace(/\/$/, '');
}

function normalizeCapabilities(capabilities: string[]): string[] {
  return [...new Set(capabilities.map((capability) => normalizeRequiredValue(capability, 'capability')))];
}

function normalizeProjectPaths(projectPaths: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(projectPaths).map(([projectKey, projectPath]) => [
      normalizeRequiredValue(projectKey, 'projectKey'),
      normalizeRequiredValue(projectPath, `projectPath for ${projectKey}`),
    ]),
  );
}

function normalizePreviewConfigs(
  previewConfigs: Record<string, ProjectPreviewConfig>,
): Record<string, ProjectPreviewConfig> {
  return Object.fromEntries(
    Object.entries(previewConfigs).map(([projectKey, previewConfig]) => {
      const normalizedProjectKey = normalizeRequiredValue(projectKey, 'preview projectKey');
      return [normalizedProjectKey, normalizePreviewConfig(previewConfig, normalizedProjectKey)];
    }),
  );
}

function normalizePreviewConfig(previewConfig: ProjectPreviewConfig, projectKey: string): ProjectPreviewConfig {
  return {
    ...(previewConfig.sandbox
      ? {
          sandbox: {
            startCommand: normalizeRequiredValue(
              previewConfig.sandbox.startCommand,
              `sandbox.startCommand for ${projectKey}`,
            ),
            ...(previewConfig.sandbox.stopCommand
              ? {
                  stopCommand: normalizeRequiredValue(
                    previewConfig.sandbox.stopCommand,
                    `sandbox.stopCommand for ${projectKey}`,
                  ),
                }
              : {}),
            healthcheckUrl: normalizeRequiredValue(
              previewConfig.sandbox.healthcheckUrl,
              `sandbox.healthcheckUrl for ${projectKey}`,
            ),
          },
        }
      : {}),
    ...(previewConfig.tunnel
      ? {
          tunnel: {
            ...(previewConfig.tunnel.publicUrl
              ? {
                  publicUrl: normalizeRequiredValue(
                    previewConfig.tunnel.publicUrl,
                    `tunnel.publicUrl for ${projectKey}`,
                  ),
                }
              : {}),
            ...(previewConfig.tunnel.startCommand
              ? {
                  startCommand: normalizeRequiredValue(
                    previewConfig.tunnel.startCommand,
                    `tunnel.startCommand for ${projectKey}`,
                  ),
                }
              : {}),
            ...(previewConfig.tunnel.closeCommand
              ? {
                  closeCommand: normalizeRequiredValue(
                    previewConfig.tunnel.closeCommand,
                    `tunnel.closeCommand for ${projectKey}`,
                  ),
                }
              : {}),
            ...(previewConfig.tunnel.startupTimeoutMs !== undefined
              ? {
                  startupTimeoutMs: normalizePositiveInteger(
                    previewConfig.tunnel.startupTimeoutMs,
                    `tunnel.startupTimeoutMs for ${projectKey}`,
                  ),
                }
              : {}),
          },
        }
      : {}),
    ...(previewConfig.healthcheckTimeoutMs !== undefined
      ? {
          healthcheckTimeoutMs: normalizePositiveInteger(
            previewConfig.healthcheckTimeoutMs,
            `healthcheckTimeoutMs for ${projectKey}`,
          ),
        }
      : {}),
    ...(previewConfig.healthcheckIntervalMs !== undefined
      ? {
          healthcheckIntervalMs: normalizePositiveInteger(
            previewConfig.healthcheckIntervalMs,
            `healthcheckIntervalMs for ${projectKey}`,
          ),
        }
      : {}),
  };
}

function normalizeRequiredValue(value: string, fieldName: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalized;
}

function normalizeOptionalValue(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return normalizeRequiredValue(value, 'authToken');
}

function normalizePositiveInteger(value: number, fieldName: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }

  return value;
}
