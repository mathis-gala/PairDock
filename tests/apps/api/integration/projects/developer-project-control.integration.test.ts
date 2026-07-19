import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConnectedAgentsRegistry } from '../../../../../apps/api/src/agent-gateway/connected-agents.registry.js';
import { AppModule } from '../../../../../apps/api/src/app.module.js';
import { DatabaseClient } from '../../../../../apps/api/src/persistence/client.js';
import {
  authResponseSchema,
  developerProjectListResponseSchema,
  developerProjectResponseSchema,
  parseJsonResponse,
  sessionCreateResponseSchema,
  sharedProjectListResponseSchema,
} from '../test-json.js';

const prisma = new DatabaseClient();

let app: INestApplication;
let baseUrl: string;
let connectedAgentsRegistry: ConnectedAgentsRegistry;

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
  connectedAgentsRegistry = app.get(ConnectedAgentsRegistry);
  const address = app.getHttpServer().address();

  if (!address || typeof address === 'string') {
    throw new Error('Expected HTTP server to bind to an ephemeral port.');
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
}

async function authenticateDeveloper(tokenSeed: string = randomUUID(), email = `dev-${tokenSeed}@pairdock.test`) {
  const response = await fetch(`${baseUrl}/auth/developer/callback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      accessToken: `github:${tokenSeed}:${email}:Dev ${tokenSeed}:installation:test-gh-install-dev-control`,
    }),
  });

  return {
    status: response.status,
    body: await parseJsonResponse(response, authResponseSchema),
  };
}

async function authenticatePm(
  tokenSeed = randomUUID(),
  teamId = 'pairdock-testers',
  email = `pm-${tokenSeed}@pairdock.test`,
) {
  const response = await fetch(`${baseUrl}/auth/pm/callback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ accessToken: `slack:${tokenSeed}:${teamId}:${email}:PM ${tokenSeed}` }),
  });

  return {
    status: response.status,
    body: await parseJsonResponse(response, authResponseSchema),
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

test('BT-028/BT-029/BT-049: developer creates a project, shares it, starts a modeled session, and closes it', async () => {
  const sharedEmail = `cross-role-${randomUUID()}@pairdock.test`;
  const developerLogin = await authenticateDeveloper('mathis', sharedEmail);
  const pmLogin = await authenticatePm(randomUUID(), 'pairdock-testers', sharedEmail);

  assert.equal(developerLogin.status >= 200 && developerLogin.status < 300, true);
  assert.equal(pmLogin.status >= 200 && pmLogin.status < 300, true);
  registerOnlineAgentProject('local-dev-control', 'agent-model/gpt-5');

  const createProjectResponse = await fetch(`${baseUrl}/projects`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${developerLogin.body.accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Developer control project',
      description: 'Owned by the developer dashboard',
      repoFullName: 'mathis-gala/PairDock',
      defaultBranch: 'main',
      defaultModelId: 'agent-model/gpt-5',
      defaultReasoningEffort: 'low',
      agentProjectKey: 'local-dev-control',
      pmCanStartSessions: true,
    }),
  });

  assert.equal(createProjectResponse.status, 201);
  const createdProject = await parseJsonResponse(createProjectResponse, developerProjectResponseSchema);
  assert.equal(createdProject.name, 'Developer control project');
  assert.equal(createdProject.defaultModelId, 'agent-model/gpt-5');
  assert.equal(createdProject.defaultReasoningEffort, 'low');
  assert.equal(createdProject.sourceControlAccountLogin, 'mathis');
  assert.equal(createdProject.pmMemberCount, 0);
  assert.deepEqual(createdProject.pmMembers, []);
  assert.deepEqual(createdProject.sessions, []);

  const shareResponse = await fetch(`${baseUrl}/projects/${createdProject.id}/members`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${developerLogin.body.accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ pmEmail: pmLogin.body.user.email }),
  });

  assert.equal(shareResponse.status, 201);
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: createdProject.id, userId: pmLogin.body.user.id } },
  });
  assert.equal(membership?.role, 'pm');

  const pmSharedProjectsResponse = await fetch(`${baseUrl}/projects/shared`, {
    headers: { authorization: `Bearer ${pmLogin.body.accessToken}` },
  });
  const pmSharedProjects = await parseJsonResponse(pmSharedProjectsResponse, sharedProjectListResponseSchema);
  assert.equal(pmSharedProjects[0]?.id, createdProject.id);

  const updateDefaultsResponse = await fetch(`${baseUrl}/projects/${createdProject.id}/execution-defaults`, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${developerLogin.body.accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ modelId: 'agent-model/gpt-5', reasoningEffort: 'high' }),
  });
  assert.equal(updateDefaultsResponse.status, 200);
  const updatedProject = await parseJsonResponse(updateDefaultsResponse, developerProjectResponseSchema);
  assert.equal(updatedProject.defaultReasoningEffort, 'high');

  const startSessionResponse = await fetch(`${baseUrl}/sessions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${developerLogin.body.accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      projectId: createdProject.id,
      startSource: 'developer',
    }),
  });

  assert.equal(startSessionResponse.status, 201);
  const createdSession = await parseJsonResponse(startSessionResponse, sessionCreateResponseSchema);
  assert.equal(createdSession.projectId, createdProject.id);
  assert.equal(createdSession.createdByUserId, developerLogin.body.user.id);
  assert.equal(createdSession.modelId, 'agent-model/gpt-5');
  assert.equal(createdSession.reasoningEffort, 'high');

  const developerMembership = await prisma.sessionMember.findUnique({
    where: { sessionId_userId: { sessionId: createdSession.id, userId: developerLogin.body.user.id } },
  });
  assert.equal(developerMembership?.role, 'developer');

  const closeSessionResponse = await fetch(`${baseUrl}/sessions/${createdSession.id}/close`, {
    method: 'POST',
    headers: { authorization: `Bearer ${developerLogin.body.accessToken}` },
  });

  assert.equal(closeSessionResponse.status, 201);
  const closedSession = await parseJsonResponse(closeSessionResponse, sessionCreateResponseSchema);
  assert.equal(closedSession.status, 'CLOSED');

  const dashboardResponse = await fetch(`${baseUrl}/projects/developer`, {
    headers: { authorization: `Bearer ${developerLogin.body.accessToken}` },
  });

  assert.equal(dashboardResponse.status, 200);
  const developerProjects = await parseJsonResponse(dashboardResponse, developerProjectListResponseSchema);
  assert.equal(developerProjects.length, 1);
  assert.equal(developerProjects[0]?.pmMemberCount, 1);
  assert.deepEqual(developerProjects[0]?.pmMembers, [
    {
      email: pmLogin.body.user.email,
      displayName: pmLogin.body.user.displayName,
    },
  ]);
  assert.equal(developerProjects[0]?.sessions[0]?.id, createdSession.id);
  assert.equal(developerProjects[0]?.sessions[0]?.status, 'CLOSED');
});

test('developer project creation derives GitHub App installation from developer identity metadata', async () => {
  const developerLogin = await authenticateDeveloper();
  registerOnlineAgentProject('github-app-project', 'agent-model/gpt-5');

  await prisma.externalIdentity.updateMany({
    where: {
      userId: developerLogin.body.user.id,
      provider: 'github',
    },
    data: {
      metadata: {
        installationId: 'test-98765',
        login: 'mathis-gala',
      },
    },
  });

  const createProjectResponse = await fetch(`${baseUrl}/projects`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${developerLogin.body.accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      name: 'GitHub App project',
      repoFullName: 'mathis-gala/PairDock',
      defaultBranch: 'main',
      defaultModelId: 'agent-model/gpt-5',
      defaultReasoningEffort: 'low',
      agentProjectKey: 'github-app-project',
    }),
  });

  assert.equal(createProjectResponse.status, 201);
  const createdProject = await parseJsonResponse(createProjectResponse, developerProjectResponseSchema);
  const connection = await prisma.sourceControlConnection.findUnique({
    where: {
      id: (await prisma.project.findUniqueOrThrow({ where: { id: createdProject.id } })).sourceControlConnectionId,
    },
  });

  assert.equal(createdProject.sourceControlAccountLogin, 'mathis-gala');
  assert.equal(connection?.providerConnectionId, 'test-98765');
});

function registerOnlineAgentProject(agentProjectKey: string, modelId: string) {
  connectedAgentsRegistry.register(`socket-${agentProjectKey}`, {
    agentId: agentProjectKey,
    capabilities: ['session.prepare', 'agent.prompt', 'preview'],
    models: [
      {
        id: modelId,
        label: 'GPT-5',
        provider: 'local-agent',
        reasoningEfforts: [
          { id: 'low', label: 'Low' },
          { id: 'high', label: 'High' },
        ],
        defaultReasoningEffort: 'low',
      },
    ],
    projects: [
      {
        key: agentProjectKey,
        name: 'PairDock',
        repoFullName: 'mathis-gala/PairDock',
        pathAlias: 'PairDock',
        defaultBranch: 'main',
        models: [modelId],
      },
    ],
  });
}
