import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { MAX_DIFF_LENGTH } from '@pairdock/shared-contracts';
import { DiffService } from '../../../../packages/local-agent/src/git/diff.service.js';
import { buildGitDiffEvent } from '../../../../packages/local-agent/src/websocket/message-codecs.js';

const execFileAsync = promisify(execFile);

test('DiffService collects a bounded diff when an untracked file exceeds the Node exec buffer', async () => {
  const repositoryPath = await createRepository();
  const largeFileContent = 'generated graph data\n'.repeat(100_000);
  await writeFile(join(repositoryPath, 'large-generated-file.json'), largeFileContent);

  const diff = await new DiffService().collect(repositoryPath);

  assert.deepEqual(diff.changedFiles, ['large-generated-file.json']);
  assert.match(diff.diff, /\[PAIRDOCK_TRUNCATED\]/);
  assert.ok(diff.diff.length <= MAX_DIFF_LENGTH);
  assert.match(diff.fingerprint, /^[a-f\d]{64}$/);
  assert.doesNotThrow(() =>
    buildGitDiffEvent({
      sessionId: '12121212-1212-4212-8212-121212121212',
      diff: diff.diff,
      changedFiles: diff.changedFiles,
    }),
  );
});

test('DiffService snapshots detect changes beyond the rendered diff limit', async () => {
  const repositoryPath = await createRepository();
  const largeFilePath = join(repositoryPath, 'large-generated-file.json');
  const unchangedPrefix = 'generated graph data\n'.repeat(100_000);
  const service = new DiffService();
  await writeFile(largeFilePath, `${unchangedPrefix}first ending\n`);

  const initialSnapshot = await service.snapshot(repositoryPath);
  await writeFile(largeFilePath, `${unchangedPrefix}second ending\n`);
  const updatedSnapshot = await service.snapshot(repositoryPath);

  assert.deepEqual(initialSnapshot.changedFiles, ['large-generated-file.json']);
  assert.notEqual(initialSnapshot.fingerprint, updatedSnapshot.fingerprint);
});

async function createRepository(): Promise<string> {
  const repositoryPath = await mkdtemp(join(tmpdir(), 'pairdock-diff-service-'));
  await execFileAsync('git', ['init', '--quiet'], { cwd: repositoryPath });
  await execFileAsync('git', ['config', 'user.email', 'pairdock@example.test'], { cwd: repositoryPath });
  await execFileAsync('git', ['config', 'user.name', 'PairDock Test'], { cwd: repositoryPath });
  await writeFile(join(repositoryPath, 'README.md'), '# PairDock\n');
  await execFileAsync('git', ['add', 'README.md'], { cwd: repositoryPath });
  await execFileAsync('git', ['commit', '--quiet', '-m', 'Initial commit'], { cwd: repositoryPath });
  return repositoryPath;
}
