import { type ExecFileException, execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { SensitiveFilesPolicy } from './sensitive-files.policy.js';

const execFileAsync = promisify(execFile);
const sensitiveFileMarker = '[PAIRDOCK_REDACTED]';

interface ChangedFile {
  path: string;
  statusCode: string;
}

export interface CollectedDiff {
  diff: string;
  changedFiles: string[];
  fingerprint: string;
}

export class DiffService {
  constructor(private readonly sensitiveFilesPolicy = new SensitiveFilesPolicy()) {}

  async collect(worktreePath: string): Promise<CollectedDiff> {
    const changedFiles = await this.listChangedFiles(worktreePath);

    if (changedFiles.length === 0) {
      return { diff: '', changedFiles: [], fingerprint: createHash('sha256').digest('hex') };
    }

    const sections: string[] = [];
    const fingerprint = createHash('sha256');

    for (const file of changedFiles) {
      const isSensitive = this.sensitiveFilesPolicy.isSensitive(file.path);
      const section = isSensitive
        ? await this.renderSensitiveFileFingerprint(worktreePath, file.path)
        : await this.renderDiffSection(worktreePath, file);
      fingerprint.update(file.statusCode);
      fingerprint.update('\0');
      fingerprint.update(file.path);
      fingerprint.update('\0');
      fingerprint.update(section);
      fingerprint.update('\0');

      if (isSensitive) {
        sections.push(`${sensitiveFileMarker} Sensitive file omitted: ${file.path}`);
        continue;
      }

      if (section) {
        sections.push(section.trim());
      }
    }

    return {
      diff: sections.join('\n\n').trim(),
      changedFiles: changedFiles.map((file) => file.path),
      fingerprint: fingerprint.digest('hex'),
    };
  }

  private async listChangedFiles(worktreePath: string): Promise<ChangedFile[]> {
    const statusOutput = await execGit(worktreePath, ['status', '--porcelain=v1', '--untracked-files=all']);

    if (!statusOutput) {
      return [];
    }

    return statusOutput
      .split('\n')
      .filter(Boolean)
      .map((line) => ({
        statusCode: line.slice(0, 2),
        path: normalizeStatusPath(line.slice(3)),
      }));
  }

  private async renderDiffSection(worktreePath: string, file: ChangedFile): Promise<string> {
    if (file.statusCode === '??') {
      return this.renderUntrackedFileDiff(worktreePath, file.path);
    }

    return execGit(worktreePath, ['diff', '--no-ext-diff', '--relative', 'HEAD', '--', file.path]);
  }

  private async renderSensitiveFileFingerprint(worktreePath: string, relativePath: string): Promise<string> {
    try {
      await access(join(worktreePath, relativePath));
    } catch {
      return 'missing';
    }

    return execGit(worktreePath, ['hash-object', '--', relativePath]);
  }

  private async renderUntrackedFileDiff(worktreePath: string, relativePath: string): Promise<string> {
    const absolutePath = join(worktreePath, relativePath);

    try {
      await access(absolutePath);
    } catch {
      return `Added path ${relativePath}`;
    }

    return execGitAllowingDiffExitCode(worktreePath, [
      'diff',
      '--no-ext-diff',
      '--no-index',
      '--',
      '/dev/null',
      relativePath,
    ]);
  }
}

async function execGit(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd });
  return stdout.trimEnd();
}

async function execGitAllowingDiffExitCode(cwd: string, args: string[]): Promise<string> {
  try {
    return await execGit(cwd, args);
  } catch (error) {
    if (isGitDiffExitCode(error)) {
      return error.stdout.trimEnd();
    }

    throw error;
  }
}

function normalizeStatusPath(rawPath: string): string {
  const normalizedPath = rawPath.includes(' -> ') ? (rawPath.split(' -> ').at(-1) ?? rawPath) : rawPath;
  return normalizedPath.replaceAll('\\', '/');
}

function isGitDiffExitCode(error: unknown): error is ExecFileException & { stdout: string } {
  return (
    error instanceof Error &&
    'code' in error &&
    error.code === 1 &&
    'stdout' in error &&
    typeof error.stdout === 'string'
  );
}
