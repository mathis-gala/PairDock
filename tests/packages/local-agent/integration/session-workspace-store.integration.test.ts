import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { FileSessionWorkspaceStore } from '../../../../packages/local-agent/src/session/file-session-workspace.store.js';

test('FileSessionWorkspaceStore writes atomic private state without preview environment secrets', async () => {
  const stateRoot = await mkdtemp(join(tmpdir(), 'pairdock-session-store-'));
  const statePath = join(stateRoot, 'sessions.json');
  const store = new FileSessionWorkspaceStore(statePath);
  const sessionId = '70707070-7070-4070-8070-707070707070';

  await store.save([
    {
      sessionId,
      projectKey: 'pairdock',
      repositoryPath: '/tmp/pairdock-repository',
      worktreePath: `/tmp/pairdock-worktrees/${sessionId}`,
      branchName: 'pairdock/session-7070',
      sandboxRef: {
        id: `sandbox-${sessionId}`,
        sessionId,
        healthcheckUrl: 'http://127.0.0.1:4000',
        previewConfig: {
          sandbox: {
            startCommand: 'bun run dev',
            healthcheckUrl: 'http://127.0.0.1:4000',
            env: { DATABASE_URL: 'postgresql://secret-value' },
          },
        },
        metadata: { containerName: 'pairdock-7070' },
      },
      tunnelRef: {
        id: `tunnel-${sessionId}`,
        sessionId,
        publicUrl: 'https://preview.pairdock.test',
        metadata: { containerName: 'pairdock-tunnel-7070' },
      },
      previewUrl: 'https://preview.pairdock.test',
    },
  ]);

  const rawState = await readFile(statePath, 'utf8');
  const stateMode = (await stat(statePath)).mode & 0o777;
  const [restoredWorkspace] = await store.load();

  assert.doesNotMatch(rawState, /secret-value|DATABASE_URL/);
  assert.equal(stateMode, 0o600);
  assert.equal(restoredWorkspace?.sandboxRef?.previewConfig, undefined);
  assert.equal(restoredWorkspace?.sandboxRef?.metadata?.containerName, 'pairdock-7070');
});
