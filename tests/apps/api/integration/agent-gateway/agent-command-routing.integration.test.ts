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
import type { SandboxPort, SandboxRef } from '../../../../../packages/local-agent/src/docker/sandbox.port.js';
import { WorktreeService } from '../../../../../packages/local-agent/src/git/worktree.service.js';
import { SessionRunner } from '../../../../../packages/local-agent/src/session/session-runner.js';
import type { PreviewTunnelPort } from '../../../../../packages/local-agent/src/tunnel/preview-tunnel.port.js';
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

test('Task 8: backend command routing persists preview progress, preview URL, and cleanup events', async () => {
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
          sandboxPort: new ReadySandboxPort(),
          previewTunnelPort: new ReadyPreviewTunnelPort(),
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

    const readyEvent = await waitFor(
      async () =>
        prisma.agentEvent.findFirst({
          where: {
            sessionId,
            type: 'session.ready',
          },
          orderBy: { createdAt: 'desc' },
        }),
      'Expected backend persistence to record session.ready after routing session.prepare.',
    );

    const progressEvents = await prisma.agentEvent.findMany({
      where: {
        sessionId,
        type: 'session.progress',
      },
      orderBy: { createdAt: 'asc' },
    });
    const preparedSession = await prisma.session.findUnique({ where: { id: sessionId } });

    assert.deepEqual(
      progressEvents.map((event) => event.payload),
      [
        { sessionId, status: 'AGENT_CONNECTING' },
        { sessionId, status: 'WORKTREE_CREATING' },
        { sessionId, status: 'DOCKER_STARTING' },
        { sessionId, status: 'PREVIEW_STARTING' },
      ],
    );
    assert.deepEqual(readyEvent.payload, {
      sessionId,
      previewUrl: 'https://preview.pairdock.test',
    });
    assert.equal(preparedSession?.status, 'READY');
    assert.equal(preparedSession?.previewUrl, 'https://preview.pairdock.test');
    assert.equal(await execGit(worktreePath, ['branch', '--show-current']), branchName);

    await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'CLOSING' },
    });

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

class ReadySandboxPort implements SandboxPort {
  async start(input: { sessionId: string }): Promise<SandboxRef> {
    return {
      id: `sandbox-${input.sessionId}`,
      sessionId: input.sessionId,
      healthcheckUrl: 'http://127.0.0.1:3100/health',
    };
  }

  async stop(): Promise<void> {}

  async check(ref: SandboxRef) {
    return {
      ready: true,
      url: ref.healthcheckUrl,
    };
  }
}

class ReadyPreviewTunnelPort implements PreviewTunnelPort {
  async open(input: { sessionId: string }) {
    return {
      id: `tunnel-${input.sessionId}`,
      sessionId: input.sessionId,
      publicUrl: 'https://preview.pairdock.test',
    };
  }

  async close(): Promise<void> {}
}

async function execGit(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd });
  return stdout.trim();
}
