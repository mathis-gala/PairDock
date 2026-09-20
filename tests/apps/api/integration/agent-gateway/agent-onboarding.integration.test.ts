import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  AGENT_PROTOCOL_VERSION,
  type AgentEventEnvelope,
  agentPairingClaimSchema,
  agentPairingStartedSchema,
  agentProtocolMessageEventName,
  developerAgentsSchema,
  developerProjectSetupSchema,
} from '@pairdock/shared-contracts';
import { io, type Socket } from 'socket.io-client';
import { AppModule } from '../../../../../apps/api/src/app.module.js';
import { DatabaseClient } from '../../../../../apps/api/src/persistence/client.js';
import { authResponseSchema, developerProjectResponseSchema, parseJsonResponse } from '../test-json.js';

let app: INestApplication | undefined;
let baseUrl: string;

test.before(async () => {
  app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0);
  const address = app.getHttpServer().address();

  if (!address || typeof address === 'string') {
    throw new Error('Expected HTTP server to bind to an ephemeral port.');
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  await app?.close();
});

test('developer approval pairs a waiting device and its credential connects the agent', {
  timeout: 10_000,
}, async () => {
  const login = await authenticateDeveloper();
  const pairingResponse = await postJson('/agent-pairings', { deviceName: 'Developer laptop' });
  assert.equal(pairingResponse.status, 201);
  assert.equal(pairingResponse.headers.get('cache-control'), 'no-store');
  const pairing = await parseJsonResponse(pairingResponse, agentPairingStartedSchema);

  const pendingResponse = await postJson('/agent-pairings/claim', { deviceCode: pairing.deviceCode });
  assert.equal(pendingResponse.ok, true);
  assert.deepEqual(await pendingResponse.json(), { status: 'pending' });

  const detailResponse = await fetch(`${baseUrl}/developer/agent-pairings/${pairing.userCode}`, {
    headers: { authorization: `Bearer ${login.accessToken}` },
  });
  assert.equal(detailResponse.status, 200);
  assert.deepEqual(await detailResponse.json(), {
    deviceName: 'Developer laptop',
    userCode: pairing.userCode,
    expiresAt: pairing.expiresAt,
  });

  const approvalResponse = await postJson(
    '/developer/agent-pairings/approve',
    { userCode: pairing.userCode },
    login.accessToken,
  );
  assert.equal(approvalResponse.ok, true);
  assert.deepEqual(await approvalResponse.json(), { approved: true });

  const claimResponse = await postJson('/agent-pairings/claim', { deviceCode: pairing.deviceCode });
  assert.equal(claimResponse.ok, true);
  assert.equal(claimResponse.headers.get('cache-control'), 'no-store');
  const paired = await parseJsonResponse(claimResponse, agentPairingClaimSchema);
  assert.equal(paired.status, 'paired');
  if (paired.status !== 'paired') {
    assert.fail('Expected developer approval to release an agent credential.');
  }
  assert.ok(paired.authToken.length >= 32);
  assert.equal(paired.ownerName, login.user.displayName);

  const socket = connectAgent(paired.authToken);

  try {
    await waitForConnect(socket);
    await publishProject(socket, paired.agentId, `${paired.projectKeyPrefix}repo`);

    const agentsResponse = await fetch(`${baseUrl}/developer/agents`, {
      headers: { authorization: `Bearer ${login.accessToken}` },
    });
    assert.equal(agentsResponse.status, 200);
    const agents = await parseJsonResponse(agentsResponse, developerAgentsSchema);
    assert.equal(agents.length, 1);
    assert.equal(agents[0]?.agentId, paired.agentId);
    assert.equal(agents[0]?.connected, true);
    assert.equal(agents[0]?.revokedAt, null);

    const replayResponse = await postJson('/agent-pairings/claim', { deviceCode: pairing.deviceCode });
    assert.equal(replayResponse.ok, false);
  } finally {
    socket.close();
  }
});

