import assert from 'node:assert/strict';
import test from 'node:test';
import type { DesktopAgentSnapshot, DesktopProject, DesktopTools } from '@pairdock/local-agent/desktop-contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DesktopApp } from '../../../apps/agent-desktop/src/renderer/app.js';
import { ProjectForm } from '../../../apps/agent-desktop/src/renderer/project-form.js';
import {
  initializeDesktopProfile,
  readDesktopSnapshot,
} from '../../../apps/agent-desktop/src/renderer/use-desktop-agent.js';
import type { DesktopBridge } from '../../../apps/agent-desktop/src/shared/bridge.js';

const tools: DesktopTools = {
  git: { available: true, version: '2.40.0', message: 'Git is available.' },
  docker: { available: true, version: '27.0.0', message: 'Docker is available.' },
  codex: { available: true, authenticated: true, version: '0.155.1', message: 'Codex is connected.' },
};

const project: DesktopProject = {
  key: 'local-project',
  name: 'My project',
  path: '/tmp/project',
  repoFullName: 'team/project',
  defaultBranch: 'main',
  packageManager: 'npm',
  scripts: [
    { name: 'dev', command: 'npm run dev -- --host 127.0.0.1 --port {{hostPort}}' },
    { name: 'build', command: 'npm run build' },
    { name: 'test', command: 'npm run test' },
    { name: 'lint', command: 'npm run lint' },
  ],
  setupCommand: 'npm ci',
  previewCommand: 'npm run dev -- --host 127.0.0.1 --port {{hostPort}}',
  healthcheckUrl: 'http://127.0.0.1:{{hostPort}}',
  runtime: 'host',
  buildCommand: 'npm run build',
  testCommand: 'npm run test',
  lintCommand: 'npm run lint',
  manifestStatus: 'missing',
  warnings: [],
};

function snapshot(overrides: Partial<DesktopAgentSnapshot> = {}): DesktopAgentSnapshot {
  return {
    initialized: true,
    status: 'stopped',
    running: false,
    dockerRequired: true,
    busy: false,
    error: null,
    pairing: null,
    connection: {
      backendUrl: 'https://api.example.com',
      frontendUrl: 'https://example.com',
      agentId: 'agent',
      ownerName: 'Developer',
    },
    projects: [project],
    tools,
    models: [{ id: 'codex/model', label: 'Model', provider: 'codex' }],
    readiness: {},
    ...overrides,
  };
}

function bridgeFor(state: DesktopAgentSnapshot, overrides: Partial<DesktopBridge> = {}): DesktopBridge {
  const preferences = { deviceName: 'My Mac', launchAtLogin: false, canLaunchAtLogin: true };
  return {
    initialize: async () => state,
    getSnapshot: async () => state,
    beginPairing: async () => state,
    pollPairing: async () => state,
    cancelPairing: async () => state,
    chooseFolder: async () => project,
    saveProject: async () => state,
    removeProject: async () => state,
    checkTools: async () => state,
    loginCodex: async () => state,
    runReadiness: async () => state,
    start: async () => state,
    stop: async () => state,
    openPairing: async () => {},
    openProjects: async () => {},
    openToolHelp: async () => {},
    openDocker: async () => {},
    getPreferences: async () => preferences,
    setLaunchAtLogin: async () => preferences,
    ...overrides,
  };
}

function renderApp(state: DesktopAgentSnapshot): string {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['desktop-agent'], state);
  client.setQueryData(['desktop-preferences'], { deviceName: 'My Mac', launchAtLogin: false, canLaunchAtLogin: true });
  try {
    return renderToStaticMarkup(
      createElement(QueryClientProvider, { client }, createElement(DesktopApp, { bridge: bridgeFor(state) })),
    );
  } finally {
    client.clear();
  }
}

test('a paired Mac resumes its configured projects without restarting enrollment', () => {
  const html = renderApp(snapshot());
  assert.match(html, /My project/);
  assert.match(html, /Démarrer l’agent/);
  assert.doesNotMatch(html, /id="backend-url"|Choisir un dossier/);
});

test('a locked profile stays in recovery until initialization succeeds, then restores its projects', async () => {
  let current = snapshot({
    initialized: false,
    connection: null,
    projects: [],
    tools: null,
    error: 'System keychain is locked.',
  });
  let unlocked = false;
  let initializationAttempts = 0;
  const bridge = bridgeFor(current, {
    getSnapshot: async () => current,
    initialize: async () => {
      initializationAttempts += 1;
      if (!unlocked) throw new Error('System keychain is locked.');
      current = snapshot();
      return current;
    },
  });
  let visible = current;
  function publishSnapshot(next: DesktopAgentSnapshot) {
    visible = next;
  }
  await readDesktopSnapshot(bridge, publishSnapshot);
  const recovery = renderApp(visible);
  assert.match(recovery, /Profil local indisponible/);
  assert.match(recovery, /Réessayer/);
  assert.match(recovery, /System keychain is locked/);
  assert.doesNotMatch(recovery, /id="backend-url"|Continuer dans le navigateur|Étapes de configuration/);

  await assert.rejects(initializeDesktopProfile(bridge, publishSnapshot), /System keychain is locked/);
  assert.equal(visible.initialized, false);
  unlocked = true;
  await initializeDesktopProfile(bridge, publishSnapshot);
  const restored = renderApp(visible);
  assert.equal(initializationAttempts, 2);
  assert.match(restored, /My project/);
  assert.doesNotMatch(restored, /Profil local indisponible|id="backend-url"/);
});

