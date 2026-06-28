import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import {
  AGENT_PROTOCOL_VERSION,
  type SessionCloseCommandEnvelope,
  type SessionPrepareCommandEnvelope,
} from '@pairdock/shared-contracts';
import { WorktreeService } from '../../src/git/worktree.service.js';
import { SessionRunner } from '../../src/session/session-runner.js';

const execFileAsync = promisify(execFile);

async function createTempRepository() {
  const repositoryPath = await mkdtemp(join(tmpdir(), 'pairdock-repo-'));
  await execGit(repositoryPath, ['init', '--initial-branch=main']);
  await execGit(repositoryPath, ['config', 'user.name', 'PairDock Test']);
  await execGit(repositoryPath, ['config', 'user.email', 'pairdock@example.test']);
  await execGit(repositoryPath, ['commit', '--allow-empty', '-m', 'initial']);
  return repositoryPath;
}

async function createManagedWorktreeRoot() {
  return mkdtemp(join(tmpdir(), 'pairdock-worktrees-'));
}

function buildPrepareCommand(overrides: Partial<SessionPrepareCommandEnvelope> = {}): SessionPrepareCommandEnvelope {
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: '11111111-1111-4111-8111-111111111111',
    sessionId: '22222222-2222-4222-8222-222222222222',
    sentAt: new Date().toISOString(),
    type: 'session.prepare',
    payload: {
      sessionId: '22222222-2222-4222-8222-222222222222',
      projectKey: 'pairdock',
      branchName: 'pairdock/session-2222',
      modelId: 'codex-cli/gpt-5.4',
    },
    ...overrides,
  };
}

function buildCloseCommand(
  sessionId: string,
  mode: SessionCloseCommandEnvelope['payload']['mode'] = 'delete-local',
): SessionCloseCommandEnvelope {
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: '33333333-3333-4333-8333-333333333333',
    sessionId,
    sentAt: new Date().toISOString(),
    type: 'session.close',
    payload: {
      sessionId,
      mode,
    },
  };
}

test('BT-013: WorktreeService creates a dedicated branch and worktree for session.prepare', async () => {
  const repositoryPath = await createTempRepository();
  const managedRoot = await createManagedWorktreeRoot();
  const worktreeService = new WorktreeService(managedRoot);
  const command = buildPrepareCommand();

  const workspace = await worktreeService.prepare(command, repositoryPath);

  assert.equal(await execGit(repositoryPath, ['branch', '--show-current']), 'main');
  assert.equal(await execGit(workspace.worktreePath, ['branch', '--show-current']), command.payload.branchName);
  assert.match(workspace.worktreePath, new RegExp(`${command.sessionId}$`));
});

test('BT-014: WorktreeService cleanup removes only the session worktree and keeps the main repository', async () => {
  const repositoryPath = await createTempRepository();
  const managedRoot = await createManagedWorktreeRoot();
  const worktreeService = new WorktreeService(managedRoot);
  const command = buildPrepareCommand({
    sessionId: '44444444-4444-4444-8444-444444444444',
    payload: {
      sessionId: '44444444-4444-4444-8444-444444444444',
      projectKey: 'pairdock',
      branchName: 'pairdock/session-4444',
      modelId: 'codex-cli/gpt-5.4',
    },
  });

  const workspace = await worktreeService.prepare(command, repositoryPath);
  await worktreeService.cleanup(workspace, 'delete-local');

  assert.equal(await execGit(repositoryPath, ['rev-parse', '--is-inside-work-tree']), 'true');
  await assert.rejects(() => execGit(workspace.worktreePath, ['rev-parse', '--is-inside-work-tree']));
});

test('BT-015: SessionRunner.close is idempotent after local cleanup already ran', async () => {
  const repositoryPath = await createTempRepository();
  const managedRoot = await createManagedWorktreeRoot();
  const sessionId = '55555555-5555-4555-8555-555555555555';
  const runner = new SessionRunner(
    {
      projectPaths: {
        pairdock: repositoryPath,
      },
    },
    {
      worktreeService: new WorktreeService(managedRoot),
    },
  );

  const command = buildPrepareCommand({
    sessionId,
    payload: {
      sessionId,
      projectKey: 'pairdock',
      branchName: 'pairdock/session-5555',
      modelId: 'codex-cli/gpt-5.4',
    },
  });

  const workspace = await runner.prepare(command);
  const firstClose = await runner.close(buildCloseCommand(sessionId));
  const secondClose = await runner.close(buildCloseCommand(sessionId));

  assert.deepEqual(firstClose, { cleaned: true });
  assert.deepEqual(secondClose, { cleaned: true });
  assert.equal(runner.findWorkspace(sessionId), null);
  assert.equal(await execGit(repositoryPath, ['rev-parse', '--is-inside-work-tree']), 'true');
  await assert.rejects(() => execGit(workspace.worktreePath, ['rev-parse', '--is-inside-work-tree']));
});

async function execGit(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd });
  return stdout.trim();
}
