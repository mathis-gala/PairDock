import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';

export interface AgentConfig {
  backendUrl: string;
  agentId: string;
  authToken?: string;
  capabilities: string[];
}

export interface SaveAgentConfigInput {
  backendUrl: string;
  agentId: string;
  authToken?: string;
  capabilities?: string[];
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

  return {
    backendUrl,
    agentId,
    authToken,
    capabilities,
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
    tokenConfigured: Boolean(config.authToken),
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
