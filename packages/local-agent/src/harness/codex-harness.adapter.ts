import { type ChildProcess, spawn } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, delimiter, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import type {
  AgentHarnessEvent,
  AgentHarnessPort,
  ProjectAgentHarnessConfig,
  RunPromptInput,
} from './agent-harness.port.js';

const SAFE_HARNESS_ENVIRONMENT_KEYS = [
  'CODEX_HOME',
  'COLORTERM',
  'HOME',
  'LANG',
  'LC_ALL',
  'LOGNAME',
  'NODE_EXTRA_CA_CERTS',
  'OPENAI_BASE_URL',
  'PATH',
  'SHELL',
  'SSL_CERT_DIR',
  'SSL_CERT_FILE',
  'TERM',
  'TMPDIR',
  'USER',
  'XDG_CACHE_HOME',
  'XDG_CONFIG_HOME',
  'XDG_DATA_HOME',
] as const;

export class CodexHarnessAdapter implements AgentHarnessPort {
  private readonly activeRuns = new Map<string, ChildProcess>();
  private readonly codexThreadIds = new Map<string, string>();

  constructor(private readonly projectConfigs: Record<string, ProjectAgentHarnessConfig> = {}) {}

  runPrompt(input: RunPromptInput): AsyncIterable<AgentHarnessEvent> {
    if (this.activeRuns.has(input.sessionId)) {
      throw new Error(`An agent harness run is already active for session ${input.sessionId}.`);
    }

    const projectConfig = this.projectConfigs[input.projectKey] ?? {};
    const command = projectConfig.command?.trim() || 'codex';
    const usesCodexJsonProtocol = !projectConfig.args?.length && isCodexCommand(command);
    const environment = buildHarnessEnvironment(process.env, input);
    const args = buildCommandArgs(projectConfig, input, this.codexThreadIds.get(input.sessionId), environment);
    const harnessTempDirectory = environment.TMPDIR;

    if (!harnessTempDirectory) {
      throw new Error('PairDock could not configure an isolated temporary directory for the agent harness.');
    }

    mkdirSync(harnessTempDirectory, { recursive: true, mode: 0o700 });
    prepareHarnessShell(environment);
    const childProcess = spawn(command, args, {
      cwd: input.worktreePath,
      env: environment,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const queue = new AgentHarnessEventQueue();
    let stdoutBuffer = '';
    let pendingCodexMessage: string | null = null;
    let settled = false;

    this.activeRuns.set(input.sessionId, childProcess);

    const handleCodexJsonLine = (line: string) => {
      const event = parseCodexJsonLine(line);

      if (event.type === 'thread') {
        this.codexThreadIds.set(input.sessionId, event.threadId);
        return;
      }

      if (event.type === 'message') {
        queue.push({
          type: 'output',
          stream: 'stdout',
          kind: 'progress',
          text: event.text,
        });
        pendingCodexMessage = event.text;
        return;
      }

      if (event.type === 'error') {
        queue.push({ type: 'output', stream: 'stderr', text: `ERROR: ${event.message}` });
      }
    };

    const finish = (exitCode: number) => {
      if (settled) {
        return;
      }

      settled = true;
      if (usesCodexJsonProtocol && pendingCodexMessage) {
        queue.push({
          type: 'output',
          stream: 'stdout',
          kind: exitCode === 0 ? 'final' : 'progress',
          text: pendingCodexMessage,
        });
        pendingCodexMessage = null;
      }
      this.activeRuns.delete(input.sessionId);
      rmSync(harnessTempDirectory, { recursive: true, force: true });
      queue.push({ type: 'done', exitCode });
      queue.close();
    };

    const fail = (error: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      this.activeRuns.delete(input.sessionId);
      rmSync(harnessTempDirectory, { recursive: true, force: true });
      queue.fail(error);
    };

    childProcess.stdout?.on('data', (chunk: Buffer | string) => {
      if (!usesCodexJsonProtocol) {
        queue.push({ type: 'output', stream: 'stdout', text: chunk.toString() });
        return;
      }

      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop() ?? '';
      for (const line of lines) {
        handleCodexJsonLine(line);
      }
    });
    childProcess.stderr?.on('data', (chunk: Buffer | string) => {
      queue.push({
        type: 'output',
        stream: 'stderr',
        text: chunk.toString(),
      });
    });
    childProcess.once('close', (code: number | null, signal: NodeJS.Signals | null) => {
      if (usesCodexJsonProtocol && stdoutBuffer.trim()) {
        handleCodexJsonLine(stdoutBuffer);
      }
      finish(normalizeExitCode(code, signal));
    });
    childProcess.once('error', (error: Error) => {
      fail(error);
    });

    return queue;
  }

  async cancel(sessionId: string): Promise<void> {
    const activeRun = this.activeRuns.get(sessionId);

    if (!activeRun || activeRun.exitCode !== null) {
      return;
    }

    activeRun.kill('SIGTERM');
    await Promise.race([onceExit(activeRun), delay(1_000)]);

    if (activeRun.exitCode === null) {
      activeRun.kill('SIGKILL');
    }
  }
}

export function buildHarnessEnvironment(source: NodeJS.ProcessEnv, input: RunPromptInput): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {};

  for (const key of SAFE_HARNESS_ENVIRONMENT_KEYS) {
    const value = source[key];
    if (value !== undefined) {
      environment[key] = value;
    }
  }

  if (environment.PATH) {
    environment.PATH = prioritizeSandboxCompatibleGit(environment.PATH);
  }

  const harnessTempDirectory = resolveHarnessTempDirectory(input.sessionId);
  const shellConfigDirectory = join(harnessTempDirectory, 'shell');

  return {
    ...environment,
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    PAIRDOCK_MODEL_ID: input.modelId,
    PAIRDOCK_REASONING_EFFORT: input.reasoningEffort ?? 'medium',
    PAIRDOCK_PROJECT_KEY: input.projectKey,
    PAIRDOCK_PROMPT: input.prompt,
    PAIRDOCK_SESSION_ID: input.sessionId,
    TMPDIR: harnessTempDirectory,
    XDG_CACHE_HOME: join(harnessTempDirectory, 'cache'),
    XDG_CONFIG_HOME: join(harnessTempDirectory, 'config'),
    XDG_DATA_HOME: join(harnessTempDirectory, 'data'),
    ZDOTDIR: shellConfigDirectory,
  };
}

function prepareHarnessShell(environment: NodeJS.ProcessEnv): void {
  const shellConfigDirectory = environment.ZDOTDIR;
  if (!shellConfigDirectory) {
    throw new Error('PairDock could not configure an isolated shell directory for the agent harness.');
  }

  mkdirSync(shellConfigDirectory, { recursive: true, mode: 0o700 });
  // macOS login shells prepend /usr/bin again via path_helper; restore the sanitized PATH afterwards.
  writeFileSync(join(shellConfigDirectory, '.zprofile'), `export PATH=${quoteShellValue(environment.PATH ?? '')}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
}

function quoteShellValue(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function prioritizeSandboxCompatibleGit(pathValue: string): string {
  const pathEntries = pathValue.split(delimiter).filter(Boolean);
  const codexFallbackDirectory = pathEntries.find(
    (pathEntry) =>
      pathEntry.endsWith(`${sep}codex-primary-runtime${sep}dependencies${sep}bin${sep}fallback`) &&
      isExecutableFile(join(pathEntry, 'git')),
  );
  const macOsDeveloperGitDirectory =
    process.platform === 'darwin'
      ? ['/Library/Developer/CommandLineTools/usr/bin', '/Applications/Xcode.app/Contents/Developer/usr/bin'].find(
          (pathEntry) => isExecutableFile(join(pathEntry, 'git')),
        )
      : undefined;
  const selectedGitDirectory = codexFallbackDirectory ?? macOsDeveloperGitDirectory;

  if (!selectedGitDirectory) {
    return pathValue;
  }

  return [selectedGitDirectory, ...pathEntries.filter((pathEntry) => pathEntry !== selectedGitDirectory)].join(
    delimiter,
  );
}

function isExecutableFile(path: string): boolean {
  try {
    const stats = statSync(path);
    return stats.isFile() && (stats.mode & 0o111) !== 0;
  } catch {
    return false;
  }
}

export function buildCommandArgs(
  projectConfig: ProjectAgentHarnessConfig,
  input: RunPromptInput,
  codexThreadId?: string,
  harnessEnvironment?: NodeJS.ProcessEnv,
): string[] {
  const reasoningEffort = input.reasoningEffort ?? 'medium';

  if (projectConfig.args?.length) {
    return projectConfig.args.map((arg) =>
      arg
        .replaceAll('{{modelId}}', input.modelId)
        .replaceAll('{{reasoningEffort}}', reasoningEffort)
        .replaceAll('{{projectKey}}', input.projectKey)
        .replaceAll('{{prompt}}', input.prompt)
        .replaceAll('{{sessionId}}', input.sessionId),
    );
  }

  const codexSecurityArgs = buildCodexSecurityArgs(input, harnessEnvironment);
  const prompt = buildCodexPrompt(input.prompt);

  if (codexThreadId) {
    return [
      'exec',
      'resume',
      ...codexSecurityArgs,
      '--json',
      '--model',
      input.modelId,
      '--config',
      `model_reasoning_effort="${reasoningEffort}"`,
      codexThreadId,
      prompt,
    ];
  }

  return [
    'exec',
    ...codexSecurityArgs,
    '--json',
    '--model',
    input.modelId,
    '--config',
    `model_reasoning_effort="${reasoningEffort}"`,
    prompt,
  ];
}

function buildCodexPrompt(userPrompt: string): string {
  return [
    'Read the project manifest before editing. Use its preview start command to identify the source files that power the live preview. Treat prototypes, design references, generated files, and documentation as non-runtime references unless the user explicitly asks to change them.',
    'Your progress updates are visible to a product manager in real time. Keep them concise and user-facing. Explain what you are locating, changing, and verifying without exposing secrets or unrelated environment details.',
    'PairDock independently reruns the configured checks after this turn and automatically returns failures for repair.',
    `User request:\n${userPrompt}`,
  ].join('\n\n');
}

function buildCodexSecurityArgs(input: RunPromptInput, harnessEnvironment?: NodeJS.ProcessEnv): string[] {
  const harnessTempDirectory = resolveHarnessTempDirectory(input.sessionId);
  const cacheDirectory = join(harnessTempDirectory, 'cache');
  const configDirectory = join(harnessTempDirectory, 'config');
  const dataDirectory = join(harnessTempDirectory, 'data');
  const shellConfigDirectory = join(harnessTempDirectory, 'shell');
  const filesystemPermissions = [
    ...resolveManagedWorktreeAncestorPermissions(input.worktreePath),
    ...resolveLinkedWorktreeGitPermissions(input.worktreePath),
    ...resolveExecutablePathPermissions(harnessEnvironment),
  ]
    .map(({ access, path }) => `${JSON.stringify(path)}="${access}",`)
    .join('');

  return [
    '--ignore-user-config',
    '--config',
    'approval_policy="never"',
    '--config',
    'default_permissions="pairdock-restricted"',
    '--config',
    `permissions.pairdock-restricted.filesystem={":minimal"="read",${JSON.stringify(harnessTempDirectory)}="write","/System/Library/OpenSSL"="read","~/.agents/skills"="read","~/.codex/skills"="read",${filesystemPermissions}":workspace_roots"={"."="write","**/.env"="deny","**/.env.local"="deny","**/.env.*.local"="deny","**/.npmrc"="deny","**/.netrc"="deny","**/.pypirc"="deny","**/*.pem"="deny","**/*.key"="deny","**/*.p12"="deny","**/*.pfx"="deny"}}`,
    '--config',
    'permissions.pairdock-restricted.network.enabled=false',
    '--config',
    `shell_environment_policy.set={GIT_CONFIG_GLOBAL="/dev/null",GIT_CONFIG_NOSYSTEM="1",TMPDIR="${harnessTempDirectory}",XDG_CACHE_HOME="${cacheDirectory}",XDG_CONFIG_HOME="${configDirectory}",XDG_DATA_HOME="${dataDirectory}",ZDOTDIR="${shellConfigDirectory}"}`,
  ];
}

type FilesystemPermission = { path: string; access: 'deny' | 'read' | 'write' };

function resolveExecutablePathPermissions(harnessEnvironment: NodeJS.ProcessEnv | undefined): FilesystemPermission[] {
  const pathValue = harnessEnvironment?.PATH;
  if (!pathValue) {
    return [];
  }

  const permissions = new Map<string, FilesystemPermission>();
  const homeDirectory = resolveExistingDirectory(harnessEnvironment.HOME);

  for (const pathEntry of pathValue.split(delimiter)) {
    if (!isAbsolute(pathEntry)) {
      continue;
    }

    const resolvedPathEntry = resolveExistingDirectory(pathEntry);
    if (!resolvedPathEntry || resolvedPathEntry === homeDirectory) {
      continue;
    }

    permissions.set(resolvedPathEntry, { path: resolvedPathEntry, access: 'read' });

    if (pathEntry.endsWith(`${sep}codex-primary-runtime${sep}dependencies${sep}bin${sep}fallback`)) {
      const runtimeDependenciesDirectory = resolveExistingDirectory(resolve(pathEntry, '../..'));
      if (runtimeDependenciesDirectory) {
        permissions.set(runtimeDependenciesDirectory, {
          path: runtimeDependenciesDirectory,
          access: 'read',
        });
      }
    }
  }

  return [...permissions.values()];
}

function resolveExistingDirectory(path: string | undefined): string | null {
  if (!path) {
    return null;
  }

  try {
    const resolvedPath = realpathSync(path);
    return statSync(resolvedPath).isDirectory() ? resolvedPath : null;
  } catch {
    return null;
  }
}

function resolveManagedWorktreeAncestorPermissions(worktreePath: string): FilesystemPermission[] {
  try {
    const resolvedWorktreePath = realpathSync(worktreePath);
    const managedWorktreesRoot = dirname(resolvedWorktreePath);
    const pairDockRoot = dirname(managedWorktreesRoot);
    const homeDirectory = dirname(pairDockRoot);
    const usersDirectory = dirname(homeDirectory);

    if (
      basename(managedWorktreesRoot) !== 'worktrees' ||
      basename(pairDockRoot) !== '.pairdock' ||
      usersDirectory === dirname(usersDirectory)
    ) {
      return [];
    }

    // libc realpath opens every cwd ancestor on macOS. Read each ancestor, then deny every
    // existing sibling explicitly so Bun can resolve cwd without exposing other PairDock data.
    const permissions: FilesystemPermission[] = [];
    for (const { allowedChild, directory } of [
      { directory: usersDirectory, allowedChild: homeDirectory },
      { directory: homeDirectory, allowedChild: pairDockRoot },
      { directory: pairDockRoot, allowedChild: managedWorktreesRoot },
      { directory: managedWorktreesRoot, allowedChild: resolvedWorktreePath },
    ]) {
      permissions.push({ path: directory, access: 'read' });
      permissions.push(...denySiblingPaths(directory, allowedChild));
    }

    permissions.push({ path: resolvedWorktreePath, access: 'write' });
    return permissions;
  } catch {
    return [];
  }
}

function denySiblingPaths(directory: string, allowedChild: string): FilesystemPermission[] {
  return readdirSync(directory)
    .map((entry) => join(directory, entry))
    .filter((entryPath) => entryPath !== allowedChild)
    .map((entryPath) => ({ path: entryPath, access: 'deny' as const }));
}

function resolveLinkedWorktreeGitPermissions(worktreePath: string): FilesystemPermission[] {
  try {
    const resolvedWorktreePath = realpathSync(worktreePath);
    const dotGitPath = join(resolvedWorktreePath, '.git');

    if (!statSync(dotGitPath).isFile()) {
      return [];
    }

    const gitDirectoryMatch = /^gitdir:\s*(.+?)\s*$/i.exec(readFileSync(dotGitPath, 'utf8'));
    if (!gitDirectoryMatch?.[1]) {
      return [];
    }

    const gitDirectory = realpathSync(resolve(dirname(dotGitPath), gitDirectoryMatch[1]));
    const commonDirectoryPath = readFileSync(join(gitDirectory, 'commondir'), 'utf8').trim();
    if (!commonDirectoryPath) {
      return [];
    }

    const commonGitDirectory = realpathSync(resolve(gitDirectory, commonDirectoryPath));
    const linkedWorktreesDirectory = realpathSync(join(commonGitDirectory, 'worktrees'));
    const relativeGitDirectory = relative(linkedWorktreesDirectory, gitDirectory);

    if (
      !relativeGitDirectory ||
      isAbsolute(relativeGitDirectory) ||
      relativeGitDirectory === '..' ||
      relativeGitDirectory.startsWith(`..${sep}`) ||
      relativeGitDirectory.includes(sep)
    ) {
      return [];
    }

    return [
      { path: commonGitDirectory, access: 'read' },
      { path: gitDirectory, access: 'write' },
    ];
  } catch {
    return [];
  }
}

function resolveHarnessTempDirectory(sessionId: string): string {
  return join('/tmp', 'pairdock', sessionId);
}

export type ParsedCodexJsonLine =
  | { type: 'thread'; threadId: string }
  | { type: 'message'; text: string }
  | { type: 'error'; message: string }
  | { type: 'ignored' };

export function parseCodexJsonLine(line: string): ParsedCodexJsonLine {
  try {
    const event = JSON.parse(line) as Record<string, unknown>;

    if (event.type === 'thread.started' && typeof event.thread_id === 'string') {
      return { type: 'thread', threadId: event.thread_id };
    }

    if (event.type === 'item.completed' && isRecord(event.item)) {
      const item = event.item;
      if (item.type === 'agent_message' && typeof item.text === 'string' && item.text.trim()) {
        return { type: 'message', text: item.text.trim() };
      }
    }

    if ((event.type === 'error' || event.type === 'turn.failed') && typeof event.message === 'string') {
      return { type: 'error', message: event.message };
    }
  } catch {
    return { type: 'ignored' };
  }

  return { type: 'ignored' };
}

function isCodexCommand(command: string): boolean {
  return basename(command) === 'codex';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeExitCode(code: number | null, signal: NodeJS.Signals | null): number {
  if (typeof code === 'number') {
    return code;
  }

  return signal ? 130 : 1;
}

async function onceExit(process: ChildProcess): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    process.once('close', () => resolve());
    process.once('error', reject);
  });
}

class AgentHarnessEventQueue implements AsyncIterable<AgentHarnessEvent> {
  private readonly values: AgentHarnessEvent[] = [];
  private readonly waiters: Array<(result: IteratorResult<AgentHarnessEvent, void>) => void> = [];
  private closed = false;
  private failure: Error | null = null;

  push(value: AgentHarnessEvent): void {
    if (this.closed || this.failure) {
      return;
    }

    const waiter = this.waiters.shift();
    if (waiter) {
      waiter({ done: false, value });
      return;
    }

    this.values.push(value);
  }

  close(): void {
    this.closed = true;
    while (this.waiters.length > 0) {
      this.waiters.shift()?.({ done: true, value: undefined });
    }
  }

  fail(error: Error): void {
    this.failure = error;
    this.closed = true;
    while (this.waiters.length > 0) {
      this.waiters.shift()?.({ done: true, value: undefined });
    }
  }

  [Symbol.asyncIterator](): AsyncIterator<AgentHarnessEvent, void> {
    return {
      next: async (): Promise<IteratorResult<AgentHarnessEvent, void>> => {
        if (this.values.length > 0) {
          const value = this.values.shift();
          if (value) {
            return { done: false, value };
          }
        }

        if (this.failure) {
          throw this.failure;
        }

        if (this.closed) {
          return { done: true, value: undefined };
        }

        return new Promise<IteratorResult<AgentHarnessEvent, void>>((resolve) => {
          this.waiters.push(resolve);
        }).then((result) => {
          if (result.done && this.failure) {
            throw this.failure;
          }

          return result;
        });
      },
    };
  }
}

export type { AgentHarnessEvent, ProjectAgentHarnessConfig, RunPromptInput } from './agent-harness.port.js';
