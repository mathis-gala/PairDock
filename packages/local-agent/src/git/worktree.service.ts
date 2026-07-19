import { execFile } from 'node:child_process';
import { constants } from 'node:fs';
import { access, mkdir, realpath } from 'node:fs/promises';
import { homedir } from 'node:os';
import { relative, resolve, sep } from 'node:path';
import { promisify } from 'node:util';
import type { SessionCloseCommandEnvelope, SessionPrepareCommandEnvelope } from '@pairdock/shared-contracts';
import { SensitiveFilesPolicy } from './sensitive-files.policy.js';

const execFileAsync = promisify(execFile);

export interface PreparedWorktree {
  repositoryPath: string;
  worktreePath: string;
  branchName: string;
}

export class WorktreeService {
  constructor(
    private readonly managedRoot = resolve(homedir(), '.pairdock', 'worktrees'),
    private readonly sensitiveFilesPolicy = new SensitiveFilesPolicy(),
  ) {}

  async prepare(command: SessionPrepareCommandEnvelope, repositoryPath: string): Promise<PreparedWorktree> {
    const normalizedRepositoryPath = await this.requireGitRepository(repositoryPath);
    const worktreePath = this.resolveWorktreePath(command.sessionId);

    await mkdir(this.managedRoot, { recursive: true });
    this.assertNotMainRepository(normalizedRepositoryPath, worktreePath);
    const baseRef = await this.resolveBaseRef(normalizedRepositoryPath, command.payload.baseBranch);

    await execGit(normalizedRepositoryPath, [
      'worktree',
      'add',
      '-b',
      command.payload.branchName,
      worktreePath,
      baseRef,
    ]);

    return {
      branchName: command.payload.branchName,
      repositoryPath: normalizedRepositoryPath,
      worktreePath,
    };
  }

  async cleanup(input: PreparedWorktree, mode: SessionCloseCommandEnvelope['payload']['mode']): Promise<void> {
    const normalizedRepositoryPath = await this.requireGitRepository(input.repositoryPath);

    this.assertNotMainRepository(normalizedRepositoryPath, input.worktreePath);

    if (await pathExists(input.worktreePath)) {
      await execGit(normalizedRepositoryPath, ['worktree', 'remove', '--force', input.worktreePath]);
    }

    if (mode === 'delete-local' && (await branchExists(normalizedRepositoryPath, input.branchName))) {
      await execGit(normalizedRepositoryPath, ['branch', '--delete', '--force', input.branchName]);
    }
  }

  async validatePrepared(input: PreparedWorktree, configuredRepositoryPath: string): Promise<void> {
    const normalizedRepositoryPath = await this.requireGitRepository(configuredRepositoryPath);
    const persistedRepositoryPath = await realpath(input.repositoryPath);

    if (persistedRepositoryPath !== normalizedRepositoryPath) {
      throw new Error('Persisted workspace does not belong to the configured repository.');
    }

    this.assertNotMainRepository(normalizedRepositoryPath, input.worktreePath);

    let normalizedWorktreePath: string;
    try {
      normalizedWorktreePath = await realpath(input.worktreePath);
    } catch {
      throw new Error(`Persisted Git worktree is missing: ${input.worktreePath}.`);
    }

    const gitRoot = await execGit(normalizedWorktreePath, ['rev-parse', '--show-toplevel']);
    if ((await realpath(gitRoot)) !== normalizedWorktreePath) {
      throw new Error(`Persisted Git worktree is invalid: ${input.worktreePath}.`);
    }

    const branchName = await execGit(normalizedWorktreePath, ['branch', '--show-current']);
    if (branchName !== input.branchName) {
      throw new Error(
        `Persisted Git worktree branch changed from ${input.branchName} to ${branchName || 'detached HEAD'}.`,
      );
    }
  }

  async pushBranch(input: PreparedWorktree, commitMessage: string): Promise<string> {
    const normalizedRepositoryPath = await this.requireGitRepository(input.repositoryPath);

    this.assertNotMainRepository(normalizedRepositoryPath, input.worktreePath);
    await this.commitChanges(input, commitMessage);
    await execGit(input.worktreePath, ['push', '--set-upstream', 'origin', input.branchName]);
    return input.branchName;
  }

  private async commitChanges(input: PreparedWorktree, commitMessage: string): Promise<void> {
    await execGit(input.worktreePath, ['add', '--all']);
    const stagedFiles = (await execGit(input.worktreePath, ['diff', '--cached', '--name-only', '-z']))
      .split('\0')
      .filter(Boolean);
    const sensitiveFiles = stagedFiles.filter((path) => this.sensitiveFilesPolicy.isSensitive(path));

    if (sensitiveFiles.length > 0) {
      await execGit(input.worktreePath, ['reset', '--quiet']);
      throw new Error(`Refusing to commit sensitive files: ${sensitiveFiles.join(', ')}.`);
    }

    if (stagedFiles.length === 0) {
      return;
    }

    await execGit(input.worktreePath, [
      '-c',
      'user.name=PairDock',
      '-c',
      'user.email=pairdock@localhost',
      'commit',
      '-m',
      commitMessage,
    ]);
  }

  private async resolveBaseRef(repositoryPath: string, baseBranch: string): Promise<string> {
    await execGit(repositoryPath, ['check-ref-format', '--branch', baseBranch]);

    if (await remoteExists(repositoryPath, 'origin')) {
      const remoteRef = `refs/remotes/origin/${baseBranch}`;
      await execGit(repositoryPath, ['fetch', 'origin', `+refs/heads/${baseBranch}:${remoteRef}`]);
      return remoteRef;
    }

    const localRef = `refs/heads/${baseBranch}`;
    await execGit(repositoryPath, ['rev-parse', '--verify', localRef]);
    return localRef;
  }

  private resolveWorktreePath(sessionId: string): string {
    return resolve(this.managedRoot, sessionId);
  }

  private async requireGitRepository(repositoryPath: string): Promise<string> {
    const normalizedRepositoryPath = await realpath(repositoryPath);
    await execGit(normalizedRepositoryPath, ['rev-parse', '--is-inside-work-tree']);
    return normalizedRepositoryPath;
  }

  private assertNotMainRepository(repositoryPath: string, worktreePath: string): void {
    if (repositoryPath === worktreePath) {
      throw new Error('Refusing to operate on the main repository path as a worktree.');
    }

    const rootPrefix = `${this.managedRoot}${sep}`;

    if (worktreePath !== this.managedRoot && !worktreePath.startsWith(rootPrefix)) {
      throw new Error('Worktree path must stay inside the managed worktree root.');
    }

    if (relative(repositoryPath, worktreePath) === '') {
      throw new Error('Refusing to treat the main repository path as a removable worktree.');
    }
  }
}

async function execGit(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd });
  return stdout.trim();
}

async function branchExists(cwd: string, branchName: string): Promise<boolean> {
  try {
    await execGit(cwd, ['rev-parse', '--verify', `refs/heads/${branchName}`]);
    return true;
  } catch {
    return false;
  }
}

async function remoteExists(cwd: string, remoteName: string): Promise<boolean> {
  try {
    await execGit(cwd, ['remote', 'get-url', remoteName]);
    return true;
  } catch {
    return false;
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