test('developers sharing repository access cannot use or revoke each other’s paired agents', {
  timeout: 10_000,
}, async () => {
  const owner = await authenticateDeveloper();
  const otherDeveloper = await authenticateDeveloper();
  const paired = await pairAgent(owner.accessToken);
  const agentProjectKey = `${paired.projectKeyPrefix}repo`;
  const socket = connectAgent(paired.authToken);

  try {
    await waitForConnect(socket);
    await publishProject(socket, paired.agentId, agentProjectKey);

    const ownerSetup = await parseJsonResponse(
      await fetch(`${baseUrl}/projects/developer/setup`, {
        headers: { authorization: `Bearer ${owner.accessToken}` },
      }),
      developerProjectSetupSchema,
    );
    const otherSetup = await parseJsonResponse(
      await fetch(`${baseUrl}/projects/developer/setup`, {
        headers: { authorization: `Bearer ${otherDeveloper.accessToken}` },
      }),
      developerProjectSetupSchema,
    );
    assert.ok(otherSetup.repositories.some((repository) => repository.fullName === 'mathis-gala/PairDock'));
    assert.deepEqual(
      ownerSetup.agents.map((agent) => agent.agentId),
      [paired.agentId],
    );
    assert.deepEqual(otherSetup.agents, []);

    const otherAgents = await fetch(`${baseUrl}/developer/agents`, {
      headers: { authorization: `Bearer ${otherDeveloper.accessToken}` },
    });
    assert.deepEqual(await parseJsonResponse(otherAgents, developerAgentsSchema), []);

    const projectInput = {
      name: 'Owner-scoped project',
      repoFullName: 'mathis-gala/PairDock',
      defaultBranch: 'main',
      defaultModelId: 'local/gpt-5',
      defaultReasoningEffort: 'medium',
      agentProjectKey,
    };
    const forbiddenCreate = await postJson('/projects', projectInput, otherDeveloper.accessToken);
    assert.equal(forbiddenCreate.status, 403);

    const ownerCreate = await postJson('/projects', projectInput, owner.accessToken);
    assert.equal(ownerCreate.status, 201);
    const project = await parseJsonResponse(ownerCreate, developerProjectResponseSchema);
    assert.equal(project.agentProjectKey, agentProjectKey);

    const forbiddenRevoke = await fetch(`${baseUrl}/developer/agents/${paired.agentId}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${otherDeveloper.accessToken}` },
    });
    assert.equal(forbiddenRevoke.status, 404);
    assert.equal(socket.connected, true);

    const disconnected = new Promise<void>((resolve) => socket.once('disconnect', () => resolve()));
    const ownerRevoke = await fetch(`${baseUrl}/developer/agents/${paired.agentId}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${owner.accessToken}` },
    });
    assert.equal(ownerRevoke.status, 200);
    assert.deepEqual(await ownerRevoke.json(), { revoked: true });
    await disconnected;
    assert.equal(socket.connected, false);

    const revokedAgents = await parseJsonResponse(
      await fetch(`${baseUrl}/developer/agents`, {
        headers: { authorization: `Bearer ${owner.accessToken}` },
      }),
      developerAgentsSchema,
    );
    assert.equal(revokedAgents[0]?.connected, false);
    assert.ok(revokedAgents[0]?.revokedAt);

    const reconnect = connectAgent(paired.authToken);
    try {
      await assert.rejects(waitForConnect(reconnect), /Unauthorized agent/);
    } finally {
      reconnect.close();
    }
  } finally {
    socket.close();
  }
});

test('concurrent approvals and claims bind one owner and release only one credential', async () => {
  const developers = [await authenticateDeveloper(), await authenticateDeveloper()];
  const start = await postJson('/agent-pairings', { deviceName: 'Contested laptop' });
  assert.equal(start.status, 201);
  const pairing = await parseJsonResponse(start, agentPairingStartedSchema);

  const approvals = await Promise.all(
    developers.map((developer) =>
      postJson('/developer/agent-pairings/approve', { userCode: pairing.userCode }, developer.accessToken),
    ),
  );
  assert.equal(approvals.filter((response) => response.ok).length, 1);
  const ownerIndex = approvals.findIndex((response) => response.ok);
  const rejectedApproval = approvals.find((response) => !response.ok);
  assert.ok(rejectedApproval);
  assert.ok([404, 409].includes(rejectedApproval.status));

  const claims = await Promise.all([
    postJson('/agent-pairings/claim', { deviceCode: pairing.deviceCode }),
    postJson('/agent-pairings/claim', { deviceCode: pairing.deviceCode }),
  ]);
  assert.equal(claims.filter((response) => response.ok).length, 1);
  assert.equal(claims.find((response) => !response.ok)?.status, 410);
  const successfulClaim = claims.find((response) => response.ok);
  assert.ok(successfulClaim);
  const paired = await parseJsonResponse(successfulClaim, agentPairingClaimSchema);
  if (paired.status !== 'paired') {
    assert.fail('Expected exactly one claim to receive a paired credential.');
  }
  assert.equal(paired.ownerName, developers[ownerIndex]?.user.displayName);

  for (const [index, developer] of developers.entries()) {
    const agents = await parseJsonResponse(
      await fetch(`${baseUrl}/developer/agents`, {
        headers: { authorization: `Bearer ${developer.accessToken}` },
      }),
      developerAgentsSchema,
    );
    assert.deepEqual(
      agents.map((agent) => agent.agentId),
      index === ownerIndex ? [paired.agentId] : [],
    );
  }
});

