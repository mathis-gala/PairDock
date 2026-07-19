import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  AGENT_PROTOCOL_VERSION,
  type AgentCommandEnvelope,
  agentProtocolMessageEventName,
} from '@pairdock/shared-contracts';
import { io, type Socket } from 'socket.io-client';
import { ConnectedAgentsRegistry } from '../../../../../apps/api/src/agent-gateway/connected-agents.registry.js';
import { AppModule } from '../../../../../apps/api/src/app.module.js';
import { DatabaseClient } from '../../../../../apps/api/src/persistence/client.js';
import {
  authResponseSchema,
  developerProjectListResponseSchema,
  developerProjectResponseSchema,
  parseJsonResponse,
  sharedProjectListResponseSchema,
} from '../test-json.js';

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
      accessToken: `github:${tokenSeed}:dev-${tokenSeed}@pairdock.test:Dev ${tokenSeed}:installation:test-readiness`,
    }),
  });

  return {
    status: response.status,
    body: await parseJsonResponse(response, authResponseSchema),
  };
}

async function authenticatePm(tokenSeed = randomUUID(), teamId = 'pairdock-testers') {
  const response = await fetch(`${baseUrl}/auth/pm/callback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ accessToken: `slack:${tokenSeed}:${teamId}:pm-${tokenSeed}@pairdock.test:PM ${tokenSeed}` }),
  });

  return {
    status: response.status,
    body: await parseJsonResponse(response, authResponseSchema),
  };
}

async function createDeveloperProject(accessToken: string, agentProjectKey = `agent-${randomUUID()}`) {
  app.get(ConnectedAgentsRegistry).register(`setup-${agentProjectKey}`, {
    agentId: agentProjectKey,
    capabilities: ['readiness.check'],
    models: [{ id: 'agent/gpt-5', label: 'GPT-5', provider: 'local-agent' }],
    projects: [
      {
        key: agentProjectKey,
        name: 'Readiness project',
        repoFullName: 'mathis/readiness-project',
        pathAlias: 'readiness-project',
        defaultBranch: 'main',
        models: ['agent/gpt-5'],
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
      name: 'Readiness project',
      description: 'Requires local readiness checks',
      repoFullName: 'mathis/readiness-project',
      defaultBranch: 'main',
      defaultModelId: 'agent/gpt-5',
      defaultReasoningEffort: 'medium',
      agentProjectKey,
      pmCanStartSessions: true,
    }),
  });

  assert.equal(response.status, 201);
  return parseJsonResponse(response, developerProjectResponseSchema);
}

function connectAgentSocket(): Socket {
  return io(`${baseUrl}/agent`, { transports: ['websocket'] });
}

async function waitForAgentCommand(socket: Socket): Promise<AgentCommandEnvelope> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Expected readiness.check command.')), 1000);
    socket.once(
      agentProtocolMessageEventName,
      (payload: AgentCommandEnvelope, acknowledge?: (response: { accepted: boolean }) => void) => {
        clearTimeout(timeout);
        acknowledge?.({ accepted: true });
        resolve(payload);
      },
    );
  });
}

async function announceAgent(socket: Socket, agentId: string) {
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', () => resolve());
    socket.once('connect_error', reject);
    socket.connect();
  });
  socket.emit(agentProtocolMessageEventName, {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: randomUUID(),
    type: 'agent.connected',
    payload: {
      agentId,
      capabilities: ['readiness.check'],
    },
    sentAt: new Date().toISOString(),
  });
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

test('BT-044: developer readiness API exposes failed checks and blocks session start when required checks fail', async () => {
  const developerLogin = await authenticateDeveloper();
  const project = await createDeveloperProject(developerLogin.body.accessToken);

  await prisma.projectReadinessSnapshot.create({
    data: {
      projectId: project.id,
      ok: false,
      checks: [
        {
          key: 'docker',
          status: 'failed',
          required: true,
          message: 'Docker unavailable.',
          remediation: 'Start Docker Desktop and rerun readiness checks.',
        },
        {
          key: 'preview-tunnel',
          status: 'warning',
          required: false,
          message: 'Preview tunnel is optional for this project.',
          remediation: 'Configure a tunnel before sharing previews outside the local network.',
        },
      ],
    },
  });

  const dashboardResponse = await fetch(`${baseUrl}/projects/developer`, {
    headers: { authorization: `Bearer ${developerLogin.body.accessToken}` },
  });

  assert.equal(dashboardResponse.status, 200);
  const developerProjects = await parseJsonResponse(dashboardResponse, developerProjectListResponseSchema);
  assert.equal(developerProjects[0]?.readiness?.ok, false);
  assert.equal(developerProjects[0]?.readiness?.checks[0]?.key, 'docker');
  assert.match(developerProjects[0]?.readiness?.checks[0]?.remediation ?? '', /Start Docker Desktop/);
  assert.equal(developerProjects[0]?.readiness?.checks[1]?.required, false);

  const startResponse = await fetch(`${baseUrl}/sessions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${developerLogin.body.accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ projectId: project.id, modelId: project.defaultModelId, startSource: 'developer' }),
  });

  assert.equal(startResponse.status, 409);
});

test('BT-044: developer can request local readiness checks through the ToolReadinessModule API surface', async () => {
  const developerLogin = await authenticateDeveloper();
  const project = await createDeveloperProject(developerLogin.body.accessToken);
  const agentSocket = connectAgentSocket();

  try {
    await announceAgent(agentSocket, project.agentProjectKey);
    const commandPromise = waitForAgentCommand(agentSocket);

    const response = await fetch(`${baseUrl}/tool-readiness/projects/${project.id}/check`, {
      method: 'POST',
      headers: { authorization: `Bearer ${developerLogin.body.accessToken}` },
    });

    assert.equal(response.status, 202);
    const command = await commandPromise;
    assert.equal(command.type, 'readiness.check');
    assert.equal(command.payload.projectKey, project.agentProjectKey);
  } finally {
    agentSocket.close();
  }
});

test('BT-045: PM shared-project API does not expose developer local readiness diagnostics', async () => {
  const developerLogin = await authenticateDeveloper();
  const pmLogin = await authenticatePm();
  const project = await createDeveloperProject(developerLogin.body.accessToken);

  await fetch(`${baseUrl}/projects/${project.id}/members`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${developerLogin.body.accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ pmEmail: pmLogin.body.user.email }),
  });
  await prisma.projectReadinessSnapshot.create({
    data: {
      projectId: project.id,
      ok: false,
      checks: [
        {
          key: 'repository',
          status: 'failed',
          required: true,
          message: 'Local path /Users/dev/private-project is unavailable.',
          remediation: 'Fix the local repository path in the developer agent config.',
        },
      ],
    },
  });

  const response = await fetch(`${baseUrl}/projects/shared`, {
    headers: { authorization: `Bearer ${pmLogin.body.accessToken}` },
  });

  assert.equal(response.status, 200);
  const payload = await parseJsonResponse(response, sharedProjectListResponseSchema);
  const rawPayload = JSON.stringify(payload);
  assert.equal(payload[0]?.canStartSession, false);
  assert.doesNotMatch(rawPayload, /\/Users\/dev/);
  assert.doesNotMatch(rawPayload, /repository/);
  assert.doesNotMatch(rawPayload, /Docker|Git|agent harness|tunnel/i);
});
