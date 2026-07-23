import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { MAX_DIFF_LENGTH } from '@pairdock/shared-contracts';
import { SensitiveFilesPolicy } from './sensitive-files.policy.js';

const sensitiveFileMarker = '[PAIRDOCK_REDACTED]';
const truncatedDiffMarker = '[PAIRDOCK_TRUNCATED]';
const maxDiffSectionBytes = 64 * 1024;
const maxRenderedDiffBytes = MAX_DIFF_LENGTH;
const maxGitMetadataBytes = 8 * 1024 * 1024;
const maxGitErrorBytes = 64 * 1024;

interface ChangedFile {
  path: string;
  statusCode: string;
}

export interface CollectedDiff {
  diff: string;
  changedFiles: string[];
  fingerprint: string;
}

export type DiffSnapshot = Omit<CollectedDiff, 'diff'>;

export class DiffService {
  constructor(private readonly sensitiveFilesPolicy = new SensitiveFilesPolicy()) {}

  async snapshot(worktreePath: string): Promise<DiffSnapshot> {
    const changedFiles = await this.listChangedFiles(worktreePath);
    return this.createSnapshot(worktreePath, changedFiles);
  }

  async collect(worktreePath: string): Promise<CollectedDiff> {
    const changedFiles = await this.listChangedFiles(worktreePath);

    if (changedFiles.length === 0) {
      return { diff: '', changedFiles: [], fingerprint: createHash('sha256').digest('hex') };
    }

    const sections: string[] = [];
    const snapshot = await this.createSnapshot(worktreePath, changedFiles);

    for (const file of changedFiles) {
      const isSensitive = this.sensitiveFilesPolicy.isSensitive(file.path);

      if (isSensitive) {
        sections.push(`${sensitiveFileMarker} Sensitive file omitted: ${file.path}`);
        continue;
      }

      const section = await this.renderDiffSection(worktreePath, file);
      if (section.stdout) {
        sections.push(
          section.truncated
            ? `${section.stdout.trim()}\n${truncatedDiffMarker} Diff truncated for ${file.path}.`
            : section.stdout.trim(),
        );
      }
    }

    return {
      diff: boundRenderedDiff(sections.join('\n\n').trim()),
      ...snapshot,
    };
  }

  private async createSnapshot(worktreePath: string, changedFiles: ChangedFile[]): Promise<DiffSnapshot> {
    const fingerprint = createHash('sha256');

    for (const file of changedFiles) {
      const fileFingerprint = await this.renderFileFingerprint(worktreePath, file.path);
      fingerprint.update(file.statusCode);
      fingerprint.update('\0');
      fingerprint.update(file.path);
      fingerprint.update('\0');
      fingerprint.update(fileFingerprint);
      fingerprint.update('\0');
    }

    return {
      changedFiles: changedFiles.map((file) => file.path),
      fingerprint: fingerprint.digest('hex'),
    };
  }

  private async listChangedFiles(worktreePath: string): Promise<ChangedFile[]> {
    const statusOutput = await execGitText(worktreePath, ['status', '--porcelain=v1', '--untracked-files=all']);

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

  private async renderDiffSection(worktreePath: string, file: ChangedFile): Promise<GitOutput> {
    if (file.statusCode === '??') {
      return this.renderUntrackedFileDiff(worktreePath, file.path);
    }

    return runGit(worktreePath, ['diff', '--no-ext-diff', '--relative', 'HEAD', '--', file.path], {
      maxStdoutBytes: maxDiffSectionBytes,
    });
  }

  private async renderFileFingerprint(worktreePath: string, relativePath: string): Promise<string> {
    try {
      await access(join(worktreePath, relativePath));
    } catch {
      return 'missing';
    }

    return execGitText(worktreePath, ['hash-object', '--', relativePath]);
  }

  private async renderUntrackedFileDiff(worktreePath: string, relativePath: string): Promise<GitOutput> {
    const absolutePath = join(worktreePath, relativePath);

    try {
      await access(absolutePath);
    } catch {
      return { stdout: `Added path ${relativePath}`, truncated: false };
    }

    return runGit(worktreePath, ['diff', '--no-ext-diff', '--no-index', '--', '/dev/null', relativePath], {
      allowedExitCodes: [0, 1],
      maxStdoutBytes: maxDiffSectionBytes,
    });
  }
}

interface GitOutput {
  stdout: string;
  truncated: boolean;
}

interface RunGitOptions {
  allowedExitCodes?: number[];
  maxStdoutBytes?: number;
}

async function execGitText(cwd: string, args: string[]): Promise<string> {
  const result = await runGit(cwd, args, { maxStdoutBytes: maxGitMetadataBytes });

  if (result.truncated) {
    throw new Error(`Git output exceeded ${maxGitMetadataBytes} bytes for: git ${args.join(' ')}`);
  }

  return result.stdout.trimEnd();
}

function runGit(cwd: string, args: string[], options: RunGitOptions = {}): Promise<GitOutput> {
  const allowedExitCodes = options.allowedExitCodes ?? [0];
  const maxStdoutBytes = options.maxStdoutBytes ?? maxGitMetadataBytes;

  return new Promise((resolve, reject) => {
    const child = spawn('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let stdoutTruncated = false;

    child.stdout.on('data', (chunk: Buffer) => {
      const remainingBytes = maxStdoutBytes - stdoutBytes;
      if (remainingBytes <= 0) {
        stdoutTruncated = true;
        return;
      }

      const collectedChunk = chunk.byteLength > remainingBytes ? chunk.subarray(0, remainingBytes) : chunk;
      stdoutChunks.push(collectedChunk);
      stdoutBytes += collectedChunk.byteLength;
      stdoutTruncated ||= collectedChunk.byteLength < chunk.byteLength;
    });
    child.stderr.on('data', (chunk: Buffer) => {
      const remainingBytes = maxGitErrorBytes - stderrBytes;
      if (remainingBytes <= 0) {
        return;
      }

      const collectedChunk = chunk.byteLength > remainingBytes ? chunk.subarray(0, remainingBytes) : chunk;
      stderrChunks.push(collectedChunk);
      stderrBytes += collectedChunk.byteLength;
    });
    child.once('error', reject);
    child.once('close', (exitCode) => {
      const normalizedExitCode = exitCode ?? -1;
      const stdout = Buffer.concat(stdoutChunks).toString('utf8').trimEnd();

      if (!allowedExitCodes.includes(normalizedExitCode)) {
        const stderr = Buffer.concat(stderrChunks).toString('utf8').trim();
        reject(new Error(stderr || `git ${args.join(' ')} exited with code ${normalizedExitCode}.`));
        return;
      }

      resolve({ stdout, truncated: stdoutTruncated });
    });
  });
}

function normalizeStatusPath(rawPath: string): string {
  const normalizedPath = rawPath.includes(' -> ') ? (rawPath.split(' -> ').at(-1) ?? rawPath) : rawPath;
  return normalizedPath.replaceAll('\\', '/');
}

function boundRenderedDiff(diff: string): string {
  const diffBuffer = Buffer.from(diff, 'utf8');
  if (diffBuffer.byteLength <= maxRenderedDiffBytes) {
    return diff;
  }

  const marker = `\n${truncatedDiffMarker} Remaining diff omitted.`;
  const markerBytes = Buffer.byteLength(marker, 'utf8');
  return `${diffBuffer
    .subarray(0, maxRenderedDiffBytes - markerBytes)
    .toString('utf8')
    .trimEnd()}${marker}`;
}
