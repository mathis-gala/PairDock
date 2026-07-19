import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthService } from '../../../../../apps/api/src/auth/auth.service.js';
import { GithubAuthStateService } from '../../../../../apps/api/src/auth/github-auth-state.service.js';

function buildAuthService(authState: GithubAuthStateService) {
  return new AuthService({} as never, {} as never, {} as never, {} as never, {} as never, authState);
}

test('developer start URL authorizes an existing GitHub App installation without reopening its settings', () => {
  const previousEnv = {
    GITHUB_APP_SLUG: process.env.GITHUB_APP_SLUG,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_REDIRECT_URI: process.env.GITHUB_REDIRECT_URI,
    GITHUB_OAUTH_BASE_URL: process.env.GITHUB_OAUTH_BASE_URL,
  };

  process.env.GITHUB_APP_SLUG = 'pairdock-dev';
  process.env.GITHUB_CLIENT_ID = 'client-id';
  process.env.GITHUB_REDIRECT_URI = 'http://127.0.0.1:3000/auth/developer/callback';
  process.env.GITHUB_OAUTH_BASE_URL = 'https://github.test';

  try {
    const authState = new GithubAuthStateService({
      secret: 'pairdock-test-state-secret-at-least-32-bytes',
    });
    const service = buildAuthService(authState);
    const url = service.getDeveloperStartUrl();

    const parsed = new URL(url);

    assert.equal(parsed.origin, 'https://github.test');
    assert.equal(parsed.pathname, '/login/oauth/authorize');
    assert.equal(parsed.searchParams.get('client_id'), 'client-id');
    const state = parsed.searchParams.get('state');
    assert.ok(state);
    assert.equal(authState.verifyAuthorizationState(state), undefined);
    assert.notEqual(parsed.searchParams.get('state'), 'pairdock-developer');
  } finally {
    restoreEnv(previousEnv);
  }
});

test('developer installation URL remains available when the GitHub App is not installed yet', () => {
  const previousEnv = {
    GITHUB_APP_SLUG: process.env.GITHUB_APP_SLUG,
    GITHUB_OAUTH_BASE_URL: process.env.GITHUB_OAUTH_BASE_URL,
  };

  process.env.GITHUB_APP_SLUG = 'pairdock-dev';
  process.env.GITHUB_OAUTH_BASE_URL = 'https://github.test';

  try {
    const authState = new GithubAuthStateService({
      secret: 'pairdock-test-state-secret-at-least-32-bytes',
    });
    const service = buildAuthService(authState);
    const parsed = new URL(service.getDeveloperInstallationUrl());
    const state = parsed.searchParams.get('state');

    assert.equal(parsed.pathname, '/apps/pairdock-dev/installations/new');
    assert.ok(state);
    assert.doesNotThrow(() => authState.verifyInstallationState(state));
  } finally {
    restoreEnv(previousEnv);
  }
});

test('developer installation handoff validates state and binds installation id into OAuth state', () => {
  const previousEnv = {
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_REDIRECT_URI: process.env.GITHUB_REDIRECT_URI,
    GITHUB_OAUTH_BASE_URL: process.env.GITHUB_OAUTH_BASE_URL,
  };

  process.env.GITHUB_CLIENT_ID = 'client-id';
  process.env.GITHUB_REDIRECT_URI = 'http://127.0.0.1:3000/auth/developer/callback';
  process.env.GITHUB_OAUTH_BASE_URL = 'https://github.test';

  try {
    const authState = new GithubAuthStateService({
      secret: 'pairdock-test-state-secret-at-least-32-bytes',
    });
    const service = buildAuthService(authState);
    const installationState = authState.issueInstallationState();
    const url = service.getDeveloperAuthorizationUrl('98765', installationState);
    const parsed = new URL(url);

    assert.equal(parsed.origin, 'https://github.test');
    assert.equal(parsed.pathname, '/login/oauth/authorize');
    assert.equal(parsed.searchParams.get('client_id'), 'client-id');
    assert.equal(parsed.searchParams.get('scope'), 'user:email');
    assert.equal(parsed.searchParams.get('redirect_uri'), 'http://127.0.0.1:3000/auth/developer/callback');
    const authorizationState = parsed.searchParams.get('state');
    assert.ok(authorizationState);
    assert.equal(authState.verifyAuthorizationState(authorizationState), '98765');
  } finally {
    restoreEnv(previousEnv);
  }
});

test('PM start URL uses an expiring signed Slack OAuth state', () => {
  const previousEnv = {
    SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
    SLACK_OAUTH_BASE_URL: process.env.SLACK_OAUTH_BASE_URL,
    SLACK_REDIRECT_URI: process.env.SLACK_REDIRECT_URI,
  };

  process.env.SLACK_CLIENT_ID = 'slack-client-id';
  process.env.SLACK_OAUTH_BASE_URL = 'https://slack.test';
  process.env.SLACK_REDIRECT_URI = 'http://127.0.0.1:3000/auth/pm/callback';

  try {
    const authState = new GithubAuthStateService({
      secret: 'pairdock-test-state-secret-at-least-32-bytes',
    });
    const service = buildAuthService(authState);
    const url = new URL(service.getPmStartUrl());
    const state = url.searchParams.get('state');

    assert.ok(state);
    assert.doesNotThrow(() => authState.verifySlackAuthorizationState(state));
    assert.notEqual(state, 'pairdock-pm');
  } finally {
    restoreEnv(previousEnv);
  }
});

function restoreEnv(values: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      delete process.env[key];
      continue;
    }

    process.env[key] = value;
  }
}
