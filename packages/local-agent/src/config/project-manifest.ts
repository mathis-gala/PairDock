import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import type { ProjectChecksConfig } from '../checks/checks-runner.js';
import type { ProjectPreviewConfig } from '../docker/sandbox.port.js';
import type { AgentConfig, AgentProjectDescriptor } from './agent-config.js';

const manifestFileName = 'pairdock.yml';
const previewUrlTemplateSchema = z.string().min(1).refine(isValidPreviewUrlTemplate, {
  message: 'Preview URL must be an HTTP(S) URL using only supported {{hostPort}} or {{sessionId}} templates.',
});

const pairdockManifestSchema = z.object({
  version: z.literal(1),
  name: z.string().min(1).optional(),
  repoFullName: z.string().min(1).optional(),
  defaultBranch: z.string().min(1).optional(),
  models: z.array(z.string().min(1)).optional(),
  sandbox: z
    .object({
      image: z.string().min(1).optional(),
      workdir: z.string().min(1).optional(),
      network: z.enum(['isolated', 'host-services']).optional(),
      env: z.record(z.string().min(1), z.string()).optional(),
      ports: z.array(z.string().min(1)).optional(),
    })
    .optional(),
  preview: z.object({
    start: z.string().min(1),
    healthcheck: previewUrlTemplateSchema,
    tunnel: z
      .union([
        z.literal('cloudflare'),
        z.object({
          provider: z.literal('cloudflare').optional(),
          publicUrl: previewUrlTemplateSchema.optional(),
          image: z.string().min(1).optional(),
          startupTimeoutMs: z.number().int().positive().optional(),
        }),
      ])
      .optional(),
  }),
  checks: z.object({
    build: z.string().min(1),
    test: z.string().min(1),
    lint: z.string().min(1),
  }),
});

interface ProjectManifestLoadResult {
  descriptor: AgentProjectDescriptor;
  previewConfig: ProjectPreviewConfig;
  checksConfig: ProjectChecksConfig;
}

interface CommandResult {
  ok: boolean;
  output: string;
}

function isValidPreviewUrlTemplate(value: string): boolean {
  const unsupportedTemplate = /{{(?!hostPort}}|sessionId}})[^}]+}}/.test(value);
  if (unsupportedTemplate) {
    return false;
  }

  try {
    const url = new URL(value.replaceAll('{{hostPort}}', '4000').replaceAll('{{sessionId}}', 'session'));
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function enrichConfigWithProjectManifests(config: AgentConfig): Promise<AgentConfig> {
  const projects: AgentProjectDescriptor[] = [];
  const previewConfigs: Record<string, ProjectPreviewConfig> = { ...config.previewConfigs };
  const checksConfigs: Record<string, ProjectChecksConfig> = { ...(config.checksConfigs ?? {}) };

  for (const [projectKey, projectPath] of Object.entries(config.projectPaths)) {
    const result = await loadProjectManifest(projectKey, projectPath).catch(() => null);

    if (!result) {
      continue;
    }

    projects.push(result.descriptor);
    previewConfigs[projectKey] = result.previewConfig;
    checksConfigs[projectKey] = result.checksConfig;
  }

  return {
    ...config,
    projects: mergeProjects(config.projects, projects),
    previewConfigs,
    ...(Object.keys(checksConfigs).length > 0 ? { checksConfigs } : {}),
  };
}

async function loadProjectManifest(projectKey: string, projectPath: string): Promise<ProjectManifestLoadResult> {
  const manifestPath = join(projectPath, manifestFileName);
  const rawManifest = await readFile(manifestPath, 'utf8');
  const manifest = pairdockManifestSchema.parse(parse(rawManifest));
  const repoFullName = manifest.repoFullName ?? (await readRepoFullName(projectPath));
  const defaultBranch = manifest.defaultBranch ?? (await readDefaultBranch(projectPath));
  const checksConfig = {
    build: manifest.checks.build,
    test: manifest.checks.test,
    lint: manifest.checks.lint,
  };

  return {
    descriptor: {
      key: projectKey,
      name: manifest.name ?? projectKey,
      repoFullName,
      pathAlias: basename(projectPath),
      ...(defaultBranch ? { defaultBranch } : {}),
      ...(manifest.models ? { models: manifest.models } : {}),
    },
    previewConfig: {
      sandbox: {
        startCommand: manifest.preview.start,
        healthcheckUrl: manifest.preview.healthcheck,
        ...(manifest.sandbox?.image ? { image: manifest.sandbox.image } : {}),
        ...(manifest.sandbox?.workdir ? { workdir: manifest.sandbox.workdir } : {}),
        ...(manifest.sandbox?.network ? { network: manifest.sandbox.network } : {}),
        ...(manifest.sandbox?.env ? { env: manifest.sandbox.env } : {}),
        ...(manifest.sandbox?.ports ? { ports: manifest.sandbox.ports } : {}),
      },
      ...(manifest.preview.tunnel
        ? {
            tunnel: normalizeTunnelManifest(manifest.preview.tunnel),
          }
        : {}),
    },
    checksConfig,
  };
}

function normalizeTunnelManifest(
  tunnel: 'cloudflare' | { provider?: 'cloudflare'; publicUrl?: string; image?: string; startupTimeoutMs?: number },
) {
  if (tunnel === 'cloudflare') {
    return { provider: 'cloudflare' as const };
  }

  return {
    provider: tunnel.provider ?? ('cloudflare' as const),
    ...(tunnel.publicUrl ? { publicUrl: tunnel.publicUrl } : {}),
    ...(tunnel.image ? { image: tunnel.image } : {}),
    ...(tunnel.startupTimeoutMs ? { startupTimeoutMs: tunnel.startupTimeoutMs } : {}),
  };
}

function mergeProjects(configuredProjects: AgentProjectDescriptor[], manifestProjects: AgentProjectDescriptor[]) {
  const projectsByKey = new Map<string, AgentProjectDescriptor>();

  for (const project of configuredProjects) {
    projectsByKey.set(project.key, project);
  }

  for (const project of manifestProjects) {
    projectsByKey.set(project.key, project);
  }

  return [...projectsByKey.values()];
}

async function readRepoFullName(projectPath: string): Promise<string> {
  const result = await runCommand('git', ['remote', 'get-url', 'origin'], projectPath);

  if (!result.ok) {
    throw new Error('pairdock.yml must include repoFullName when git origin is unavailable.');
  }

  const repoFullName = normalizeGithubRemote(result.output);

  if (!repoFullName) {
    throw new Error('git origin must point to a GitHub repository or pairdock.yml must include repoFullName.');
  }

  return repoFullName;
}

async function readDefaultBranch(projectPath: string): Promise<string | undefined> {
  const result = await runCommand('git', ['branch', '--show-current'], projectPath);
  return result.ok && result.output ? result.output : undefined;
}

function normalizeGithubRemote(remoteUrl: string): string | null {
  const trimmed = remoteUrl.trim().replace(/\.git$/, '');
  const sshMatch = /^git@github\.com:([^/]+\/[^/]+)$/.exec(trimmed);

  if (sshMatch) {
    return sshMatch[1];
  }

  try {
    const url = new URL(trimmed);

    if (url.hostname !== 'github.com') {
      return null;
    }

    return url.pathname.replace(/^\//, '') || null;
  } catch {
    return null;
  }
}

function runCommand(command: string, args: string[], cwd: string): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';

    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.on('error', (error) => {
      resolve({ ok: false, output: error.message });
    });
    child.on('close', (exitCode) => {
      resolve({ ok: exitCode === 0, output: output.trim() });
    });
  });
}
