import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { access, cp, mkdtemp, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { z } from 'zod';
import { ConnectedAgentsRegistry } from '../../../../apps/api/src/agent-gateway/connected-agents.registry.js';
import { AppModule } from '../../../../apps/api/src/app.module.js';
import { DatabaseClient } from '../../../../apps/api/src/persistence/client.js';
import type { SandboxPort, SandboxRef } from '../../../../packages/local-agent/src/docker/sandbox.port.js';
import { WorktreeService } from '../../../../packages/local-agent/src/git/worktree.service.js';
import type {
  AgentHarnessPort,
  RunPromptInput,
} from '../../../../packages/local-agent/src/harness/agent-harness.port.js';
import { SessionRunner } from '../../../../packages/local-agent/src/session/session-runner.js';
import type { PreviewTunnelPort } from '../../../../packages/local-agent/src/tunnel/preview-tunnel.port.js';
import { AgentClient } from '../../../../packages/local-agent/src/websocket/agent-client.js';
import {
  authResponseSchema,
  developerProjectResponseSchema,
  parseJsonResponse,
  sessionCreateResponseSchema,
  sessionPromptResponseSchema,
  sessionStateResponseSchema,
} from '../integration/test-json.js';

const execFileAsync = promisify(execFile);
const prisma = new DatabaseClient();
const EXAMPLE_REPOSITORY_FIXTURE = resolve(__dirname, '../../../fixtures/mvp-e2e/example-repository');
const reviewRequestResponseSchema = z
  .object({ reviewRequestUrl: z.string(), status: z.literal('draft') })
  .passthrough();

let app: INestApplication;
let baseUrl: string;

async function resetDatabase() {
  await prisma.pullRequest.deleteMany();
  await prisma.validationRun.deleteMany();
  await prisma.agentEvent.deleteMany();
  await prisma.message.deleteMany();
  await prisma.sessionMember.deleteMany();
  await prisma.session.deleteMany();
  await prisma.projectReadinessSnapshot.deleteMany();
  await prisma.projectMember.deleteMany();
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

async function authenticateDeveloper(tokenSeed = randomUUID()) {
  const response = await fetch(`${baseUrl}/auth/developer/callback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      accessToken: `github:${tokenSeed}:dev-${tokenSeed}@pairdock.test:Dev ${tokenSeed}:installation:test-mvp-e2e-installation`,
    }),
  });

  assert.equal(response.status, 200);
  return parseJsonResponse(response, authResponseSchema);
}

async function authenticatePm(email: string, tokenSeed = randomUUID()) {
  const response = await fetch(`${baseUrl}/auth/pm/callback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ accessToken: `slack:${tokenSeed}:pairdock-testers:${email}:PM ${tokenSeed}` }),
  });

  assert.equal(response.status, 200);
  return parseJsonResponse(response, authResponseSchema);
}

async function createDeveloperProject(accessToken: string, agentProjectKey: string) {
  app.get(ConnectedAgentsRegistry).register(`setup-${agentProjectKey}`, {
    agentId: agentProjectKey,
    capabilities: ['session.prepare', 'session.close', 'agent.prompt', 'git.pushBranch'],
    models: [{ id: 'codex-cli/gpt-5.4', label: 'GPT-5.4', provider: 'local-agent' }],
    projects: [
      {
        key: agentProjectKey,
        name: 'MVP E2E Fixture',
        repoFullName: 'pairdock/mvp-e2e-fixture',
        pathAlias: 'example-repository',
        defaultBranch: 'release',
        models: ['codex-cli/gpt-5.4'],
      },
    ],
  });
  const response = await fetch(`${baseUrl}/projects`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      name: 'MVP E2E Fixture',
      description: 'Hermetic test repository for the PairDock MVP critical path.',
      repoFullName: 'pairdock/mvp-e2e-fixture',
      defaultBranch: 'release',
      defaultModelId: 'codex-cli/gpt-5.4',
      defaultReasoningEffort: 'medium',
      agentProjectKey,
      pmCanStartSessions: true,
    }),
  });

  if (response.status !== 201) {
    throw new Error(`Expected project creation to return 201, received ${response.status}: ${await response.text()}`);
  }
  return parseJsonResponse(response, developerProjectResponseSchema);
}

async function shareProjectWithPm(accessToken: string, projectId: string, pmEmail: string) {
  const response = await fetch(`${baseUrl}/projects/${projectId}/members`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ pmEmail }),
  });

  assert.equal(response.status, 201);
}

