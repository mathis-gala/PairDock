import assert from 'node:assert/strict';
import test from 'node:test';
import { isDevelopmentPmAuthEnabled } from '../../../../../apps/api/src/auth/development-pm-auth.js';

test('development PM auth is enabled only by its explicit flag outside production', () => {
  assert.equal(isDevelopmentPmAuthEnabled({ DEV_PM_AUTH_ENABLED: 'true', NODE_ENV: 'development' }), true);
  assert.equal(isDevelopmentPmAuthEnabled({ DEV_PM_AUTH_ENABLED: 'false', NODE_ENV: 'development' }), false);
  assert.equal(isDevelopmentPmAuthEnabled({ NODE_ENV: 'development' }), false);
});

test('development PM auth remains disabled in production even when the flag is set', () => {
  assert.equal(isDevelopmentPmAuthEnabled({ DEV_PM_AUTH_ENABLED: 'true', NODE_ENV: 'production' }), false);
});
