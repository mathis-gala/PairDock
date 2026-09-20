import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { z } from 'zod';
import type { AgentModelConfig } from '../config/agent-config.js';
import {
  type CodexCommandRunner,
  findBestCodexInstallation,
  formatReasoningEffortLabel,
  runCodexCommand,
} from '../config/codex-model-catalog.js';
import { buildCodexEnvironment } from '../harness/codex-harness.adapter.js';
import { killCommandProcess, runBoundedCommand } from '../process/bounded-command.js';
import type { DesktopProjectDraft, DesktopToolStatus, DesktopTools } from './desktop-contracts.js';

export type { CodexCommandRunner as DesktopCommandRunner } from '../config/codex-model-catalog.js';

export interface DesktopToolsOptions {
  codexCommand?: string;
  runCommand?: CodexCommandRunner;
  modelDiscoveryTimeoutMs?: number;
  signal?: AbortSignal;
}

const TOOL_CHECK_TIMEOUT_MS = 5_000;
const CODEX_LOGIN_TIMEOUT_MS = 5 * 60_000;
const MODEL_DISCOVERY_TIMEOUT_MS = 30_000;
const MAX_CATALOG_BYTES = 2 * 1_024 * 1_024;
const MAX_CATALOG_PAGES = 20;
const modelPageSchema = z.object({
  data: z.array(
    z.object({
      model: z.string().min(1),
      displayName: z.string().min(1),
      hidden: z.boolean(),
      defaultReasoningEffort: z.string().min(1),
      supportedReasoningEfforts: z.array(
        z.object({
          reasoningEffort: z.string().min(1),
          description: z.string(),
        }),
      ),
    }),
  ),
  nextCursor: z.string().min(1).nullish(),
});
const rpcResponseSchema = z.object({
  id: z.number().int().optional(),
  result: z.unknown().optional(),
  error: z.unknown().optional(),
});

export async function inspectDesktopTools(options: DesktopToolsOptions = {}): Promise<DesktopTools> {
  const runCommand = options.runCommand ?? runBoundedCommand;
  const runCodex = options.runCommand ?? runCodexCommand;
  const [git, docker, installation] = await Promise.all([
    inspectTool('git', ['--version'], 'Git is available.', 'Install Git to use local repositories.', runCommand),
    inspectTool(
      'docker',
      ['info', '--format', '{{.ServerVersion}}'],
      'Docker is running.',
      'Install or start Docker Desktop to use Docker previews and shared preview links.',
      runCommand,
    ),
    findBestCodexInstallation({ command: options.codexCommand, runCommand: runCodex }),
  ]);
  if (!installation) {
    return {
      git,
      docker,
      codex: {
        available: false,
        version: null,
        authenticated: false,
        message: 'Codex could not be started. Reinstall PairDock or configure a working Codex executable.',
      },
    };
  }

  let authenticated = false;
  try {
    await runCodex(installation.command, ['login', 'status'], TOOL_CHECK_TIMEOUT_MS);
    authenticated = true;
  } catch {
    // The CLI owns credential storage; only its exit status is used here.
  }
  return {
    git,
    docker,
    codex: {
      available: true,
      version: installation.version,
      authenticated,
      message: authenticated
        ? 'Codex is signed in.'
        : 'Codex account status could not be verified. Retry or connect your account.',
    },
  };
}

export async function resolveDesktopCodexCommand(options: DesktopToolsOptions = {}): Promise<string> {
  if (options.codexCommand) return options.codexCommand;
  const installation = await findBestCodexInstallation({ runCommand: options.runCommand ?? runCodexCommand });
  if (!installation)
    throw new Error('Codex could not be started. Reinstall PairDock or configure a working Codex executable.');
  return installation.command;
}

export async function inspectDesktopProjectTools(
  project: DesktopProjectDraft,
  options: DesktopToolsOptions = {},
): Promise<string[]> {
  const required = new Set<string>();
  for (const command of [
    project.setupCommand,
    project.runtime === 'docker' ? '' : project.previewCommand,
    project.buildCommand,
    project.testCommand,
    project.lintCommand,
  ]) {
    for (const match of command.matchAll(/(?:^|&&|\|\||;)\s*(npm|pnpm|yarn|bun|node)(?=\s|$)/g)) {
      const executable = match[1];
      required.add(executable);
      if (executable === 'npm' || executable === 'pnpm' || executable === 'yarn') required.add('node');
    }
  }
  const runCommand = options.runCommand ?? runBoundedCommand;
  const missing = await Promise.all(
    [...required].map(async (command) => {
      try {
        await runCommand(command, ['--version'], TOOL_CHECK_TIMEOUT_MS);
        return null;
      } catch {
        return command;
      }
    }),
  );
  return missing.filter((command): command is string => command !== null);
}

export async function loginDesktopCodex(options: DesktopToolsOptions = {}): Promise<void> {
  const command = await resolveDesktopCodexCommand(options);
  try {
    await (options.runCommand ?? runCodexCommand)(command, ['login'], CODEX_LOGIN_TIMEOUT_MS, options.signal);
  } catch {
    throw new Error('Codex login did not complete. Retry and finish signing in in your browser within five minutes.');
  }
}