test('an initialized profile without a saved account may enter enrollment', () => {
  const html = renderApp(snapshot({ connection: null, projects: [], tools: null }));
  assert.match(html, /id="backend-url"/);
  assert.doesNotMatch(html, /Profil local indisponible/);
});

test('a new machine without Git has an installation and retry path before choosing a repository', () => {
  const html = renderApp(
    snapshot({ projects: [], tools: { ...tools, git: { available: false, version: null, message: 'Not installed' } } }),
  );
  assert.match(html, /<button[^>]*disabled=""[^>]*>Choisir un dossier<\/button>/);
  assert.match(html, /Installer Git/);
  assert.match(html, /Vérifier Git/);
});

test('re-pairing keeps the verification code visible while the previous connection is retained', () => {
  const html = renderApp(
    snapshot({
      pairing: {
        userCode: 'NEWC-ODE1',
        verificationUrl: 'https://example.com/setup',
        expiresAt: '2099-01-01T00:00:00Z',
        intervalSeconds: 5,
      },
    }),
  );
  assert.match(html, /NEWC-ODE1/);
  assert.match(html, /En attente de ton autorisation/);
  assert.doesNotMatch(html, />Démarrer l’agent</);
});

test('a project with a non-Docker tunnel can start without Docker when its actual requirements are satisfied', () => {
  const state = snapshot({
    dockerRequired: false,
    tools: { ...tools, docker: { available: false, version: null, message: 'Not installed' } },
  });
  const html = renderApp(state);
  const startButton = html.match(/<button[^>]*>Démarrer l’agent<\/button>/)?.[0];
  assert.ok(startButton);
  assert.doesNotMatch(startButton, /disabled/);
});

test('Codex authentication alone does not enable Start when model discovery failed', () => {
  const html = renderApp(snapshot({ models: [] }));
  assert.match(html, /<button[^>]*disabled=""[^>]*>Démarrer l’agent<\/button>/);
  assert.match(html, /Modèles indisponibles/);
});

test('an agent doing backend work cannot be stopped or reconfigured from the renderer', () => {
  const html = renderApp(snapshot({ status: 'online', running: true, busy: true }));
  assert.match(html, /<button[^>]*disabled=""[^>]*>Arrêter l’agent<\/button>/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Configurer<\/button>/);
  assert.match(html, /Une session est en cours/);
});

test('connection errors with a live runtime retain Stop rather than offering another Start', () => {
  const html = renderApp(snapshot({ status: 'error', running: true }));
  assert.match(html, /Arrêter l’agent/);
  assert.doesNotMatch(html, />Démarrer l’agent</);
});

test('the project form accepts automatic session port templates without parsing them as URLs', () => {
  const html = renderToStaticMarkup(
    createElement(ProjectForm, {
      draft: project,
      bridge: bridgeFor(snapshot()),
      busy: false,
      run: () => {},
      onClose: () => {},
    }),
  );
  assert.match(html, /attribué automatiquement à chaque session/);
  assert.match(html, /http:\/\/127\.0\.0\.1:{{hostPort}}/);
  assert.match(html, /value="npm run dev -- --host 127\.0\.0\.1 --port {{hostPort}}" selected/);
});

test('pairing completion checks the newly connected machine before presenting its prerequisites', async (context) => {
  const client = new QueryClient();
  context.after(() => client.clear());
  const calls: string[] = [];
  const pending = snapshot({
    connection: null,
    projects: [],
    tools: null,
    pairing: {
      userCode: 'ABCD-EFGH',
      verificationUrl: 'https://example.com/setup',
      expiresAt: '2099-01-01T00:00:00Z',
      intervalSeconds: 5,
    },
  });
  const connected = snapshot({ tools: null });
  const ready = snapshot();
  const result = await readDesktopSnapshot(
    bridgeFor(pending, {
      pollPairing: async () => {
        calls.push('pair');
        return connected;
      },
      checkTools: async () => {
        calls.push('tools');
        return ready;
      },
    }),
    (snapshot) => client.setQueryData(['desktop-agent'], snapshot),
  );
  assert.deepEqual(calls, ['pair', 'tools']);
  assert.equal(result.connection?.agentId, 'agent');
  assert.equal(result.tools?.codex.authenticated, true);
});

test('an unavailable pairing server keeps its code cancellable and exposes the connection error', async (context) => {
  const client = new QueryClient();
  context.after(() => client.clear());
  client.setQueryData(['desktop-agent'], snapshot({ connection: null, pairing: null }));
  const pending = snapshot({
    connection: null,
    pairing: {
      userCode: 'ABCD-EFGH',
      verificationUrl: 'https://example.com/setup',
      expiresAt: '2099-01-01T00:00:00Z',
      intervalSeconds: 5,
    },
  });
  await assert.rejects(
    readDesktopSnapshot(
      bridgeFor(pending, {
        pollPairing: async () => {
          throw new Error('PairDock server unavailable');
        },
      }),
      (snapshot) => client.setQueryData(['desktop-agent'], snapshot),
    ),
    /PairDock server unavailable/,
  );
  const cached = client.getQueryData<DesktopAgentSnapshot>(['desktop-agent']);
  assert.equal(cached?.pairing?.userCode, 'ABCD-EFGH');
  assert.equal(cached?.connection, null);
});
