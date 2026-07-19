import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';
import type { ProjectChecksConfig } from '../checks/checks-runner.js';
import type { ProjectPreviewConfig } from '../docker/sandbox.port.js';
import type { ProjectAgentHarnessConfig } from '../harness/agent-harness.port.js';

export interface AgentModelConfig {
  id: string;
  label: string;
  provider: string;
  reasoningEfforts?: Array<{ id: string; label: string; description?: string }>;
  defaultReasoningEffort?: string;
}

export interface AgentProjectDescriptor {
  key: string;
  name: string;
  repoFullName: string;
  pathAlias: string;
  defaultBranch?: string;
  models?: string[];
}

export interface AgentConfig {
  backendUrl: string;
  agentId: string;
  authToken?: string;
  capabilities: string[];
  models: AgentModelConfig[];
  projects: AgentProjectDescriptor[];
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
  models?: AgentModelConfig[];
  projects?: AgentProjectDescriptor[];
  projectPaths?: Record<string, string>;
  previewConfigs?: Record<string, ProjectPreviewConfig>;
  checksConfigs?: Record<string, ProjectChecksConfig>;
  agentHarnessConfigs?: Record<string, ProjectAgentHarnessConfig>;
}

const sandboxConfigSchema = z.object({
  startCommand: z.string().min(1),
  stopCommand: z.string().min(1).optional(),
  healthcheckUrl: z.string().min(1),
  image: z.string().min(1).optional(),
  workdir: z.string().min(1).optional(),
  network: z.enum(['isolated', 'host-services']).optional(),
  env: z.record(z.string().min(1), z.string()).optional(),
  ports: z.array(z.string().min(1)).optional(),
});

const tunnelConfigSchema = z.object({
  provider: z.literal('cloudflare').optional(),
  publicUrl: z.string().min(1).optional(),
  image: z.string().min(1).optional(),
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

const agentModelConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  provider: z.string().min(1),
  reasoningEfforts: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        description: z.string().min(1).optional(),
      }),
    )
    .optional(),
  defaultReasoningEffort: z.string().min(1).optional(),
});

const agentProjectDescriptorSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  repoFullName: z.string().min(1),
  pathAlias: z.string().min(1),
  defaultBranch: z.string().min(1).optional(),
  models: z.array(z.string().min(1)).optional(),
});

const agentConfigFileSchema = z.object({
  backendUrl: z.string().min(1),
  agentId: z.string().min(1),
  authToken: z.string().min(1).optional(),
  capabilities: z.array(z.string().min(1)).optional(),
  models: z.array(agentModelConfigSchema).optional(),
  projects: z.array(agentProjectDescriptorSchema).optional(),
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
  const models = normalizeModels(input.models ?? []);
  const projects = normalizeProjectDescriptors(input.projects ?? []);
  const projectPaths = normalizeProjectPaths(input.projectPaths ?? {});
  const previewConfigs = normalizePreviewConfigs(input.previewConfigs ?? {});
  const checksConfigs = normalizeChecksConfigs(input.checksConfigs ?? {});
  const agentHarnessConfigs = normalizeAgentHarnessConfigs(input.agentHarnessConfigs ?? {});

  return {
    backendUrl,
    agentId,
    authToken,
    capabilities,
    models,
    projects,
    projectPaths,
    previewConfigs,
    ...(Object.keys(checksConfigs).length > 0 ? { checksConfigs } : {}),
    ...(Object.keys(agentHarnessConfigs).length > 0 ? { agentHarnessConfigs } : {}),
  };
}

export async function saveAgentConfig(input: SaveAgentConfigInput): Promise<{ config: AgentConfig; path: string }> {
  const config = normalizeAgentConfig(input);
  const path = resolveAgentConfigPath();

  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await writeFile(path, JSON.stringify(config, null, 2), { mode: 0o600 });
  await chmod(path, 0o600);

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
    modelCount: config.models.length,
    projectCount: Object.keys(config.projectPaths).length,
    publishedProjectCount: config.projects.length,
    tokenConfigured: Boolean(config.authToken),
    previewConfigCount: Object.keys(config.previewConfigs).length,
    checksConfigCount: Object.keys(config.checksConfigs ?? {}).length,
    agentHarnessConfigCount: Object.keys(config.agentHarnessConfigs ?? {}).length,
  };
}

function normalizeBackendUrl(value: string): string {
  const normalized = normalizeRequiredValue(value, 'backendUrl');
  const url = new URL(normalized);

  const isLoopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]';

  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && isLoopback)) || url.username || url.password) {
    throw new Error(
      'backendUrl must use HTTPS, except for an HTTP loopback address, and must not contain credentials.',
    );
  }

  url.pathname = '';
  url.search = '';
  url.hash = '';

  return url.toString().replace(/\/$/, '');
}

function normalizeCapabilities(capabilities: string[]): string[] {
  return [...new Set(capabilities.map((capability) => normalizeRequiredValue(capability, 'capability')))];
}

function normalizeModels(models: AgentModelConfig[]): AgentModelConfig[] {
  const seen = new Set<string>();
  const normalizedModels: AgentModelConfig[] = [];

  for (const model of models) {
    const id = normalizeRequiredValue(model.id, 'model.id');

    if (seen.has(id)) {
      continue;
    }

    seen.add(id);
    normalizedModels.push({
      id,
      label: normalizeRequiredValue(model.label, `model.label for ${id}`),
      provider: normalizeRequiredValue(model.provider, `model.provider for ${id}`),
      ...(model.reasoningEfforts
        ? {
            reasoningEfforts: model.reasoningEfforts.map((effort) => ({
              id: normalizeRequiredValue(effort.id, `reasoning effort id for ${id}`),
              label: normalizeRequiredValue(effort.label, `reasoning effort label for ${id}`),
              ...(effort.description
                ? { description: normalizeRequiredValue(effort.description, `reasoning effort description for ${id}`) }
                : {}),
            })),
          }
        : {}),
      ...(model.defaultReasoningEffort
        ? {
            defaultReasoningEffort: normalizeRequiredValue(
              model.defaultReasoningEffort,
              `default reasoning effort for ${id}`,
            ),
          }
        : {}),
    });
  }

  return normalizedModels;
}

