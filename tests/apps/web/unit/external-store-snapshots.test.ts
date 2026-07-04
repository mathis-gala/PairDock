import assert from 'node:assert/strict';
import test from 'node:test';
import { getAppRouteSnapshot } from '../../../../apps/web/src/hooks/use-app-route.js';
import { getAuthSessionSnapshot } from '../../../../apps/web/src/hooks/use-auth-session.js';

const authStorageKey = 'pairdock.auth.session';

function withWindow(windowValue: object, callback: () => void): void {
  const previousDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: windowValue,
  });

  try {
    callback();
  } finally {
    if (previousDescriptor) {
      Object.defineProperty(globalThis, 'window', previousDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, 'window');
    }
  }
}

test('useAppRoute snapshot returns a stable object while the hash is unchanged', () => {
  withWindow({ location: { hash: '#/pm' } }, () => {
    const firstSnapshot = getAppRouteSnapshot();
    const secondSnapshot = getAppRouteSnapshot();

    assert.equal(secondSnapshot, firstSnapshot);
  });
});

test('useAuthSession snapshot returns a stable object while local storage is unchanged', () => {
  const serializedSession = JSON.stringify({
    accessToken: 'local-token',
    provider: 'slack',
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'pm@example.com',
      displayName: 'Local PM',
      kind: 'pm',
    },
  });
  const localStorage = {
    getItem: (key: string) => (key === authStorageKey ? serializedSession : null),
  };

  withWindow({ localStorage }, () => {
    const firstSnapshot = getAuthSessionSnapshot();
    const secondSnapshot = getAuthSessionSnapshot();

    assert.equal(secondSnapshot, firstSnapshot);
  });
});
