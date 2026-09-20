import { execFile } from 'node:child_process';
import { lstat, readFile, realpath, stat } from 'node:fs/promises';
import { basename, isAbsolute, join } from 'node:path';
import { promisify } from 'node:util';
import { z } from 'zod';
import {
  loadProjectManifest,
  normalizeGithubRemote,
  type ProjectManifestLoadResult,
  type ProjectRepositoryMetadata,
} from '../config/project-manifest.js';
import type { ProjectPreviewConfig } from '../docker/sandbox.port.js';
import type { DesktopProjectDraft } from './desktop-contracts.js';

const execFileAsync = promisify(execFile);
const maximumMetadataBytes = 1024 * 1024;
const packageManagerSchema = z.enum(['npm', 'pnpm', 'yarn', 'bun']);
const packageManagerLockfiles = {
  npm: ['package-lock.json', 'npm-shrinkwrap.json'],
  pnpm: ['pnpm-lock.yaml'],
  yarn: ['yarn.lock'],
  bun: ['bun.lock', 'bun.lockb'],
};
const packageJsonSchema = z.object({
  name: z.string().trim().min(1).max(256).optional(),
  packageManager: z.string().max(256).optional(),
  scripts: z.record(z.string().min(1).max(256), z.string().max(16_384)).optional(),
});
const draftCommandSchema = z.string().trim().max(16_384);
export const desktopProjectDraftSchema = z.object({
  path: z.string().min(1).max(4_096).refine(isAbsolute, 'Choose an absolute repository folder path.'),
  name: z.string().trim().min(1).max(256),
  repoFullName: z.string().trim().min(1).max(512),
  defaultBranch: z.string().trim().max(256),
  packageManager: packageManagerSchema,
  scripts: z.array(z.object({ name: z.string().min(1).max(256), command: z.string().max(16_384) })).max(100),
  setupCommand: draftCommandSchema,
  previewCommand: draftCommandSchema.min(1),
  healthcheckUrl: z.string().trim().min(1).max(2_048),
  runtime: z.enum(['host', 'docker']),
  buildCommand: draftCommandSchema.min(1),
  testCommand: draftCommandSchema.min(1),
  lintCommand: draftCommandSchema.min(1),
  manifestStatus: z.enum(['missing', 'valid', 'invalid']),
  warnings: z.array(z.string().max(2_048)).max(100),
});

export async function inspectDesktopProject(selectedPath: string): Promise<DesktopProjectDraft> {
  const repository = await inspectRepository(selectedPath);
  const warnings: string[] = [];
  const packageJson = await readPackageJson(repository.path, warnings);
  const manifest = await readManifest(basename(repository.path), repository.path, repository, warnings);
  const { packageManager, setupCommand } = await detectPackageManager(
    repository.path,
    packageJson?.packageManager,
    warnings,
  );
  const scripts = packageJson?.scripts ?? {};
  const scriptEntries = Object.entries(scripts);
  if (scriptEntries.length > 100) {
    warnings.push('Only the first 100 package scripts are shown. Additional commands can be entered manually.');
  }
  const previewScript = setupCommand ? scripts.dev?.trim() : undefined;
  const vite = previewScript === 'vite';
  const next = previewScript === 'next dev';
  const forwarding = packageManager === 'npm' ? ' --' : '';
  const previewCommand =
    vite || next
      ? `${packageManager} run dev${forwarding} ${vite ? '--host' : '--hostname'} 127.0.0.1 --port {{hostPort}}`
      : '';
  const selectedPreviewCommand = manifest.config?.previewConfig.sandbox?.startCommand ?? previewCommand;
  if (!previewCommand && !manifest.config) {
    warnings.push('Configure a preview command and its local healthcheck URL; the project server was not recognized.');
  }
  for (const command of ['build', 'test', 'lint']) {
    if ((!scripts[command]?.trim() || !setupCommand) && !manifest.config) {
      warnings.push(`Configure the ${command} command; no automatic command could be determined.`);
    }
  }

  const draft: DesktopProjectDraft = {
    ...repository,
    name: packageJson?.name ?? basename(repository.path),
    packageManager,
    scripts: scriptEntries.slice(0, 100).map(([name]) => {
      const quotedName = /^[a-zA-Z0-9_:.-]+$/.test(name) ? name : `'${name.replaceAll("'", "'\\''")}'`;
      const optionSeparator = name.startsWith('-') ? '-- ' : '';
      const command = `${packageManager} run ${optionSeparator}${quotedName}`;
      return { name, command: name === 'dev' && selectedPreviewCommand ? selectedPreviewCommand : command };
    }),
    setupCommand: packageJson ? setupCommand : '',
    previewCommand,
    healthcheckUrl: previewCommand ? 'http://127.0.0.1:{{hostPort}}' : '',
    runtime: 'host',
    buildCommand: scripts.build?.trim() && setupCommand ? `${packageManager} run build` : '',
    testCommand: scripts.test?.trim() && setupCommand ? `${packageManager} run test` : '',
    lintCommand: scripts.lint?.trim() && setupCommand ? `${packageManager} run lint` : '',
    manifestStatus: manifest.status,
    warnings,
  };
  if (manifest.config) {
    const { descriptor, previewConfig, checksConfig } = manifest.config;
    if (descriptor.repoFullName.toLowerCase() !== repository.repoFullName.toLowerCase()) {
      warnings.push('pairdock.yml names a different repository; the Git origin will be used.');
    }
    draft.name = descriptor.name;
    draft.defaultBranch = descriptor.defaultBranch ?? repository.defaultBranch;
    draft.setupCommand = previewConfig.setupCommand ?? '';
    draft.previewCommand = previewConfig.sandbox?.startCommand ?? '';
    draft.healthcheckUrl = previewConfig.sandbox?.healthcheckUrl ?? '';
    draft.runtime = previewConfig.runtime ?? 'host';
    draft.buildCommand = checksConfig.build ?? '';
    draft.testCommand = checksConfig.test ?? '';
    draft.lintCommand = checksConfig.lint ?? '';
  }
  return draft;
}

