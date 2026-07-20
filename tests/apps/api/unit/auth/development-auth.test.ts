import assert from 'node:assert/strict';
import test from 'node:test';
import { isDevelopmentAuthEnabled } from '../../../../../apps/api/src/auth/development-auth.js';

test('development auth requires an explicit flag outside production', () => {
  assert.equal(isDevelopmentAuthEnabled({ DEV_AUTH_ENABLED: 'true', NODE_ENV: 'development' }), true);
  assert.equal(isDevelopmentAuthEnabled({ DEV_AUTH_ENABLED: 'false', NODE_ENV: 'development' }), false);
  assert.equal(isDevelopmentAuthEnabled({ NODE_ENV: 'development' }), false);
});

test('production cannot enable fixture authentication accidentally', () => {
  assert.equal(isDevelopmentAuthEnabled({ DEV_AUTH_ENABLED: 'true', NODE_ENV: 'production' }), false);
});
