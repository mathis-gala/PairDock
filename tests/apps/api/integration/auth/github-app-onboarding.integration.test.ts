import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import test from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../../../apps/api/src/app.module.js';

let app: INestApplication;
let baseUrl: string;
let githubServer: Server;
let githubInstallations: Array<{ account: { login: string }; id: number }> = [
  { account: { login: 'mathis-gala' }, id: 98765 },
];

const previousEnv = {
  AUTH_STATE_SECRET: process.env.AUTH_STATE_SECRET,
  GITHUB_APP_SLUG: process.env.GITHUB_APP_SLUG,
  GITHUB_API_BASE_URL: process.env.GITHUB_API_BASE_URL,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_OAUTH_BASE_URL: process.env.GITHUB_OAUTH_BASE_URL,
  GITHUB_REDIRECT_URI: process.env.GITHUB_REDIRECT_URI,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
};

test.before(async () => {
  githubServer = createFakeGithubServer();
  await new Promise<void>((resolve) => githubServer.listen(0, '127.0.0.1', resolve));
  const githubAddress = githubServer.address();

  if (!githubAddress || typeof githubAddress === 'string') {
    throw new Error('Expected fake GitHub server to bind to an ephemeral port.');
  }

  const githubBaseUrl = `http://127.0.0.1:${githubAddress.port}`;
  process.env.AUTH_STATE_SECRET = 'pairdock-integration-state-secret-32-bytes';
  process.env.GITHUB_APP_SLUG = 'pairdock-test';
  process.env.GITHUB_API_BASE_URL = githubBaseUrl;
  process.env.GITHUB_CLIENT_ID = 'github-client-id';
  process.env.GITHUB_OAUTH_BASE_URL = githubBaseUrl;
  process.env.GITHUB_REDIRECT_URI = 'http://127.0.0.1:3000/auth/developer/callback';
  process.env.GITHUB_TOKEN = 'source-control-test-token';

  app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0);
  const address = app.getHttpServer().address();

  if (!address || typeof address === 'string') {
    throw new Error('Expected HTTP server to bind to an ephemeral port.');
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  await app.close();
  await new Promise<void>((resolve, reject) => githubServer.close((error) => (error ? reject(error) : resolve())));
  restoreEnv(previousEnv);
});

test('GitHub App onboarding redirects installation setup into an installation-bound OAuth request', async () => {
  const startResponse = await fetch(`${baseUrl}/auth/developer/install`, { redirect: 'manual' });
  const installationUrl = new URL(startResponse.headers.get('location') ?? '');
  const installationState = installationUrl.searchParams.get('state');
  const installationCookie = readSetCookie(startResponse, 'pairdock_github_installation_state');

  assert.equal(startResponse.status, 302);
  assert.equal(installationUrl.pathname, '/apps/pairdock-test/installations/new');
  assert.ok(installationState);

  const setupUrl = new URL(`${baseUrl}/auth/developer/setup`);
  setupUrl.searchParams.set('installation_id', '98765');
  setupUrl.searchParams.set('state', installationState);
  const setupResponse = await fetch(setupUrl, {
    headers: { cookie: installationCookie },
    redirect: 'manual',
  });
  const authorizationUrl = new URL(setupResponse.headers.get('location') ?? '');

  assert.equal(setupResponse.status, 302);
  assert.equal(authorizationUrl.pathname, '/login/oauth/authorize');
  assert.equal(authorizationUrl.searchParams.get('client_id'), 'github-client-id');
  assert.ok(authorizationUrl.searchParams.get('state'));
});

test('GitHub OAuth callback rejects a forged state before exchanging the authorization code', async () => {
  const response = await fetch(`${baseUrl}/auth/developer/callback?code=oauth-code&state=forged-state`, {
    redirect: 'manual',
  });

  assert.equal(response.status, 400);
});

