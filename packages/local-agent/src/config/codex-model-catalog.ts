import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { z } from 'zod';
import type { AgentConfig, AgentModelConfig } from './agent-config.js';

const codexReasoningLevelSchema = z.object({
  effort: z.string().min(1),
  description: z.string().min(1).optional(),
});

const codexModelSchema = z.object({
  slug: z.string().min(1),
  display_name: z.string().min(1),
  visibility: z.string().min(1),
  default_reasoning_level: z.string().min(1),
  supported_reasoning_levels: z.array(codexReasoningLevelSchema).min(1),
});

const codexModelCacheSchema = z.object({
  client_version: z.string().min(1).optional(),
  models: z.array(codexModelSchema),
});

const execFileAsync = promisify(execFile);

interface CodexCatalogOptions {
  installedCodexVersion?: string;
  onWarning?: (message: string) => void;
}

interface CodexInstallation {
  command: string;
  version: string;
}

export async function enrichConfigWithCodexModels(
  config: AgentConfig,
  cachePath = resolveCodexModelCachePath(),
  options: CodexCatalogOptions = {},
): Promise<AgentConfig> {
  if (config.models.length > 0 && !config.models.some((model) => model.provider === 'codex')) {
    return config;
  }

  const catalog = await readCodexModelCatalog(cachePath);

  if (catalog.models.length === 0) {
    return config;
  }

  if (catalog.clientVersion) {
    const installation = options.installedCodexVersion
      ? { command: 'codex', version: options.installedCodexVersion }
      : await findBestCodexInstallation();
    if (!installation || compareVersions(installation.version, catalog.clientVersion) < 0) {
      const installedLabel = installation?.version ?? 'inconnue';
      const warning = `Codex CLI ${installedLabel} is older than model catalog ${catalog.clientVersion}. Run "codex update" and restart pairdock-agent before selecting newer models.`;
      (options.onWarning ?? console.warn)(warning);
      return config;
    }

    return {
      ...config,
      agentHarnessConfigs: applyCodexCommandToProjects(config, installation.command),
      models: [...config.models.filter((model) => model.provider !== 'codex'), ...catalog.models],
    };
  }

  return {
    ...config,
    models: [...config.models.filter((model) => model.provider !== 'codex'), ...catalog.models],
  };
}

export function resolveCodexModelCachePath(): string {
  const codexHome = process.env.CODEX_HOME?.trim() || resolve(homedir(), '.codex');
  return resolve(codexHome, 'models_cache.json');
}

async function readCodexModelCatalog(
  cachePath: string,
): Promise<{ clientVersion: string | null; models: AgentModelConfig[] }> {
  try {
    const parsed = codexModelCacheSchema.parse(JSON.parse(await readFile(cachePath, 'utf8')));

    return {
      clientVersion: parsed.client_version ?? null,
      models: parsed.models
        .filter((model) => model.visibility === 'list')
        .map((model) => ({
          id: model.slug,
          label: model.display_name,
          provider: 'codex',
          defaultReasoningEffort: model.default_reasoning_level,
          reasoningEfforts: model.supported_reasoning_levels.map((level) => ({
            id: level.effort,
            label: formatReasoningEffortLabel(level.effort),
            ...(level.description ? { description: level.description } : {}),
          })),
        })),
    };
  } catch {
    return { clientVersion: null, models: [] };
  }
}

async function findBestCodexInstallation(): Promise<CodexInstallation | null> {
  const candidates = [
    process.env.PAIRDOCK_CODEX_COMMAND?.trim(),
    'codex',
    process.platform === 'darwin' ? '/Applications/ChatGPT.app/Contents/Resources/codex' : undefined,
  ].filter((candidate): candidate is string => Boolean(candidate));
  const installations = (
    await Promise.all(
      [...new Set(candidates)].map(async (command): Promise<CodexInstallation | null> => {
        try {
          const { stdout } = await execFileAsync(command, ['--version']);
          const version = stdout.match(/\d+\.\d+\.\d+/)?.[0];
          return version ? { command, version } : null;
        } catch {
          return null;
        }
      }),
    )
  ).filter((installation): installation is CodexInstallation => installation !== null);

  return installations.sort((left, right) => compareVersions(right.version, left.version))[0] ?? null;
}

function applyCodexCommandToProjects(config: AgentConfig, command: string) {
  const agentHarnessConfigs = { ...config.agentHarnessConfigs };

  for (const projectKey of Object.keys(config.projectPaths)) {
    const projectConfig = agentHarnessConfigs[projectKey];
    if (!projectConfig?.command || projectConfig.command === 'codex') {
      agentHarnessConfigs[projectKey] = { ...projectConfig, command };
    }
  }

  return agentHarnessConfigs;
}

export function compareVersions(left: string, right: string): number {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);

  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

function formatReasoningEffortLabel(effort: string): string {
  if (effort === 'xhigh') {
    return 'Extra high';
  }

  return `${effort.slice(0, 1).toUpperCase()}${effort.slice(1)}`;
}
