import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';
import type { ProjectChecksConfig } from '../checks/checks-runner.js';
import type { ProjectPreviewConfig } from '../docker/sandbox.port.js';
import type { ProjectAgentHarnessConfig } from '../harness/agent-harness.port.js';

export interface AgentConfig {
  backendUrl: string;
  agentId: string;
  authToken?: string;
  capabilities: string[];
  projectPaths: Record<string, string>;
  previewConfigs: Record<string, ProjectPreviewConfig>;
  checksConfigs?: Record<string, ProjectChecksConfig>;
  agentHarnessConfigs?: Record<string, ProjectAgentHarnessConfig>;
}

export interface SaveAgentConfigInput {
  backendUrl: string;
  agentId: string;
  authToken?: string;
  capabilities?: string[];
  projectPaths?: Record<string, string>;
  previewConfigs?: Record<string, ProjectPreviewConfig>;
  checksConfigs?: Record<string, ProjectChecksConfig>;
  agentHarnessConfigs?: Record<string, ProjectAgentHarnessConfig>;
}

const sandboxConfigSchema = z.object({
  startCommand: z.string().min(1),
  stopCommand: z.string().min(1).optional(),
  healthcheckUrl: z.string().min(1),
});

const tunnelConfigSchema = z.object({
  publicUrl: z.string().min(1).optional(),
  startCommand: z.string().min(1).optional(),
  closeCommand: z.string().min(1).optional(),
  startupTimeoutMs: z.number().int().positive().optional(),
});

const previewConfigSchema = z.object({
  sandbox: sandboxConfigSchema.optional(),
  tunnel: tunnelConfigSchema.optional(),
  healthcheckTimeoutMs: z.number().int().positive().optional(),
  healthcheckIntervalMs: z.number().int().positive().optional(),
});

const checksConfigSchema = z.object({
  build: z.string().min(1).optional(),
  test: z.string().min(1).optional(),
  lint: z.string().min(1).optional(),
});

const agentHarnessConfigSchema = z.object({
  command: z.string().min(1).optional(),
  args: z.array(z.string().min(1)).optional(),
});

/**
 * Schema for the agent configuration file read from disk. Parsing through this
 * schema turns untrusted JSON into a fully-typed value with no casts.
 */
const agentConfigFileSchema = z.object({
  backendUrl: z.string().min(1),
  agentId: z.string().min(1),
  authToken: z.string().min(1).optional(),
  capabilities: z.array(z.string().min(1)).optional(),
  projectPaths: z.record(z.string().min(1), z.string().min(1)).optional(),
  previewConfigs: z.record(z.string().min(1), previewConfigSchema).optional(),
  checksConfigs: z.record(z.string().min(1), checksConfigSchema).optional(),
  agentHarnessConfigs: z.record(z.string().min(1), agentHarnessConfigSchema).optional(),
});

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
  const checksConfigs = normalizeChecksConfigs(input.checksConfigs ?? {});
  const agentHarnessConfigs = normalizeAgentHarnessConfigs(input.agentHarnessConfigs ?? {});

  return {
    backendUrl,
    agentId,
    authToken,
    capabilities,
    projectPaths,
    previewConfigs,
    ...(Object.keys(checksConfigs).length > 0 ? { checksConfigs } : {}),
    ...(Object.keys(agentHarnessConfigs).length > 0 ? { agentHarnessConfigs } : {}),
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
  const parsed = agentConfigFileSchema.parse(JSON.parse(rawConfig));

  return normalizeAgentConfig(parsed);
}

