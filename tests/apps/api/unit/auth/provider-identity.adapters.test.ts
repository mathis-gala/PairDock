import assert from 'node:assert/strict';
import test from 'node:test';
import { GithubDeveloperIdentityAdapter } from '../../../../../apps/api/src/auth/adapters/github/github-developer-identity.adapter.js';
import { SlackPmIdentityAdapter } from '../../../../../apps/api/src/auth/adapters/slack/slack-pm-identity.adapter.js';

test('GithubDeveloperIdentityAdapter resolves a developer from GitHub user and primary email APIs', async () => {
  const requestedUrls: string[] = [];
  const adapter = new GithubDeveloperIdentityAdapter(
    { apiBaseUrl: 'https://api.github.test', oauthBaseUrl: 'https://github.test' },
    async (url) => {
      requestedUrls.push(url);

      if (url.endsWith('/user')) {
        return jsonResponse({ id: 42, login: 'mathis-gala', name: 'Mathis Gala', email: null });
      }

      return jsonResponse([{ email: 'mathis@example.com', primary: true, verified: true }]);
    },
  );

  const identity = await adapter.getDeveloperIdentity('github-user-token');

  assert.deepEqual(requestedUrls, ['https://api.github.test/user', 'https://api.github.test/user/emails']);
  assert.deepEqual(identity, {
    provider: 'github',
    providerUserId: '42',
    providerTeamId: null,
    email: 'mathis@example.com',
    displayName: 'Mathis Gala',
    kind: 'developer',
    metadata: {
      login: 'mathis-gala',
    },
  });
});

test('GithubDeveloperIdentityAdapter exchanges GitHub App callback code and preserves installation metadata', async () => {
  const requestedUrls: string[] = [];
  const adapter = new GithubDeveloperIdentityAdapter(
    {
      apiBaseUrl: 'https://api.github.test',
      oauthBaseUrl: 'https://github.test',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'https://pairdock.test/auth/developer/callback',
    },
    async (url) => {
      requestedUrls.push(url);

      if (url.endsWith('/login/oauth/access_token')) {
        return jsonResponse({ access_token: 'github-user-token' });
      }

      if (url.endsWith('/user')) {
        return jsonResponse({ id: 42, login: 'mathis-gala', name: 'Mathis Gala', email: 'mathis@example.com' });
      }

      throw new Error(`Unexpected URL ${url}`);
    },
  );

  const identity = await adapter.getDeveloperIdentity('code:oauth-code:installation:98765');

  assert.deepEqual(requestedUrls, ['https://github.test/login/oauth/access_token', 'https://api.github.test/user']);
  assert.deepEqual(identity.metadata, {
    installationId: '98765',
    login: 'mathis-gala',
  });
});

test('GithubDeveloperIdentityAdapter preserves fixture installation metadata for local dev', async () => {
  const adapter = new GithubDeveloperIdentityAdapter({
    apiBaseUrl: 'https://api.github.test',
    oauthBaseUrl: 'https://github.test',
  });

  const identity = await adapter.getDeveloperIdentity(
    'github:mathis-gala:mathis@example.com:Mathis Gala:installation:test-tcg',
  );

  assert.deepEqual(identity.metadata, {
    installationId: 'test-tcg',
  });
});

test('SlackPmIdentityAdapter resolves a PM from Slack auth and users APIs', async () => {
  const requestedUrls: string[] = [];
  const adapter = new SlackPmIdentityAdapter({ apiBaseUrl: 'https://slack.test/api' }, async (url) => {
    requestedUrls.push(url);

    if (url.endsWith('/auth.test')) {
      return jsonResponse({ ok: true, user_id: 'U123', team_id: 'T456' });
    }

    return jsonResponse({
      ok: true,
      user: {
        id: 'U123',
        profile: {
          email: 'pm@example.com',
          real_name: 'PM User',
        },
      },
    });
  });

  const identity = await adapter.getPmIdentity('xoxp-user-token');

  assert.deepEqual(requestedUrls, ['https://slack.test/api/auth.test', 'https://slack.test/api/users.info?user=U123']);
  assert.deepEqual(identity, {
    provider: 'slack',
    providerUserId: 'U123',
    providerTeamId: 'T456',
    email: 'pm@example.com',
    displayName: 'PM User',
    kind: 'pm',
    metadata: {},
  });
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