async function detectPackageManager(path: string, declared: string | undefined, warnings: string[]) {
  const present = new Set<string>();
  for (const [manager, files] of Object.entries(packageManagerLockfiles)) {
    for (const file of files) {
      try {
        if ((await stat(join(path, file))).isFile()) {
          present.add(manager);
        }
      } catch (error) {
        if (!isMissingFile(error)) {
          warnings.push(`${file} could not be inspected.`);
        }
      }
    }
  }
  const declaredManager = declared?.split('@')[0];
  const parsed = packageManagerSchema.safeParse(declaredManager ?? present.values().next().value ?? 'npm');
  const packageManager = parsed.success ? parsed.data : 'npm';
  if (!parsed.success) {
    warnings.push('The declared package manager is unsupported. Choose a package manager and configure its commands.');
    return { packageManager, setupCommand: '' };
  }
  if (present.size > 1 || [...present].some((manager) => manager !== packageManager)) {
    warnings.push(`Conflicting lockfiles were found. Confirm that this project uses ${packageManager}.`);
  }
  const locked = present.has(packageManager);
  let setupCommand = `${packageManager} install`;
  if (locked) {
    if (packageManager === 'npm') {
      setupCommand = 'npm ci';
    } else if (packageManager === 'yarn') {
      const majorVersion = Number(declared?.split('@')[1]?.split('.')[0] ?? '1');
      setupCommand += majorVersion >= 2 ? ' --immutable' : ' --frozen-lockfile';
    } else {
      setupCommand += ' --frozen-lockfile';
    }
  }
  return { packageManager, setupCommand };
}

export async function loadDesktopProjectConfig(
  projectKey: string,
  input: DesktopProjectDraft,
): Promise<ProjectManifestLoadResult> {
  const draft = desktopProjectDraftSchema.parse(input);
  const repository = await inspectRepository(draft.path);
  const manifest = await readManifest(projectKey, repository.path, repository, []);
  const existing = manifest.config;
  const previewConfig: ProjectPreviewConfig = {
    ...existing?.previewConfig,
    runtime: draft.runtime,
    sandbox: {
      ...existing?.previewConfig.sandbox,
      startCommand: draft.previewCommand,
      healthcheckUrl: draft.healthcheckUrl,
    },
  };
  if (draft.setupCommand) {
    previewConfig.setupCommand = draft.setupCommand;
  } else {
    delete previewConfig.setupCommand;
  }
  if (draft.runtime === 'host') {
    delete previewConfig.prepareCommand;
  }
  return {
    descriptor: {
      key: projectKey,
      name: draft.name,
      repoFullName: repository.repoFullName,
      pathAlias: basename(repository.path),
      ...(draft.defaultBranch ? { defaultBranch: draft.defaultBranch } : {}),
      ...(existing?.descriptor.models ? { models: existing.descriptor.models } : {}),
    },
    previewConfig,
    checksConfig: {
      build: draft.buildCommand,
      test: draft.testCommand,
      lint: draft.lintCommand,
    },
  };
}

async function readPackageJson(path: string, warnings: string[]) {
  try {
    const packageJsonPath = join(path, 'package.json');
    await assertReadableMetadata(packageJsonPath);
    return packageJsonSchema.parse(JSON.parse(await readFile(packageJsonPath, 'utf8')));
  } catch (error) {
    warnings.push(isMissingFile(error) ? 'No package.json was found.' : 'package.json is invalid or unreadable.');
    return null;
  }
}

interface ManifestInspection {
  status: 'missing' | 'valid' | 'invalid';
  config?: ProjectManifestLoadResult;
}

async function readManifest(
  projectKey: string,
  path: string,
  repository: ProjectRepositoryMetadata,
  warnings: string[],
): Promise<ManifestInspection> {
  try {
    await assertReadableMetadata(join(path, 'pairdock.yml'));
    return { status: 'valid', config: await loadProjectManifest(projectKey, path, repository) };
  } catch (error) {
    if (isMissingFile(error)) {
      return { status: 'missing' };
    }
    warnings.push('pairdock.yml is invalid or unreadable. Configure this project using the form.');
    return { status: 'invalid' };
  }
}

async function assertReadableMetadata(path: string): Promise<void> {
  const metadata = await lstat(path);
  if (!metadata.isFile() || metadata.size > maximumMetadataBytes) {
    throw new Error('Project metadata must be a regular file smaller than 1 MiB.');
  }
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

async function inspectRepository(selectedPath: string) {
  if (!isAbsolute(selectedPath)) {
    throw new Error('Choose an absolute repository folder path.');
  }
  const path = await realpath(selectedPath);
  const gitRoot = await runGit(path, ['rev-parse', '--show-toplevel']);
  if (path !== (await realpath(gitRoot))) {
    throw new Error('Choose the Git repository root folder.');
  }
  const remote = await runGit(path, ['remote', 'get-url', 'origin']);
  const repoFullName = normalizeGithubRemote(remote);
  if (!repoFullName || !/^[\w.-]+\/[\w.-]+$/.test(repoFullName)) {
    throw new Error('The repository origin must point to a GitHub repository.');
  }
  const defaultBranch = await runGit(path, ['branch', '--show-current']);
  return { path, repoFullName, defaultBranch };
}

async function runGit(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd, timeout: 5_000, maxBuffer: 64 * 1_024 });
  return stdout.trim();
}
