import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parse } from 'yaml';
import viteConfig from '../../apps/web/vite.config.js';

test('PairDock self-preview runs its API and web app inside one sandbox without reserving a host API port', async () => {
  const manifest = parse(await readFile(new URL('../../pairdock.yml', import.meta.url), 'utf8')) as {
    name?: unknown;
    repoFullName?: unknown;
    sandbox?: { env?: Record<string, unknown>; image?: unknown; network?: unknown };
    preview?: { start?: unknown };
    version?: unknown;
  };

  assert.equal(manifest.version, 1);
  assert.equal(manifest.name, 'PairDock');
  assert.equal(manifest.repoFullName, undefined);
  assert.equal(manifest.sandbox?.image, 'pairdock/self-preview-sandbox:node22-bun1.3.14');
  assert.equal(manifest.sandbox?.network, 'host-services');
  assert.deepEqual(manifest.sandbox?.env, {
    DATABASE_URL: 'postgresql://postgres:pairdockdev@host.docker.internal:55432/pairdock',
    DEV_PM_AUTH_ENABLED: 'true',
    PAIRDOCK_DEV_API_PROXY_TARGET: 'http://127.0.0.1:3000',
    VITE_API_BASE_URL: 'same-origin',
  });
  assert.equal('AGENT_AUTH_CREDENTIALS_JSON' in (manifest.sandbox?.env ?? {}), false);
  assert.equal('AUTH_STATE_SECRET' in (manifest.sandbox?.env ?? {}), false);
  assert.equal('AUTH_TOKEN_SECRET' in (manifest.sandbox?.env ?? {}), false);
  assert.match(String(manifest.preview?.start), /AGENT_AUTH_CREDENTIALS_JSON/);
  assert.match(String(manifest.preview?.start), /AUTH_STATE_SECRET/);
  assert.match(String(manifest.preview?.start), /AUTH_TOKEN_SECRET/);
  assert.match(String(manifest.preview?.start), /randomBytes/);
  assert.match(String(manifest.preview?.start), /prisma:generate/);
  assert.match(String(manifest.preview?.start), /apps\/api/);
  assert.match(String(manifest.preview?.start), /apps\/web/);
  assert.doesNotMatch(String(manifest.preview?.start), /db:migrate|host\.docker\.internal:3000/);
});

test('the self-preview sandbox image supplies the pinned Bun runtime required by PairDock', async () => {
  const dockerfile = await readFile(new URL('../../deploy/Dockerfile.sandbox', import.meta.url), 'utf8');

  assert.match(dockerfile, /FROM node:22-bookworm-slim@sha256:/);
  assert.match(dockerfile, /npm install --global bun@1\.3\.14/);
  assert.match(dockerfile, /openssl/);
});

test('the self-preview web server proxies browser API and WebSocket traffic to the API inside its container', () => {
  const proxy = (viteConfig as { server?: { proxy?: Record<string, { target?: string; ws?: boolean }> } }).server
    ?.proxy;

  assert.equal(proxy?.['/auth']?.target, 'http://127.0.0.1:3000');
  assert.equal(proxy?.['/projects']?.target, 'http://127.0.0.1:3000');
  assert.equal(proxy?.['/sessions']?.target, 'http://127.0.0.1:3000');
  assert.equal(proxy?.['/tool-readiness']?.target, 'http://127.0.0.1:3000');
  assert.equal(proxy?.['/socket.io']?.target, 'http://127.0.0.1:3000');
  assert.equal(proxy?.['/socket.io']?.ws, true);
});
