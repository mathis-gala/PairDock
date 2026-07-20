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

test('preview runtime can route API and sockets through its own public origin', () => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      __PAIRDOCK_CONFIG__: {
        apiBaseUrl: 'same-origin',
      },
      location: {
        origin: 'https://pairdock-preview.example.test',
      },
    },
  });

  try {
    assert.equal(getBackendUrl(), 'https://pairdock-preview.example.test');
  } finally {
    Reflect.deleteProperty(globalThis, 'window');
  }
});
