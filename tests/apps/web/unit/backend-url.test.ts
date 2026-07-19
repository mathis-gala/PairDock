import assert from 'node:assert/strict';
import test from 'node:test';
import { getBackendUrl } from '../../../../apps/web/src/lib/backend-url.js';

test('production web runtime reads the API URL injected by the container environment', () => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      __PAIRDOCK_CONFIG__: {
        apiBaseUrl: 'https://api.example.com/',
      },
    },
  });

  try {
    assert.equal(getBackendUrl(), 'https://api.example.com');
  } finally {
    Reflect.deleteProperty(globalThis, 'window');
  }
});
