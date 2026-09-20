import assert from 'node:assert/strict';
import test from 'node:test';
import type { DeveloperAgent } from '@pairdock/shared-contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppShell } from '../../../../apps/web/src/app/app-shell.js';
import type { AuthSession } from '../../../../apps/web/src/schemas/auth.js';
import { DeveloperAgentsPage } from '../../../../apps/web/src/views/developer-agents-page.js';

const session: AuthSession = {
  accessToken: 'device-owner-session',
  provider: 'github',
  user: {
    id: '123e4567-e89b-12d3-a456-426614174003',
    email: 'owner@example.com',
    displayName: 'Developer',
    kind: 'developer',
  },
};

const device: DeveloperAgent = {
  agentId: 'agent-owned',
  deviceName: 'Mon Mac',
  connected: true,
  pairedAt: '2026-09-20T09:00:00.000Z',
  lastSeenAt: '2026-09-20T10:00:00.000Z',
  revokedAt: null,
};

function renderAgents(queryClient: QueryClient, userCode: string | null = null): string {
  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <DeveloperAgentsPage onSignOut={() => undefined} session={session} userCode={userCode} />
    </QueryClientProvider>,
  );
}

test('agent devices use the signed-in identity cache and revoked status overrides connectivity', () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(
    ['developer-agents', session.accessToken],
    [{ ...device, revokedAt: '2026-09-20T10:01:00.000Z' }],
  );
  queryClient.setQueryData(
    ['developer-agents', 'another-developer-session'],
    [{ ...device, deviceName: 'Autre développeur' }],
  );

  const html = renderAgents(queryClient);

  assert.match(html, /Mon Mac/);
  assert.match(html, /Révoqué/);
  assert.doesNotMatch(html, /Autre développeur|En ligne|Révoquer l’accès/);
});

test('pairing shows server device details and an explicit approval action, without credentials', () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(['developer-agents', session.accessToken], []);
  queryClient.setQueryData(['agent-pairing', session.accessToken, 'ABCD2345'], {
    deviceName: 'Mac à associer',
    userCode: 'ABCD-2345',
    expiresAt: '2026-09-20T10:10:00.000Z',
  });

  const html = renderAgents(queryClient, 'ABCD2345');

  assert.match(html, /Mac à associer/);
  assert.match(html, /ABCD-2345/);
  assert.match(html, /<button[^>]*>Autoriser cet appareil<\/button>/);
  assert.match(html, /Vérifie que ce nom et ce code correspondent/);
  assert.doesNotMatch(html, /device-owner-session|deviceCode|authToken|pairdock-agent|pairdock.yml/);
});

test('offline devices explain reconnection and empty state teaches graphical enrollment', () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(['developer-agents', session.accessToken], [{ ...device, connected: false }]);
  const offlineHtml = renderAgents(queryClient);
  assert.match(offlineHtml, /Hors ligne/);
  assert.match(offlineHtml, /Ouvre PairDock sur cet appareil/);
  assert.match(offlineHtml, /Révoquer l’accès/);

  queryClient.setQueryData(['developer-agents', session.accessToken], []);
  const emptyHtml = renderAgents(queryClient);
  assert.match(emptyHtml, /Aucun appareil associé/);
  assert.match(emptyHtml, /sélecteur de dossiers/);
  assert.doesNotMatch(emptyHtml, /pairdock-agent|pairdock.yml/);
});

test('a PM opening an agent verification link must switch to GitHub without losing the code', () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const pmSession = { ...session, provider: 'slack', user: { ...session.user, kind: 'pm' } };
  const location = { hash: '#/developer/agents?code=ABCD-2345' };
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { location, localStorage: { getItem: () => JSON.stringify(pmSession) } },
  });
  const queryClient = new QueryClient();
  queryClient.setQueryData(['auth', 'providers'], { developmentPmAuthEnabled: true });

  try {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <AppShell />
      </QueryClientProvider>,
    );
    assert.match(html, /Continuer avec GitHub App/);
    assert.doesNotMatch(html, /Mes appareils|Autoriser cet appareil|Entrer comme PM local/);
    assert.equal(location.hash, '#/developer/agents?code=ABCD-2345');
  } finally {
    if (previousWindow) {
      Object.defineProperty(globalThis, 'window', previousWindow);
    } else {
      Reflect.deleteProperty(globalThis, 'window');
    }
  }
});