test('invalid tokens cannot connect and unauthenticated fixtures cannot announce paired identities or project keys', {
  timeout: 10_000,
}, async () => {
  const owner = await authenticateDeveloper();
  const paired = await pairAgent(owner.accessToken);
  const invalidSocket = connectAgent('invalid-onboarding-token-with-at-least-32-bytes');
  try {
    await assert.rejects(waitForConnect(invalidSocket), /Unauthorized agent/);
  } finally {
    invalidSocket.close();
  }

  const unauthenticatedSocket = connectAgent();
  try {
    await waitForConnect(unauthenticatedSocket);
    const announcements = [
      { agentId: paired.agentId, projects: [] },
      {
        agentId: `unpaired-${randomUUID()}`,
        projects: [
          {
            key: `${paired.projectKeyPrefix}repo`,
            name: 'PairDock',
            repoFullName: 'mathis-gala/PairDock',
            pathAlias: 'PairDock',
            defaultBranch: 'main',
          },
        ],
      },
    ];

    for (const announcement of announcements) {
      const acknowledgement = await unauthenticatedSocket.timeout(2_000).emitWithAck(agentProtocolMessageEventName, {
        protocolVersion: AGENT_PROTOCOL_VERSION,
        messageId: randomUUID(),
        type: 'agent.connected',
        payload: { ...announcement, capabilities: [], models: [] },
        sentAt: new Date().toISOString(),
      } satisfies AgentEventEnvelope);
      assert.deepEqual(acknowledgement, { accepted: false, error: 'Agent is not authorized for this event.' });
    }

    const agents = await parseJsonResponse(
      await fetch(`${baseUrl}/developer/agents`, {
        headers: { authorization: `Bearer ${owner.accessToken}` },
      }),
      developerAgentsSchema,
    );
    assert.equal(agents[0]?.connected, false);
  } finally {
    unauthenticatedSocket.close();
  }
});

test('expired pairing codes cannot be inspected, approved, or claimed even after approval', async () => {
  const owner = await authenticateDeveloper();
  assert.ok(app);

  for (const approveBeforeExpiry of [false, true]) {
    const start = await postJson('/agent-pairings', { deviceName: 'Expired laptop' });
    assert.equal(start.status, 201);
    const pairing = await parseJsonResponse(start, agentPairingStartedSchema);
    if (approveBeforeExpiry) {
      const approve = await postJson(
        '/developer/agent-pairings/approve',
        { userCode: pairing.userCode },
        owner.accessToken,
      );
      assert.equal(approve.ok, true);
    }

    await app.get(DatabaseClient).agentPairing.update({
      where: { userCode: pairing.userCode.replaceAll('-', '') },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });

    const details = await fetch(`${baseUrl}/developer/agent-pairings/${pairing.userCode}`, {
      headers: { authorization: `Bearer ${owner.accessToken}` },
    });
    assert.equal(details.status, 410);
    const approve = await postJson(
      '/developer/agent-pairings/approve',
      { userCode: pairing.userCode },
      owner.accessToken,
    );
    assert.equal(approve.status, 410);
    const claim = await postJson('/agent-pairings/claim', { deviceCode: pairing.deviceCode });
    assert.equal(claim.status, 410);
  }

  const agents = await parseJsonResponse(
    await fetch(`${baseUrl}/developer/agents`, {
      headers: { authorization: `Bearer ${owner.accessToken}` },
    }),
    developerAgentsSchema,
  );
  assert.deepEqual(agents, []);
});