async function createSession(accessToken: string, projectId: string, modelId: string) {
  const response = await fetch(`${baseUrl}/sessions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ projectId, modelId }),
  });

  assert.equal(response.status, 201);
  return parseJsonResponse(response, sessionCreateResponseSchema);
}

async function sendPrompt(accessToken: string, sessionId: string) {
  const response = await fetch(`${baseUrl}/sessions/${sessionId}/prompts`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ content: 'Add the MVP E2E fixture change.' }),
  });

  assert.equal(response.status, 201);
  return parseJsonResponse(response, sessionPromptResponseSchema);
}

async function createReviewRequest(accessToken: string, sessionId: string) {
  const response = await fetch(`${baseUrl}/sessions/${sessionId}/review-request`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      type: 'feat',
      title: 'Complete the PairDock MVP flow',
      description: 'Creates the tested PairDock MVP draft review request.',
    }),
  });

  assert.equal(response.status, 201);
  return parseJsonResponse(response, reviewRequestResponseSchema);
}

async function closeSession(accessToken: string, sessionId: string) {
  const response = await fetch(`${baseUrl}/sessions/${sessionId}/close`, {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}` },
  });

  assert.equal(response.status, 201);
  return parseJsonResponse(response, sessionStateResponseSchema);
}

async function waitFor<T>(producer: () => Promise<T | null>, errorMessage: string): Promise<T> {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const value = await producer();

    if (value !== null) {
      return value;
    }

    await delay(50);
  }

  throw new Error(errorMessage);
}

async function waitForSessionStatus(sessionId: string, status: string) {
  return waitFor(async () => {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    return session?.status === status ? session : null;
  }, `Expected session ${sessionId} to reach ${status}.`);
}

async function createTestRepository() {
  const root = await mkdtemp(join(tmpdir(), 'pairdock-mvp-e2e-'));
  const repositoryPath = join(root, 'example-repository');
  const remotePath = join(root, 'remote.git');

  await cp(EXAMPLE_REPOSITORY_FIXTURE, repositoryPath, { recursive: true });
  await execGit(root, ['init', '--bare', '--initial-branch=main', remotePath]);
  await execGit(repositoryPath, ['init', '--initial-branch=main']);
  await execGit(repositoryPath, ['config', 'user.name', 'PairDock E2E']);
  await execGit(repositoryPath, ['config', 'user.email', 'pairdock-e2e@example.test']);
  await execGit(repositoryPath, ['add', '.']);
  await execGit(repositoryPath, ['commit', '-m', 'initial fixture']);
  await execGit(repositoryPath, ['remote', 'add', 'origin', remotePath]);
  await execGit(repositoryPath, ['push', '--set-upstream', 'origin', 'main']);
  await execGit(repositoryPath, ['switch', '-c', 'release']);
  await writeFile(join(repositoryPath, 'release-base.txt'), 'release base');
  await execGit(repositoryPath, ['add', 'release-base.txt']);
  await execGit(repositoryPath, ['commit', '-m', 'release base']);
  const releaseCommit = await execGit(repositoryPath, ['rev-parse', 'HEAD']);
  await execGit(repositoryPath, ['push', '--set-upstream', 'origin', 'release']);
  await execGit(repositoryPath, ['switch', 'main']);

  return { releaseCommit, remotePath, repositoryPath, root };
}

async function startPreviewServer() {
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/plain' });
    response.end('pairdock preview ready');
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Expected preview server to bind to an ephemeral port.');
  }

  return {
    server,
    url: `http://127.0.0.1:${address.port}`,
  };
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

