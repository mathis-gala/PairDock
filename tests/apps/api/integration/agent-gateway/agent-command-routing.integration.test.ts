import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { access, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AGENT_PROTOCOL_VERSION } from '@pairdock/shared-contracts';
import { AgentCommandRouterService } from '../../../../../apps/api/src/agent-gateway/agent-command-router.service.js';
import { AppModule } from '../../../../../apps/api/src/app.module.js';
import { DatabaseClient } from '../../../../../apps/api/src/persistence/client.js';
import { WorktreeService } from '../../../../../packages/local-agent/src/git/worktree.service.js';
import { SessionRunner } from '../../../../../packages/local-agent/src/session/session-runner.js';
import { AgentClient } from '../../../../../packages/local-agent/src/websocket/agent-client.js';

const execFileAsync = promisify(execFile);
const prisma = new DatabaseClient();

let app: INestApplication;
let baseUrl: string;

async function resetDatabase() {
  await prisma.pullRequest.deleteMany();
  await prisma.validationRun.deleteMany();
  await prisma.agentEvent.deleteMany();
  await prisma.message.deleteMany();
  await prisma.sessionMember.deleteMany();
  await prisma.session.deleteMany();
  await prisma.project.deleteMany();
  await prisma.sourceControlConnection.deleteMany();
  await prisma.externalIdentity.deleteMany();
  await prisma.user.deleteMany();
}

async function startApplication() {
  app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0);
  const address = app.getHttpServer().address();

  if (!address || typeof address === 'string') {
    throw new Error('Expected HTTP server to bind to an ephemeral port.');
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
}

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

async function waitFor<T>(producer: () => Promise<T | null>, errorMessage: string): Promise<T> {
  const maxAttempts = 40;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const value = await producer();

    if (value !== null) {
      return value;
    }

    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  throw new Error(errorMessage);
}

test.before(async () => {
  await prisma.$connect();
  await startApplication();
});

test.after(async () => {
  await app.close();
  await prisma.$disconnect();
});

test.beforeEach(async () => {
  await resetDatabase();
});

test('Task 7: backend command routing reaches the local agent for prepare and cleanup', async () => {
  const repositoryPath = await createTempRepository();
  const managedRoot = await createManagedWorktreeRoot();
  const sessionId = randomUUID();
  const branchName = `pairdock/session-${sessionId.slice(0, 8)}`;
  const worktreePath = join(managedRoot, sessionId);
  const ownerUserId = randomUUID();

  const user = await prisma.user.create({
    data: {
      id: ownerUserId,
      email: `dev-${ownerUserId}@pairdock.test`,
      kind: 'developer',
    },
  });

  const connection = await prisma.sourceControlConnection.create({
    data: {
      ownerUserId: user.id,
      providerConnectionId: `gh-install-${randomUUID()}`,
      accountLogin: 'pairdock-owner',
    },
  });

  const project = await prisma.project.create({
    data: {
      ownerUserId: user.id,
      sourceControlConnectionId: connection.id,
      name: 'PairDock',
      repoFullName: 'mathis/pairdock',
      defaultBranch: 'main',
      agentProjectKey: 'agent-local-1',
    },
  });

  await prisma.session.create({
    data: {
      id: sessionId,
      projectId: project.id,
      createdByUserId: user.id,
      status: 'CREATED',
      modelId: 'codex-cli/gpt-5.4',
      branchName,
    },
  });

  const client = new AgentClient(
    {
      agentId: 'agent-local-1',
      authToken: 'secret-token',
      backendUrl: baseUrl,
      capabilities: ['session.prepare', 'session.close'],
      projectPaths: {
        pairdock: repositoryPath,
      },
    },
    {
      error() {},
      info() {},
      warn() {},
    },
    {
      sessionRunner: new SessionRunner(
        {
          projectPaths: {
            pairdock: repositoryPath,
          },
        },
        {
          worktreeService: new WorktreeService(managedRoot),
        },
      ),
    },
  );

  const router = app.get(AgentCommandRouterService);

  try {
    await client.start();

    await router.routeToOwningAgent(sessionId, {
      protocolVersion: AGENT_PROTOCOL_VERSION,
      messageId: randomUUID(),
      sessionId,
      sentAt: new Date().toISOString(),
      type: 'session.prepare',
      payload: {
        sessionId,
        projectKey: 'pairdock',
        branchName,
        modelId: 'codex-cli/gpt-5.4',
      },
    });

    const preparedEvent = await waitFor(
      async () =>
        prisma.agentEvent.findFirst({
          where: {
            sessionId,
            type: 'session.progress',
          },
          orderBy: { createdAt: 'desc' },
        }),
      'Expected backend persistence to record session.progress after routing session.prepare.',
    );

    assert.deepEqual(preparedEvent.payload, {
      sessionId,
      status: 'WORKTREE_CREATING',
      message: `Prepared branch ${branchName} in ${worktreePath}.`,
    });
    assert.equal(await execGit(worktreePath, ['branch', '--show-current']), branchName);

    await router.routeToOwningAgent(sessionId, {
      protocolVersion: AGENT_PROTOCOL_VERSION,
      messageId: randomUUID(),
      sessionId,
      sentAt: new Date().toISOString(),
      type: 'session.close',
      payload: {
        sessionId,
        mode: 'delete-local',
      },
    });

    const closedEvent = await waitFor(
      async () =>
        prisma.agentEvent.findFirst({
          where: {
            sessionId,
            type: 'session.closed',
          },
          orderBy: { createdAt: 'desc' },
        }),
      'Expected backend persistence to record session.closed after routing session.close.',
    );

    assert.deepEqual(closedEvent.payload, {
      sessionId,
      cleaned: true,
    });
    await assert.rejects(() => access(worktreePath));
    await assert.rejects(() => execGit(repositoryPath, ['rev-parse', '--verify', `refs/heads/${branchName}`]));
  } finally {
    await client.stop();
  }
});

async function execGit(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd });
  return stdout.trim();
}