export async function discoverDesktopCodexModels(options: DesktopToolsOptions = {}): Promise<AgentModelConfig[]> {
  const command = await resolveDesktopCodexCommand(options);
  return new Promise((resolve, reject) => {
    const child = spawn(command, ['app-server', '--listen', 'stdio://'], {
      cwd: tmpdir(),
      detached: process.platform !== 'win32',
      env: buildCodexEnvironment(process.env),
      stdio: ['pipe', 'pipe', 'ignore'],
      windowsHide: true,
    });
    const models = new Map<string, AgentModelConfig>();
    const cursors = new Set<string>();
    let requestId = 1;
    let pending = '';
    let receivedBytes = 0;
    let finished = false;
    let failure: Error | undefined;
    const timeout = setTimeout(() => {
      finish(new Error('Codex model discovery timed out. Check your connection and retry.'));
    }, options.modelDiscoveryTimeoutMs ?? MODEL_DISCOVERY_TIMEOUT_MS);

    function finish(error?: Error) {
      if (finished) return;
      finished = true;
      failure = error;
      clearTimeout(timeout);
      child.stdin.destroy();
      child.stdout.destroy();
      killCommandProcess(child);
    }

    function send(message: object) {
      if (!finished) child.stdin.write(`${JSON.stringify(message)}\n`);
    }

    function receive(line: string) {
      if (!line.trim() || finished) return;
      try {
        const response = rpcResponseSchema.parse(JSON.parse(line));
        if (response.id !== requestId) return;
        if (response.error !== undefined) {
          finish(new Error('Codex could not load its model catalog. Reconnect your Codex account and retry.'));
          return;
        }
        if (requestId === 1) {
          if (response.result === undefined) throw new Error('Missing initialization result.');
          send({ method: 'initialized', params: {} });
          requestId += 1;
          send({ id: requestId, method: 'model/list', params: { limit: 100, includeHidden: false } });
          return;
        }
        const page = modelPageSchema.parse(response.result);
        for (const model of page.data) {
          if (model.hidden) continue;
          models.set(model.model, {
            id: model.model,
            label: model.displayName,
            provider: 'codex',
            defaultReasoningEffort: model.defaultReasoningEffort,
            reasoningEfforts: model.supportedReasoningEfforts.map((effort) => ({
              id: effort.reasoningEffort,
              label: formatReasoningEffortLabel(effort.reasoningEffort),
              ...(effort.description ? { description: effort.description } : {}),
            })),
          });
        }
        if (page.nextCursor) {
          if (cursors.has(page.nextCursor) || cursors.size >= MAX_CATALOG_PAGES - 1) {
            throw new Error('Invalid catalog pagination.');
          }
          cursors.add(page.nextCursor);
          requestId += 1;
          send({
            id: requestId,
            method: 'model/list',
            params: { limit: 100, includeHidden: false, cursor: page.nextCursor },
          });
          return;
        }
        if (models.size === 0) {
          finish(new Error('Codex returned no available models. Reconnect your Codex account and refresh the tools.'));
          return;
        }
        finish();
      } catch {
        finish(new Error('Codex returned an invalid model catalog. Update PairDock and retry.'));
      }
    }

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      if (finished) return;
      receivedBytes += Buffer.byteLength(chunk);
      if (receivedBytes > MAX_CATALOG_BYTES) {
        finish(new Error('The Codex model catalog exceeded its size limit. Update PairDock and retry.'));
        return;
      }
      pending += chunk;
      let newline = pending.indexOf('\n');
      while (newline >= 0 && !finished) {
        const line = pending.slice(0, newline);
        pending = pending.slice(newline + 1);
        receive(line);
        newline = pending.indexOf('\n');
      }
    });
    child.stdin.on('error', () =>
      finish(new Error('Codex model discovery could not communicate with the local Codex process.')),
    );
    child.on('error', () =>
      finish(new Error('Codex could not be started. Reinstall PairDock or configure a working Codex executable.')),
    );
    child.on('close', () => {
      clearTimeout(timeout);
      if (!finished)
        failure = new Error(
          'Codex exited before its model catalog was available. Reconnect your Codex account and retry.',
        );
      if (failure) reject(failure);
      else resolve([...models.values()]);
    });
    send({ id: requestId, method: 'initialize', params: { clientInfo: { name: 'pairdock', version: '0.1.0' } } });
  });
}

async function inspectTool(
  command: string,
  args: string[],
  availableMessage: string,
  unavailableMessage: string,
  runCommand: CodexCommandRunner,
): Promise<DesktopToolStatus> {
  try {
    const { stdout } = await runCommand(command, args, TOOL_CHECK_TIMEOUT_MS);
    return { available: true, version: stdout.match(/\d+\.\d+\.\d+/)?.[0] ?? null, message: availableMessage };
  } catch {
    return { available: false, version: null, message: unavailableMessage };
  }
}