test('anonymous and PM users cannot approve, inspect, list, or revoke developer agents', async () => {
  const owner = await authenticateDeveloper();
  const paired = await pairAgent(owner.accessToken);
  const pmSeed = randomUUID();
  const pmResponse = await postJson('/auth/pm/callback', {
    accessToken: `slack:${pmSeed}:pairdock-testers:pm-${pmSeed}@pairdock.test:PM ${pmSeed}`,
  });
  assert.equal(pmResponse.status, 200);
  const pm = await parseJsonResponse(pmResponse, authResponseSchema);
  const start = await postJson('/agent-pairings', { deviceName: 'Awaiting developer' });
  assert.equal(start.status, 201);
  const pairing = await parseJsonResponse(start, agentPairingStartedSchema);

  for (const identity of [
    { accessToken: undefined, expectedStatus: 401 },
    { accessToken: pm.accessToken, expectedStatus: 403 },
  ]) {
    const headers = identity.accessToken ? { authorization: `Bearer ${identity.accessToken}` } : undefined;
    const details = await fetch(`${baseUrl}/developer/agent-pairings/${pairing.userCode}`, { headers });
    assert.equal(details.status, identity.expectedStatus);
    const approve = await postJson(
      '/developer/agent-pairings/approve',
      { userCode: pairing.userCode },
      identity.accessToken,
    );
    assert.equal(approve.status, identity.expectedStatus);
    const list = await fetch(`${baseUrl}/developer/agents`, { headers });
    assert.equal(list.status, identity.expectedStatus);
    const revoke = await fetch(`${baseUrl}/developer/agents/${paired.agentId}`, { method: 'DELETE', headers });
    assert.equal(revoke.status, identity.expectedStatus);
  }

  const claim = await postJson('/agent-pairings/claim', { deviceCode: pairing.deviceCode });
  assert.equal(claim.ok, true);
  assert.deepEqual(await claim.json(), { status: 'pending' });
  const agents = await parseJsonResponse(
    await fetch(`${baseUrl}/developer/agents`, {
      headers: { authorization: `Bearer ${owner.accessToken}` },
    }),
    developerAgentsSchema,
  );
  assert.equal(agents[0]?.revokedAt, null);
});

test('pairing code guesses are rate limited even when the code does not exist', async () => {
  const developer = await authenticateDeveloper();

  for (let attempt = 0; attempt < 31; attempt += 1) {
    const response = await fetch(`${baseUrl}/developer/agent-pairings/AAAAAAAA`, {
      headers: { authorization: `Bearer ${developer.accessToken}` },
    });
    assert.equal(response.status, attempt < 30 ? 404 : 429);
  }
});

async function pairAgent(accessToken: string) {
  const start = await postJson('/agent-pairings', { deviceName: 'Owner laptop' });
  assert.equal(start.status, 201);
  const pairing = await parseJsonResponse(start, agentPairingStartedSchema);
  const approve = await postJson('/developer/agent-pairings/approve', { userCode: pairing.userCode }, accessToken);
  assert.equal(approve.ok, true);
  const claim = await postJson('/agent-pairings/claim', { deviceCode: pairing.deviceCode });
  assert.equal(claim.ok, true);
  const paired = await parseJsonResponse(claim, agentPairingClaimSchema);
  if (paired.status !== 'paired') {
    assert.fail('Expected developer approval to release an agent credential.');
  }
  return paired;
}

function connectAgent(authToken?: string): Socket {
  return io(`${baseUrl}/agent`, {
    forceNew: true,
    reconnection: false,
    transports: ['websocket'],
    extraHeaders: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
  });
}

async function publishProject(socket: Socket, agentId: string, projectKey: string) {
  const acknowledgement = await socket.timeout(2_000).emitWithAck(agentProtocolMessageEventName, {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    messageId: randomUUID(),
    type: 'agent.connected',
    payload: {
      agentId,
      capabilities: ['session.prepare'],
      models: [{ id: 'local/gpt-5', label: 'GPT-5', provider: 'local' }],
      projects: [
        {
          key: projectKey,
          name: 'PairDock',
          repoFullName: 'mathis-gala/PairDock',
          pathAlias: 'PairDock',
          defaultBranch: 'main',
        },
      ],
    },
    sentAt: new Date().toISOString(),
  } satisfies AgentEventEnvelope);
  assert.deepEqual(acknowledgement, { accepted: true });
}

async function authenticateDeveloper() {
  const tokenSeed = randomUUID();
  const response = await postJson('/auth/developer/callback', {
    accessToken: `github:${tokenSeed}:dev-${tokenSeed}@pairdock.test:Dev ${tokenSeed}:installation:test-agent-onboarding`,
  });
  assert.equal(response.status, 200);
  return parseJsonResponse(response, authResponseSchema);
}

function postJson(path: string, body: unknown, accessToken?: string): Promise<Response> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (accessToken) {
    headers.authorization = `Bearer ${accessToken}`;
  }
  return fetch(`${baseUrl}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
}

function waitForConnect(socket: Socket): Promise<void> {
  if (socket.connected) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    socket.once('connect', () => resolve());
    socket.once('connect_error', reject);
  });
}
