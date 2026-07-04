import { execFile } from 'node:child_process';
import { constants } from 'node:fs';
import { access, mkdir, realpath } from 'node:fs/promises';
import { homedir } from 'node:os';
import { relative, resolve, sep } from 'node:path';
import { promisify } from 'node:util';
import type { SessionCloseCommandEnvelope, SessionPrepareCommandEnvelope } from '@pairdock/shared-contracts';

const execFileAsync = promisify(execFile);

export interface PreparedWorktree {
  repositoryPath: string;
  worktreePath: string;
  branchName: string;
}

export class WorktreeService {
  constructor(private readonly managedRoot = resolve(homedir(), '.pairdock', 'worktrees')) {}

  async prepare(command: SessionPrepareCommandEnvelope, repositoryPath: string): Promise<PreparedWorktree> {
    const normalizedRepositoryPath = await this.requireGitRepository(repositoryPath);
    const worktreePath = this.resolveWorktreePath(command.sessionId);

    await mkdir(this.managedRoot, { recursive: true });
    this.assertNotMainRepository(normalizedRepositoryPath, worktreePath);

    await execGit(normalizedRepositoryPath, [
      'worktree',
      'add',
      '-b',
      command.payload.branchName,
      worktreePath,
      'HEAD',
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

  async pushBranch(input: PreparedWorktree): Promise<string> {
    const normalizedRepositoryPath = await this.requireGitRepository(input.repositoryPath);

    this.assertNotMainRepository(normalizedRepositoryPath, input.worktreePath);
    await execGit(input.worktreePath, ['push', '--set-upstream', 'origin', input.branchName]);
    return input.branchName;
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

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