test('an existing GitHub App installation authorizes directly without reopening installation settings', async () => {
  const startResponse = await fetch(`${baseUrl}/auth/developer/start`, { redirect: 'manual' });
  const authorizationUrl = new URL(startResponse.headers.get('location') ?? '');
  const authorizationState = authorizationUrl.searchParams.get('state');
  const authorizationCookie = readSetCookie(startResponse, 'pairdock_github_authorization_state');

  assert.equal(startResponse.status, 302);
  assert.equal(authorizationUrl.pathname, '/login/oauth/authorize');
  assert.ok(authorizationState);

  const callbackUrl = new URL(`${baseUrl}/auth/developer/callback`);
  callbackUrl.searchParams.set('code', 'oauth-code');
  callbackUrl.searchParams.set('state', authorizationState);
  const callbackResponse = await fetch(callbackUrl, {
    headers: { cookie: authorizationCookie },
    redirect: 'manual',
  });
  const frontendUrl = new URL(callbackResponse.headers.get('location') ?? '');
  const encodedSession = new URLSearchParams(frontendUrl.hash.slice(1)).get('pairdock_auth');
  assert.ok(encodedSession);
  const session = JSON.parse(decodeURIComponent(encodedSession)) as { accessToken?: unknown };

  const projectSetupResponse = await fetch(`${baseUrl}/projects/developer/setup`, {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  const projectSetup = (await projectSetupResponse.json()) as {
    repositories?: Array<{ fullName?: unknown }>;
  };

  assert.equal(callbackResponse.status, 302);
  assert.equal(projectSetupResponse.status, 200);
  assert.deepEqual(
    projectSetup.repositories?.map((repository) => repository.fullName),
    ['mathis-gala/Booster-Break'],
  );
});

test('a developer without an accessible installation is sent through GitHub App installation', async () => {
  githubInstallations = [];

  try {
    const startResponse = await fetch(`${baseUrl}/auth/developer/start`, { redirect: 'manual' });
    const authorizationUrl = new URL(startResponse.headers.get('location') ?? '');
    const authorizationState = authorizationUrl.searchParams.get('state');
    const authorizationCookie = readSetCookie(startResponse, 'pairdock_github_authorization_state');
    assert.ok(authorizationState);

    const callbackUrl = new URL(`${baseUrl}/auth/developer/callback`);
    callbackUrl.searchParams.set('code', 'oauth-code');
    callbackUrl.searchParams.set('state', authorizationState);
    const callbackResponse = await fetch(callbackUrl, {
      headers: { cookie: authorizationCookie },
      redirect: 'manual',
    });

    assert.equal(callbackResponse.status, 302);
    assert.equal(callbackResponse.headers.get('location'), '/auth/developer/install');
  } finally {
    githubInstallations = [{ account: { login: 'mathis-gala' }, id: 98765 }];
  }
});

test('GitHub installation setup rejects a valid state that is not bound to the initiating browser', async () => {
  const startResponse = await fetch(`${baseUrl}/auth/developer/install`, { redirect: 'manual' });
  const installationUrl = new URL(startResponse.headers.get('location') ?? '');
  const installationState = installationUrl.searchParams.get('state');
  assert.ok(installationState);

  const setupUrl = new URL(`${baseUrl}/auth/developer/setup`);
  setupUrl.searchParams.set('installation_id', '98765');
  setupUrl.searchParams.set('state', installationState);
  const setupResponse = await fetch(setupUrl, { redirect: 'manual' });

  assert.equal(setupResponse.status, 400);
});

test('verified GitHub App onboarding authenticates the developer and exposes Booster-Break choices', async () => {
  const startResponse = await fetch(`${baseUrl}/auth/developer/install`, { redirect: 'manual' });
  const installationUrl = new URL(startResponse.headers.get('location') ?? '');
  const installationState = installationUrl.searchParams.get('state');
  const installationCookie = readSetCookie(startResponse, 'pairdock_github_installation_state');
  assert.ok(installationState);

  const setupUrl = new URL(`${baseUrl}/auth/developer/setup`);
  setupUrl.searchParams.set('installation_id', '98765');
  setupUrl.searchParams.set('state', installationState);
  const setupResponse = await fetch(setupUrl, {
    headers: { cookie: installationCookie },
    redirect: 'manual',
  });
  const authorizationUrl = new URL(setupResponse.headers.get('location') ?? '');
  const authorizationState = authorizationUrl.searchParams.get('state');
  const authorizationCookie = readSetCookie(setupResponse, 'pairdock_github_authorization_state');
  assert.ok(authorizationState);

  const callbackUrl = new URL(`${baseUrl}/auth/developer/callback`);
  callbackUrl.searchParams.set('code', 'oauth-code');
  callbackUrl.searchParams.set('state', authorizationState);
  const callbackResponse = await fetch(callbackUrl, {
    headers: { cookie: authorizationCookie },
    redirect: 'manual',
  });
  const frontendUrl = new URL(callbackResponse.headers.get('location') ?? '');
  const encodedSession = new URLSearchParams(frontendUrl.hash.slice(1)).get('pairdock_auth');
  assert.ok(encodedSession);
  const session = JSON.parse(decodeURIComponent(encodedSession)) as { accessToken?: unknown };
  assert.equal(typeof session.accessToken, 'string');

  const projectSetupResponse = await fetch(`${baseUrl}/projects/developer/setup`, {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  const projectSetup = (await projectSetupResponse.json()) as {
    repositories?: Array<{ branches?: unknown; fullName?: unknown }>;
  };

  assert.equal(callbackResponse.status, 302);
  assert.equal(projectSetupResponse.status, 200);
  assert.deepEqual(projectSetup.repositories, [
    {
      branches: ['main', 'dev'],
      defaultBranch: 'main',
      fullName: 'mathis-gala/Booster-Break',
      name: 'Booster-Break',
    },
  ]);
});

function createFakeGithubServer(): Server {
  return createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://github.test');

    if (request.method === 'POST' && url.pathname === '/login/oauth/access_token') {
      return json(response, { access_token: 'github-user-token' });
    }

    if (request.method === 'GET' && url.pathname === '/user') {
      return json(response, {
        email: 'tcg-owner@pairdock.test',
        id: 42,
        login: 'mathis-gala',
        name: 'TCG Owner',
      });
    }

    if (request.method === 'GET' && url.pathname === '/user/installations') {
      return json(response, {
        installations: githubInstallations,
        total_count: githubInstallations.length,
      });
    }

    if (request.method === 'GET' && url.pathname === '/installation/repositories') {
      return json(response, {
        repositories: [
          {
            default_branch: 'main',
            full_name: 'mathis-gala/Booster-Break',
            name: 'Booster-Break',
          },
        ],
      });
    }

    if (request.method === 'GET' && url.pathname === '/repos/mathis-gala/Booster-Break/branches') {
      return json(response, [{ name: 'main' }, { name: 'dev' }]);
    }

    response.writeHead(404).end();
  });
}

function json(response: import('node:http').ServerResponse, body: unknown): void {
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}

function readSetCookie(response: Response, name: string): string {
  const header = response.headers.get('set-cookie') ?? '';
  const value = new RegExp(`${name}=([^;,]+)`).exec(header)?.[1];

  if (!value) {
    throw new Error(`Expected ${name} cookie.`);
  }

  return `${name}=${value}`;
}

function restoreEnv(values: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      delete process.env[key];
      continue;
    }

    process.env[key] = value;
  }
}