test('BT-033: full MVP flow starts a session, runs a PM prompt, creates a draft review request, and closes with local cleanup', async () => {
  const developerLogin = await authenticateDeveloper();
  const pmEmail = `pm-${randomUUID()}@pairdock.test`;
  const agentProjectKey = `agent-${randomUUID()}`;
  const project = await createDeveloperProject(developerLogin.accessToken, agentProjectKey);
  await shareProjectWithPm(developerLogin.accessToken, project.id, pmEmail);
  const pmLogin = await authenticatePm(pmEmail);
  const preview = await startPreviewServer();
  const repository = await createTestRepository();
  const managedRoot = await mkdtemp(join(tmpdir(), 'pairdock-mvp-worktrees-'));
  const sandboxPort = new ReadySandboxPort(preview.url);
  const previewTunnelPort = new ReadyPreviewTunnelPort(preview.url);
  const agentClient = new AgentClient(
    {
      agentId: project.agentProjectKey,
      authToken: 'test-agent-token',
      backendUrl: baseUrl,
      capabilities: ['session.prepare', 'session.close', 'agent.prompt', 'git.pushBranch'],
      models: [{ id: project.defaultModelId, label: 'GPT-5.4', provider: 'local-agent' }],
      projects: [
        {
          key: project.agentProjectKey,
          name: project.name,
          repoFullName: project.repoFullName,
          pathAlias: 'example-repository',
          defaultBranch: project.defaultBranch,
          models: [project.defaultModelId],
        },
      ],
      projectPaths: {
        [project.agentProjectKey]: repository.repositoryPath,
      },
      checksConfigs: {
        [project.agentProjectKey]: {
          build: 'node scripts/pass-check.mjs build',
          test: 'node scripts/pass-check.mjs test',
          lint: 'node scripts/pass-check.mjs lint',
        },
      },
    },
    {
      error() {},
      info() {},
      warn() {},
    },
    {
      agentHarnessPort: new SimulatedAgentHarness(),
      sessionRunner: new SessionRunner(
        {
          projectPaths: {
            [project.agentProjectKey]: repository.repositoryPath,
          },
        },
        {
          worktreeService: new WorktreeService(managedRoot),
          sandboxPort,
          previewTunnelPort,
        },
      ),
    },
  );

  try {
    await agentClient.start();
    const registry = app.get(ConnectedAgentsRegistry);
    await waitFor(
      async () => registry.findSocketId(project.agentProjectKey),
      'Expected the local agent to be registered before the session starts.',
    );

    const createdSession = await createSession(developerLogin.accessToken, project.id, project.defaultModelId);
    const readySession = await waitForSessionStatus(createdSession.id, 'READY');
    const worktreePath = join(managedRoot, createdSession.id);

    assert.equal(readySession.previewUrl, preview.url);
    assert.equal(await execGit(worktreePath, ['branch', '--show-current']), readySession.branchName);
    assert.equal(await execGit(worktreePath, ['rev-parse', 'HEAD']), repository.releaseCommit);

    const prompt = await sendPrompt(pmLogin.accessToken, createdSession.id);
    assert.equal(prompt.role, 'pm');
    await waitForSessionStatus(createdSession.id, 'AWAITING_PM_VALIDATION');

    const changedFile = join(worktreePath, 'src', 'pairdock-generated-change.txt');
    await access(changedFile);

    const validation = await prisma.validationRun.findFirst({ where: { sessionId: createdSession.id } });
    assert.equal(validation?.status, 'passed');
    assert.equal(validation?.buildStatus, 'passed');
    assert.equal(validation?.testStatus, 'passed');
    assert.equal(validation?.lintStatus, 'passed');
    assert.equal(validation?.previewStatus, 'passed');

    const reviewRequest = await createReviewRequest(pmLogin.accessToken, createdSession.id);
    assert.match(reviewRequest.reviewRequestUrl, /^https:\/\/github\.test\/pairdock\/mvp-e2e-fixture\/pull\/\d+$/);
    await waitFor(async () => {
      const event = await prisma.agentEvent.findFirst({
        where: { sessionId: createdSession.id, type: 'git.branchPushed' },
      });
      return event ? true : null;
    }, 'Expected the local agent to push the session branch before review completion.');
    await execGit(repository.remotePath, ['rev-parse', '--verify', `refs/heads/${readySession.branchName}`]);

    const persistedReviewRequest = await prisma.pullRequest.findFirst({ where: { sessionId: createdSession.id } });
    assert.equal(persistedReviewRequest?.githubPrUrl, reviewRequest.reviewRequestUrl);

    const closedSession = await closeSession(developerLogin.accessToken, createdSession.id);
    assert.equal(closedSession.status, 'CLOSED');
    assert.ok(closedSession.closedAt);
    await waitFor(async () => {
      try {
        await access(worktreePath);
        return null;
      } catch {
        return true;
      }
    }, 'Expected the local worktree to be removed when the developer closes the session.');
    assert.deepEqual(sandboxPort.stoppedSessionIds, [createdSession.id]);
    assert.deepEqual(previewTunnelPort.closedSessionIds, [createdSession.id]);
  } finally {
    await agentClient.stop();
    await new Promise<void>((resolve, reject) => {
      preview.server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

class SimulatedAgentHarness implements AgentHarnessPort {
  async *runPrompt(input: RunPromptInput) {
    await writeFile(join(input.worktreePath, 'src', 'pairdock-generated-change.txt'), `${input.prompt}\n`);
    yield {
      type: 'output' as const,
      stream: 'stdout' as const,
      text: `applied:${input.prompt}\n`,
    };
    yield {
      type: 'done' as const,
      exitCode: 0,
    };
  }

  async cancel(): Promise<void> {}
}

class ReadySandboxPort implements SandboxPort {
  readonly stoppedSessionIds: string[] = [];

  constructor(private readonly previewUrl: string) {}

  async start(input: { sessionId: string }): Promise<SandboxRef> {
    return {
      id: `sandbox-${input.sessionId}`,
      sessionId: input.sessionId,
      healthcheckUrl: this.previewUrl,
    };
  }

  async stop(ref: SandboxRef): Promise<void> {
    this.stoppedSessionIds.push(ref.sessionId);
  }

  async check(ref: SandboxRef) {
    return {
      ready: true,
      url: ref.healthcheckUrl,
    };
  }
}

class ReadyPreviewTunnelPort implements PreviewTunnelPort {
  readonly closedSessionIds: string[] = [];

  constructor(private readonly previewUrl: string) {}

  async open(input: { sessionId: string }) {
    return {
      id: `tunnel-${input.sessionId}`,
      sessionId: input.sessionId,
      publicUrl: this.previewUrl,
    };
  }

  async close(ref: { sessionId: string }): Promise<void> {
    this.closedSessionIds.push(ref.sessionId);
  }
}

async function execGit(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd });
  return stdout.trim();
}
