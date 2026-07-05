import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthService } from '../../../../../apps/api/src/auth/auth.service.js';

test('developer start URL uses OAuth authorization instead of GitHub App install page', () => {
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
    const service = Object.create(AuthService.prototype) as AuthService;
    const url = service.getDeveloperStartUrl();

    assert.match(url, /^https:\/\/github\.test\/login\/oauth\/authorize\?/);
    assert.match(url, /client_id=client-id/);
    assert.match(url, /redirect_uri=http%3A%2F%2F127\.0\.0\.1%3A3000%2Fauth%2Fdeveloper%2Fcallback/);
    assert.doesNotMatch(url, /\/settings\/apps|\/installations\/new/);
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
