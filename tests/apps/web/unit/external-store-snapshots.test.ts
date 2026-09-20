import assert from 'node:assert/strict';
import test from 'node:test';
import { getAppRouteSnapshot } from '../../../../apps/web/src/hooks/use-app-route.js';
import {
  getAuthSessionSnapshot,
  rememberDeveloperAgentReturn,
  setAuthSession,
} from '../../../../apps/web/src/hooks/use-auth-session.js';

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

test('PM history and pull request hashes resolve to implemented routes', () => {
  withWindow({ location: { hash: '#/pm/sessions' } }, () => {
    assert.deepEqual(getAppRouteSnapshot(), { kind: 'pm-session-history' });
  });
  withWindow({ location: { hash: '#/pm/review-requests' } }, () => {
    assert.deepEqual(getAppRouteSnapshot(), { kind: 'pm-review-requests' });
  });
});

test('developer session hashes resolve to the read-only session route', () => {
  withWindow({ location: { hash: '#/developer/sessions/123e4567-e89b-12d3-a456-426614174000' } }, () => {
    assert.deepEqual(getAppRouteSnapshot(), {
      kind: 'developer-session',
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
    });
  });
});

test('agent verification links preserve the pairing code for explicit developer approval', () => {
  withWindow({ location: { hash: '#/developer/agents?code=abcd-2345' } }, () => {
    assert.deepEqual(getAppRouteSnapshot(), { kind: 'developer-agents', userCode: 'ABCD2345' });
  });
  withWindow({ location: { hash: '#/developer/agents?code=https%3A%2F%2Fexample.com' } }, () => {
    assert.deepEqual(getAppRouteSnapshot(), { kind: 'developer-agents', userCode: null });
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

test('useAuthSession snapshot consumes and cleans OAuth callback hash', () => {
  const session = {
    accessToken: 'local-token',
    provider: 'github',
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'dev@example.com',
      displayName: 'Local Dev',
      kind: 'developer',
    },
  };
  let persistedSession: string | null = null;
  let cleanedUrl = '';
  const localStorage = {
    getItem: (key: string) => (key === authStorageKey ? persistedSession : null),
    setItem: (key: string, value: string) => {
      if (key === authStorageKey) {
        persistedSession = value;
      }
    },
  };
  const location = {
    hash: `#pairdock_auth=${encodeURIComponent(JSON.stringify(session))}`,
    pathname: '/developer',
    search: '',
  };
  const history = {
    replaceState: (_state: null, _title: string, url: string) => {
      cleanedUrl = url;
    },
  };

  withWindow({ history, localStorage, location }, () => {
    const snapshot = getAuthSessionSnapshot();

    assert.equal(snapshot?.accessToken, 'local-token');
    assert.equal(cleanedUrl, '/developer');
  });
});

test('useAuthSession lets independent browsers persist developer and PM authentication', () => {
  const createStorage = () => {
    const values = new Map<string, string>();
    return {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
  };
  const developerBrowserStorage = createStorage();
  const pmBrowserStorage = createStorage();
  const developerSession = {
    accessToken: 'developer-token',
    provider: 'github' as const,
    user: {
      id: '123e4567-e89b-12d3-a456-426614174001',
      email: 'same@example.com',
      displayName: 'Developer',
      kind: 'developer' as const,
    },
  };
  const pmSession = {
    accessToken: 'pm-token',
    provider: 'slack' as const,
    user: {
      id: '123e4567-e89b-12d3-a456-426614174002',
      email: 'same@example.com',
      displayName: 'PM',
      kind: 'pm' as const,
    },
  };

  withWindow({ dispatchEvent() {}, localStorage: developerBrowserStorage }, () => setAuthSession(developerSession));
  withWindow({ dispatchEvent() {}, localStorage: pmBrowserStorage }, () => setAuthSession(pmSession));
  withWindow({ localStorage: developerBrowserStorage }, () => {
    assert.equal(getAuthSessionSnapshot()?.accessToken, 'developer-token');
  });
  withWindow({ localStorage: pmBrowserStorage }, () => {
    assert.equal(getAuthSessionSnapshot()?.accessToken, 'pm-token');
  });
});

test('GitHub callback returns to pending device approval once and never redirects a PM', () => {
  const session = {
    accessToken: 'pairing-developer-token',
    provider: 'github',
    user: {
      id: '123e4567-e89b-12d3-a456-426614174003',
      email: 'device-owner@example.com',
      displayName: 'Device owner',
      kind: 'developer',
    },
  };
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
  const location = { hash: '#/developer/agents?code=ABCD-2345', pathname: '/', search: '' };
  let callbackUrl = '';
  const history = {
    replaceState: (_state: null, _title: string, url: string) => {
      callbackUrl = url;
      location.hash = url.includes('#') ? url.slice(url.indexOf('#')) : '';
    },
  };

  withWindow({ location, history, localStorage: storage, sessionStorage: storage }, () => {
    rememberDeveloperAgentReturn();
    location.hash = `#pairdock_auth=${encodeURIComponent(JSON.stringify(session))}`;
    assert.equal(getAuthSessionSnapshot()?.user.kind, 'developer');
    assert.equal(callbackUrl, '/#/developer/agents?code=ABCD2345');
    assert.deepEqual(getAppRouteSnapshot(), { kind: 'developer-agents', userCode: 'ABCD2345' });

    location.hash = `#pairdock_auth=${encodeURIComponent(JSON.stringify(session))}`;
    getAuthSessionSnapshot();
    assert.equal(callbackUrl, '/');

    location.hash = '#/developer/agents?code=ABCD-2345';
    rememberDeveloperAgentReturn();
    const pmSession = { ...session, provider: 'slack', user: { ...session.user, kind: 'pm' } };
    location.hash = `#pairdock_auth=${encodeURIComponent(JSON.stringify(pmSession))}`;
    assert.equal(getAuthSessionSnapshot()?.user.kind, 'pm');
    assert.equal(callbackUrl, '/');

    location.hash = '#/developer/agents?code=ABCD-2345';
    rememberDeveloperAgentReturn();
    location.hash = '#/login';
    rememberDeveloperAgentReturn();
    location.hash = `#pairdock_auth=${encodeURIComponent(JSON.stringify(session))}`;
    getAuthSessionSnapshot();
    assert.equal(callbackUrl, '/', 'a normal login must clear an abandoned pairing target');

    values.set('pairdock.auth.agent-return', 'https://example.com/');
    location.hash = `#pairdock_auth=${encodeURIComponent(JSON.stringify(session))}`;
    getAuthSessionSnapshot();
    assert.equal(callbackUrl, '/', 'tampered return values must never become redirect URLs');
  });
});

test('desktop project handoff survives GitHub login and cannot redirect a PM', () => {
  const key = 'agent-local-design-system';
  const session = {
    accessToken: 'handoff-test-token',
    provider: 'github',
    user: {
      id: '123e4567-e89b-12d3-a456-426614174008',
      email: 'dev@example.test',
      displayName: 'Dev',
      kind: 'developer',
    },
  };
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
  const location = { hash: `#/developer?agentProjectKey=${key}`, pathname: '/', search: '' };
  let cleaned = '';
  const history = {
    replaceState: (_state: null, _title: string, url: string) => {
      cleaned = url;
      location.hash = url.includes('#') ? url.slice(url.indexOf('#')) : '';
    },
  };
  withWindow({ location, history, localStorage: storage, sessionStorage: storage }, () => {
    assert.deepEqual(getAppRouteSnapshot(), { kind: 'developer-home', agentProjectKey: key });
    rememberDeveloperAgentReturn();
    location.hash = `#pairdock_auth=${encodeURIComponent(JSON.stringify(session))}`;
    getAuthSessionSnapshot();
    assert.equal(cleaned, `/#/developer?agentProjectKey=${key}`);
    location.hash = `#/developer?agentProjectKey=${key}`;
    rememberDeveloperAgentReturn();
    location.hash = `#pairdock_auth=${encodeURIComponent(JSON.stringify({ ...session, provider: 'slack', user: { ...session.user, kind: 'pm' } }))}`;
    getAuthSessionSnapshot();
    assert.equal(cleaned, '/');
  });
});
