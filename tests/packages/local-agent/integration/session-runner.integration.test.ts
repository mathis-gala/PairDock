import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import {
  AGENT_PROTOCOL_VERSION,
  type GitPushBranchCommandEnvelope,
  type SessionCloseCommandEnvelope,
  type SessionPrepareCommandEnvelope,
} from '@pairdock/shared-contracts';
import { HealthcheckService } from '../../../../packages/local-agent/src/docker/healthcheck.service.js';
import type { SandboxPort, SandboxRef } from '../../../../packages/local-agent/src/docker/sandbox.port.js';
import { WorktreeService } from '../../../../packages/local-agent/src/git/worktree.service.js';
import { SessionRunner } from '../../../../packages/local-agent/src/session/session-runner.js';
import type { PreviewTunnelPort } from '../../../../packages/local-agent/src/tunnel/preview-tunnel.port.js';

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
      baseBranch: 'main',
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

function buildPushCommand(sessionId: string): GitPushBranchCommandEnvelope {
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: '99999999-9999-4999-8999-999999999999',
    sessionId,
    sentAt: new Date().toISOString(),
    type: 'git.pushBranch',
    payload: { sessionId },
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

test('V1: WorktreeService creates the session branch from the selected base branch instead of current HEAD', async () => {
  const repositoryPath = await createTempRepository();
  await execGit(repositoryPath, ['switch', '-c', 'release']);
  await writeFile(join(repositoryPath, 'release.txt'), 'release base');
  await execGit(repositoryPath, ['add', 'release.txt']);
  await execGit(repositoryPath, ['commit', '-m', 'release base']);
  const releaseCommit = await execGit(repositoryPath, ['rev-parse', 'HEAD']);
  await execGit(repositoryPath, ['switch', 'main']);
  await writeFile(join(repositoryPath, 'main-only.txt'), 'main head');
  await execGit(repositoryPath, ['add', 'main-only.txt']);
  await execGit(repositoryPath, ['commit', '-m', 'advance main']);
  const worktreeService = new WorktreeService(await createManagedWorktreeRoot());
  const command = buildPrepareCommand({
    payload: {
      sessionId: '22222222-2222-4222-8222-222222222222',
      projectKey: 'pairdock',
      branchName: 'pairdock/session-release',
      baseBranch: 'release',
      modelId: 'codex-cli/gpt-5.4',
    },
  });

  const workspace = await worktreeService.prepare(command, repositoryPath);

  assert.equal(await execGit(workspace.worktreePath, ['rev-parse', 'HEAD']), releaseCommit);
  assert.equal(await execGit(workspace.worktreePath, ['show', 'HEAD:release.txt']), 'release base');
  await assert.rejects(() => execGit(workspace.worktreePath, ['show', 'HEAD:main-only.txt']));
});

test('V1: WorktreeService refreshes the selected remote base despite a narrow fetch refspec', async () => {
  const repositoryPath = await createTempRepository();
  const initialCommit = await execGit(repositoryPath, ['rev-parse', 'HEAD']);
  const remotePath = await mkdtemp(join(tmpdir(), 'pairdock-remote-'));
  await execGit(remotePath, ['init', '--bare', '--initial-branch=main']);
  await execGit(repositoryPath, ['remote', 'add', 'origin', remotePath]);
  await execGit(repositoryPath, ['push', '--set-upstream', 'origin', 'main']);
  await writeFile(join(repositoryPath, 'remote-fresh.txt'), 'fresh remote base');
  await execGit(repositoryPath, ['add', 'remote-fresh.txt']);
  await execGit(repositoryPath, ['commit', '-m', 'advance remote main']);
  const remoteCommit = await execGit(repositoryPath, ['rev-parse', 'HEAD']);
  await execGit(repositoryPath, ['push', 'origin', 'main']);
  await execGit(repositoryPath, ['reset', '--hard', initialCommit]);
  await execGit(repositoryPath, ['update-ref', '-d', 'refs/remotes/origin/main']);
  await execGit(repositoryPath, [
    'config',
    '--replace-all',
    'remote.origin.fetch',
    '+refs/heads/release:refs/remotes/origin/release',
  ]);
  const worktreeService = new WorktreeService(await createManagedWorktreeRoot());

  const workspace = await worktreeService.prepare(buildPrepareCommand(), repositoryPath);

  assert.equal(await execGit(workspace.worktreePath, ['rev-parse', 'HEAD']), remoteCommit);
  assert.equal(await execGit(workspace.worktreePath, ['show', 'HEAD:remote-fresh.txt']), 'fresh remote base');
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
      baseBranch: 'main',
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
  const fakeSandbox = new FakeSandboxPort();
  const fakeTunnel = new FakePreviewTunnelPort();
  const runner = new SessionRunner(
    {
      projectPaths: {
        pairdock: repositoryPath,
      },
    },
    {
      worktreeService: new WorktreeService(managedRoot),
      sandboxPort: fakeSandbox,
      previewTunnelPort: fakeTunnel,
    },
  );

  const command = buildPrepareCommand({
    sessionId,
    payload: {
      sessionId,
      projectKey: 'pairdock',
      branchName: 'pairdock/session-5555',
      baseBranch: 'main',
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

test('BT-016: SessionRunner.prepare returns a preview URL after the sandbox passes healthcheck', async () => {
  const repositoryPath = await createTempRepository();
  const managedRoot = await createManagedWorktreeRoot();
  const fakeSandbox = new FakeSandboxPort();
  const fakeTunnel = new FakePreviewTunnelPort();
  const sessionId = '66666666-6666-4666-8666-666666666666';
  const runner = new SessionRunner(
    {
      projectPaths: {
        pairdock: repositoryPath,
      },
    },
    {
      worktreeService: new WorktreeService(managedRoot),
      sandboxPort: fakeSandbox,
      previewTunnelPort: fakeTunnel,
    },
  );

  const command = buildPrepareCommand({
    sessionId,
    payload: {
      sessionId,
      projectKey: 'pairdock',
      branchName: 'pairdock/session-6666',
      baseBranch: 'main',
      modelId: 'codex-cli/gpt-5.4',
    },
  });
  const workspace = await runner.prepare(command);
  const replayedWorkspace = await runner.prepare(command);

  assert.deepEqual(replayedWorkspace, workspace);
  assert.equal(workspace.previewUrl, 'https://preview.pairdock.test');
  assert.equal(workspace.sandboxRef?.healthcheckUrl, 'http://127.0.0.1:3100/health');
  assert.equal(workspace.tunnelRef?.publicUrl, 'https://preview.pairdock.test');
  assert.equal(fakeSandbox.startCalls.length, 1);
  assert.equal(fakeSandbox.checkCalls.length, 1);
  assert.equal(fakeTunnel.openCalls.length, 1);
  assert.equal(fakeTunnel.openCalls[0]?.localUrl, 'http://127.0.0.1:3100/health');
  assert.equal(runner.findWorkspace(sessionId)?.previewUrl, 'https://preview.pairdock.test');
});

test('V1: WorktreeService refuses to push sensitive generated files', async () => {
  const repositoryPath = await createTempRepository();
  const remotePath = await mkdtemp(join(tmpdir(), 'pairdock-remote-'));
  await execGit(remotePath, ['init', '--bare', '--initial-branch=main']);
  await execGit(repositoryPath, ['remote', 'add', 'origin', remotePath]);
  await execGit(repositoryPath, ['push', '--set-upstream', 'origin', 'main']);
  const worktreeService = new WorktreeService(await createManagedWorktreeRoot());
  const workspace = await worktreeService.prepare(buildPrepareCommand(), repositoryPath);
  await writeFile(join(workspace.worktreePath, '.env'), 'SECRET=do-not-commit');

  await assert.rejects(() => worktreeService.pushBranch(workspace), /Refusing to commit sensitive files: \.env/);
  await assert.rejects(() => execGit(remotePath, ['rev-parse', '--verify', `refs/heads/${workspace.branchName}`]));
});

test('V1: SessionRunner.prepare rolls back the sandbox and worktree after preview startup fails', async () => {
  const repositoryPath = await createTempRepository();
  const managedRoot = await createManagedWorktreeRoot();
  const fakeSandbox = new FakeSandboxPort();
  const sessionId = '77777777-7777-4777-8777-777777777777';
  const worktreePath = join(managedRoot, sessionId);
  const runner = new SessionRunner(
    { projectPaths: { pairdock: repositoryPath } },
    {
      worktreeService: new WorktreeService(managedRoot),
      sandboxPort: fakeSandbox,
      healthcheckService: new FailingHealthcheckService(),
      previewTunnelPort: new FakePreviewTunnelPort(),
    },
  );

  await assert.rejects(
    () =>
      runner.prepare(
        buildPrepareCommand({
          sessionId,
          payload: {
            sessionId,
            projectKey: 'pairdock',
            branchName: 'pairdock/session-7777',
            baseBranch: 'main',
            modelId: 'codex-cli/gpt-5.4',
          },
        }),
      ),
    /preview failed/,
  );

  assert.equal(fakeSandbox.stopCalls.length, 1);
  assert.equal(runner.findWorkspace(sessionId), null);
  await assert.rejects(() => access(worktreePath));
});

test('V1: SessionRunner.close attempts every cleanup step and remains retryable after a failure', async () => {
  const repositoryPath = await createTempRepository();
  const managedRoot = await createManagedWorktreeRoot();
  const fakeSandbox = new FakeSandboxPort();
  const fakeTunnel = new FailingClosePreviewTunnelPort();
  const sessionId = '88888888-8888-4888-8888-888888888888';
  const runner = new SessionRunner(
    { projectPaths: { pairdock: repositoryPath } },
    {
      worktreeService: new WorktreeService(managedRoot),
      sandboxPort: fakeSandbox,
      previewTunnelPort: fakeTunnel,
    },
  );
  const workspace = await runner.prepare(
    buildPrepareCommand({
      sessionId,
      payload: {
        sessionId,
        projectKey: 'pairdock',
        branchName: 'pairdock/session-8888',
        baseBranch: 'main',
        modelId: 'codex-cli/gpt-5.4',
      },
    }),
  );

  await assert.rejects(() => runner.close(buildCloseCommand(sessionId)), /tunnel close failed/);
  assert.equal(fakeSandbox.stopCalls.length, 1);
  await assert.rejects(() => access(workspace.worktreePath));
  assert.notEqual(runner.findWorkspace(sessionId), null);

  fakeTunnel.shouldFailClose = false;
  assert.deepEqual(await runner.close(buildCloseCommand(sessionId)), { cleaned: true });
  assert.equal(fakeSandbox.stopCalls.length, 1);
  assert.equal(runner.findWorkspace(sessionId), null);
});

test('V1: SessionRunner serializes push and close operations for the same session', async () => {
  const repositoryPath = await createTempRepository();
  const managedRoot = await createManagedWorktreeRoot();
  const worktreeService = new BlockingPushWorktreeService(managedRoot);
  const sessionId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const runner = new SessionRunner(
    { projectPaths: { pairdock: repositoryPath } },
    {
      worktreeService,
      sandboxPort: new FakeSandboxPort(),
      previewTunnelPort: new FakePreviewTunnelPort(),
    },
  );
  await runner.prepare(
    buildPrepareCommand({
      sessionId,
      payload: {
        sessionId,
        projectKey: 'pairdock',
        branchName: 'pairdock/session-aaaa',
        baseBranch: 'main',
        modelId: 'codex-cli/gpt-5.4',
      },
    }),
  );

  const pushPromise = runner.pushBranch(buildPushCommand(sessionId));
  await worktreeService.pushStarted;
  const closePromise = runner.close(buildCloseCommand(sessionId));
  await new Promise<void>((resolve) => setImmediate(resolve));

  const cleanupCallsBeforePushCompleted = worktreeService.cleanupCalls;
  worktreeService.releasePush();
  assert.deepEqual(await pushPromise, { branchName: 'pairdock/session-aaaa' });
  assert.deepEqual(await closePromise, { cleaned: true });
  assert.equal(cleanupCallsBeforePushCompleted, 0);
  assert.equal(worktreeService.cleanupCalls, 1);
});

class BlockingPushWorktreeService extends WorktreeService {
  cleanupCalls = 0;
  private resolvePushStarted!: () => void;
  private resolvePushRelease!: () => void;
  readonly pushStarted = new Promise<void>((resolve) => {
    this.resolvePushStarted = resolve;
  });
  private readonly pushRelease = new Promise<void>((resolve) => {
    this.resolvePushRelease = resolve;
  });

  override async pushBranch(input: { branchName: string }): Promise<string> {
    this.resolvePushStarted();
    await this.pushRelease;
    return input.branchName;
  }

  override async cleanup(
    input: Parameters<WorktreeService['cleanup']>[0],
    mode: Parameters<WorktreeService['cleanup']>[1],
  ): Promise<void> {
    this.cleanupCalls += 1;
    await super.cleanup(input, mode);
  }

  releasePush(): void {
    this.resolvePushRelease();
  }
}

class FakeSandboxPort implements SandboxPort {
  readonly startCalls: Array<{ sessionId: string; worktreePath: string }> = [];
  readonly checkCalls: SandboxRef[] = [];
  readonly stopCalls: SandboxRef[] = [];

  async start(input: { sessionId: string; worktreePath: string }): Promise<SandboxRef> {
    this.startCalls.push({ sessionId: input.sessionId, worktreePath: input.worktreePath });
    return {
      id: `sandbox-${input.sessionId}`,
      sessionId: input.sessionId,
      healthcheckUrl: 'http://127.0.0.1:3100/health',
    };
  }

  async stop(ref: SandboxRef): Promise<void> {
    this.stopCalls.push(ref);
  }

  async check(ref: SandboxRef) {
    this.checkCalls.push(ref);
    return {
      ready: true,
      url: ref.healthcheckUrl,
    };
  }
}

class FakePreviewTunnelPort implements PreviewTunnelPort {
  readonly openCalls: Array<{ sessionId: string; localUrl: string }> = [];

  async open(input: { sessionId: string; localUrl: string }) {
    this.openCalls.push({ sessionId: input.sessionId, localUrl: input.localUrl });
    return {
      id: `tunnel-${input.sessionId}`,
      sessionId: input.sessionId,
      publicUrl: 'https://preview.pairdock.test',
    };
  }

  async close(): Promise<void> {}
}

class FailingClosePreviewTunnelPort extends FakePreviewTunnelPort {
  shouldFailClose = true;

  override async close(): Promise<void> {
    if (this.shouldFailClose) {
      throw new Error('tunnel close failed');
    }
  }
}

class FailingHealthcheckService extends HealthcheckService {
  override waitUntilReady(): Promise<never> {
    return Promise.reject(new Error('preview failed'));
  }
}

async function execGit(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd });
  return stdout.trim();
}