function normalizeProjectDescriptors(projects: AgentProjectDescriptor[]): AgentProjectDescriptor[] {
  const seen = new Set<string>();
  const normalizedProjects: AgentProjectDescriptor[] = [];

  for (const project of projects) {
    const key = normalizeRequiredValue(project.key, 'project.key');

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalizedProjects.push({
      key,
      name: normalizeRequiredValue(project.name, `project.name for ${key}`),
      repoFullName: normalizeRequiredValue(project.repoFullName, `project.repoFullName for ${key}`),
      pathAlias: normalizeRequiredValue(project.pathAlias, `project.pathAlias for ${key}`),
      ...(project.defaultBranch
        ? { defaultBranch: normalizeRequiredValue(project.defaultBranch, `project.defaultBranch for ${key}`) }
        : {}),
      ...(project.models
        ? { models: project.models.map((modelId) => normalizeRequiredValue(modelId, `project.models for ${key}`)) }
        : {}),
    });
  }

  return normalizedProjects;
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
  assertLoopbackUrlTemplate(normalizedSandboxConfig.healthcheckUrl, `sandbox.healthcheckUrl for ${projectKey}`);

  const stopCommand = normalizeOptionalConfigString(sandboxConfig.stopCommand, `sandbox.stopCommand for ${projectKey}`);
  if (stopCommand !== undefined) {
    normalizedSandboxConfig.stopCommand = stopCommand;
  }

  const image = normalizeOptionalConfigString(sandboxConfig.image, `sandbox.image for ${projectKey}`);
  if (image !== undefined) {
    assertSafeContainerImage(image, `sandbox.image for ${projectKey}`);
    normalizedSandboxConfig.image = image;
  }

  const workdir = normalizeOptionalConfigString(sandboxConfig.workdir, `sandbox.workdir for ${projectKey}`);
  if (workdir !== undefined) {
    normalizedSandboxConfig.workdir = workdir;
  }

  if (sandboxConfig.network !== undefined) {
    normalizedSandboxConfig.network = sandboxConfig.network;
  }

  if (sandboxConfig.env !== undefined) {
    normalizedSandboxConfig.env = Object.fromEntries(
      Object.entries(sandboxConfig.env).map(([name, value]) => [
        normalizeRequiredValue(name, `sandbox.env name for ${projectKey}`),
        value,
      ]),
    );
  }

  if (sandboxConfig.ports !== undefined) {
    normalizedSandboxConfig.ports = sandboxConfig.ports.map((port, index) => {
      const normalizedPort = normalizeRequiredValue(port, `sandbox.ports[${index}] for ${projectKey}`);
      assertLoopbackPortMapping(normalizedPort, `sandbox.ports[${index}] for ${projectKey}`);
      return normalizedPort;
    });
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

  if (tunnelConfig.provider !== undefined) {
    normalizedTunnelConfig.provider = tunnelConfig.provider;
  }

  const publicUrl = normalizeOptionalConfigString(tunnelConfig.publicUrl, `tunnel.publicUrl for ${projectKey}`);
  if (publicUrl !== undefined) {
    assertHttpUrlTemplate(publicUrl, `tunnel.publicUrl for ${projectKey}`);
    normalizedTunnelConfig.publicUrl = publicUrl;
  }

  const image = normalizeOptionalConfigString(tunnelConfig.image, `tunnel.image for ${projectKey}`);
  if (image !== undefined) {
    assertSafeContainerImage(image, `tunnel.image for ${projectKey}`);
    normalizedTunnelConfig.image = image;
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

function assertHttpUrlTemplate(value: string, fieldName: string): void {
  try {
    const url = new URL(value.replaceAll('{{hostPort}}', '4000').replaceAll('{{sessionId}}', 'session'));
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username || url.password) {
      throw new Error();
    }
  } catch {
    throw new Error(`${fieldName} must be an HTTP(S) URL without credentials.`);
  }
}

function assertLoopbackUrlTemplate(value: string, fieldName: string): void {
  assertHttpUrlTemplate(value, fieldName);
  const url = new URL(value.replaceAll('{{hostPort}}', '4000').replaceAll('{{sessionId}}', 'session'));

  if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost' && url.hostname !== '[::1]') {
    throw new Error(`${fieldName} must target a loopback address.`);
  }
}

function assertLoopbackPortMapping(value: string, fieldName: string): void {
  const match = /^127\.0\.0\.1:(\d{1,5}|{{hostPort}}):(\d{1,5})$/.exec(value);
  const validPort = (port: string) => port === '{{hostPort}}' || (Number(port) >= 1 && Number(port) <= 65_535);
  const hostPort = match?.[1];
  const containerPort = match?.[2];

  if (!hostPort || !containerPort || !validPort(hostPort) || !validPort(containerPort)) {
    throw new Error(`${fieldName} must bind valid ports to 127.0.0.1.`);
  }
}

function assertSafeContainerImage(value: string, fieldName: string): void {
  if (
    value.length > 512 ||
    value.startsWith('-') ||
    value.includes('://') ||
    /[\s\0]/.test(value) ||
    !/^[a-z0-9][a-z0-9._\-/:@]+$/i.test(value)
  ) {
    throw new Error(`${fieldName} must be a safe container image reference.`);
  }
}