export function summarizeAgentConfig(config: AgentConfig) {
  return {
    agentId: config.agentId,
    backendUrl: config.backendUrl,
    capabilities: [...config.capabilities],
    projectCount: Object.keys(config.projectPaths).length,
    tokenConfigured: Boolean(config.authToken),
    previewConfigCount: Object.keys(config.previewConfigs).length,
    checksConfigCount: Object.keys(config.checksConfigs ?? {}).length,
    agentHarnessConfigCount: Object.keys(config.agentHarnessConfigs ?? {}).length,
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

function normalizeAgentHarnessConfigs(
  agentHarnessConfigs: Record<string, ProjectAgentHarnessConfig>,
): Record<string, ProjectAgentHarnessConfig> {
  return Object.fromEntries(
    Object.entries(agentHarnessConfigs).map(([projectKey, harnessConfig]) => {
      const normalizedProjectKey = normalizeRequiredValue(projectKey, 'agent harness projectKey');
      return [normalizedProjectKey, normalizeAgentHarnessConfig(harnessConfig, normalizedProjectKey)];
    }),
  );
}

function normalizeChecksConfigs(
  checksConfigs: Record<string, ProjectChecksConfig>,
): Record<string, ProjectChecksConfig> {
  return Object.fromEntries(
    Object.entries(checksConfigs).map(([projectKey, checksConfig]) => {
      const normalizedProjectKey = normalizeRequiredValue(projectKey, 'checks projectKey');
      return [normalizedProjectKey, normalizeChecksConfig(checksConfig, normalizedProjectKey)];
    }),
  );
}

function normalizePreviewConfig(previewConfig: ProjectPreviewConfig, projectKey: string): ProjectPreviewConfig {
  const normalizedPreviewConfig: ProjectPreviewConfig = {};

  const sandbox = normalizeSandboxConfig(previewConfig, projectKey);
  if (sandbox) {
    normalizedPreviewConfig.sandbox = sandbox;
  }

  const tunnel = normalizeTunnelConfig(previewConfig, projectKey);
  if (tunnel) {
    normalizedPreviewConfig.tunnel = tunnel;
  }

  const healthcheckTimeoutMs = normalizeOptionalPositiveInteger(
    previewConfig.healthcheckTimeoutMs,
    `healthcheckTimeoutMs for ${projectKey}`,
  );
  if (healthcheckTimeoutMs !== undefined) {
    normalizedPreviewConfig.healthcheckTimeoutMs = healthcheckTimeoutMs;
  }

  const healthcheckIntervalMs = normalizeOptionalPositiveInteger(
    previewConfig.healthcheckIntervalMs,
    `healthcheckIntervalMs for ${projectKey}`,
  );
  if (healthcheckIntervalMs !== undefined) {
    normalizedPreviewConfig.healthcheckIntervalMs = healthcheckIntervalMs;
  }

  return normalizedPreviewConfig;
}

function normalizeAgentHarnessConfig(
  harnessConfig: ProjectAgentHarnessConfig,
  projectKey: string,
): ProjectAgentHarnessConfig {
  const normalizedHarnessConfig: ProjectAgentHarnessConfig = {};

  const command = normalizeOptionalConfigString(harnessConfig.command, `agentHarness.command for ${projectKey}`);
  if (command !== undefined) {
    normalizedHarnessConfig.command = command;
  }

  if (harnessConfig.args !== undefined) {
    normalizedHarnessConfig.args = harnessConfig.args.map((arg, index) =>
      normalizeRequiredValue(arg, `agentHarness.args[${index}] for ${projectKey}`),
    );
  }

  return normalizedHarnessConfig;
}

function normalizeChecksConfig(checksConfig: ProjectChecksConfig, projectKey: string): ProjectChecksConfig {
  const normalizedChecksConfig: ProjectChecksConfig = {};

  const build = normalizeOptionalConfigString(checksConfig.build, `checks.build for ${projectKey}`);
  if (build !== undefined) {
    normalizedChecksConfig.build = build;
  }

  const test = normalizeOptionalConfigString(checksConfig.test, `checks.test for ${projectKey}`);
  if (test !== undefined) {
    normalizedChecksConfig.test = test;
  }

  const lint = normalizeOptionalConfigString(checksConfig.lint, `checks.lint for ${projectKey}`);
  if (lint !== undefined) {
    normalizedChecksConfig.lint = lint;
  }

  return normalizedChecksConfig;
}

function normalizeSandboxConfig(
  previewConfig: ProjectPreviewConfig,
  projectKey: string,
): ProjectPreviewConfig['sandbox'] | undefined {
  const sandboxConfig = previewConfig.sandbox;

  if (!sandboxConfig) {
    return undefined;
  }

  const normalizedSandboxConfig: NonNullable<ProjectPreviewConfig['sandbox']> = {
    startCommand: normalizeRequiredValue(sandboxConfig.startCommand, `sandbox.startCommand for ${projectKey}`),
    healthcheckUrl: normalizeRequiredValue(sandboxConfig.healthcheckUrl, `sandbox.healthcheckUrl for ${projectKey}`),
  };

  const stopCommand = normalizeOptionalConfigString(sandboxConfig.stopCommand, `sandbox.stopCommand for ${projectKey}`);
  if (stopCommand !== undefined) {
    normalizedSandboxConfig.stopCommand = stopCommand;
  }

  return normalizedSandboxConfig;
}

function normalizeTunnelConfig(
  previewConfig: ProjectPreviewConfig,
  projectKey: string,
): ProjectPreviewConfig['tunnel'] | undefined {
  const tunnelConfig = previewConfig.tunnel;

  if (!tunnelConfig) {
    return undefined;
  }

  const normalizedTunnelConfig: NonNullable<ProjectPreviewConfig['tunnel']> = {};

  const publicUrl = normalizeOptionalConfigString(tunnelConfig.publicUrl, `tunnel.publicUrl for ${projectKey}`);
  if (publicUrl !== undefined) {
    normalizedTunnelConfig.publicUrl = publicUrl;
  }

  const startCommand = normalizeOptionalConfigString(
    tunnelConfig.startCommand,
    `tunnel.startCommand for ${projectKey}`,
  );
  if (startCommand !== undefined) {
    normalizedTunnelConfig.startCommand = startCommand;
  }

  const closeCommand = normalizeOptionalConfigString(
    tunnelConfig.closeCommand,
    `tunnel.closeCommand for ${projectKey}`,
  );
  if (closeCommand !== undefined) {
    normalizedTunnelConfig.closeCommand = closeCommand;
  }

  const startupTimeoutMs = normalizeOptionalPositiveInteger(
    tunnelConfig.startupTimeoutMs,
    `tunnel.startupTimeoutMs for ${projectKey}`,
  );
  if (startupTimeoutMs !== undefined) {
    normalizedTunnelConfig.startupTimeoutMs = startupTimeoutMs;
  }

  return normalizedTunnelConfig;
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

function normalizeOptionalConfigString(value: string | undefined, fieldName: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return normalizeRequiredValue(value, fieldName);
}

function normalizePositiveInteger(value: number, fieldName: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }

  return value;
}

function normalizeOptionalPositiveInteger(value: number | undefined, fieldName: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  return normalizePositiveInteger(value, fieldName);
}
