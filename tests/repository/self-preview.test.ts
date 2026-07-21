import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parse } from 'yaml';
import viteConfig from '../../apps/web/vite.config.js';

test('PairDock self-preview runs the web app against the already configured local API without copying secrets', async () => {
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
    PAIRDOCK_DEV_API_PROXY_TARGET: 'http://host.docker.internal:3000',
    VITE_API_BASE_URL: 'same-origin',
  });
  assert.match(String(manifest.preview?.start), /apps\/web/);
  assert.doesNotMatch(String(manifest.preview?.start), /apps\/api|db:migrate|prisma/);
});

test('the self-preview sandbox image supplies the pinned Bun runtime required by PairDock', async () => {
  const dockerfile = await readFile(new URL('../../deploy/Dockerfile.sandbox', import.meta.url), 'utf8');

  assert.match(dockerfile, /FROM node:22-bookworm-slim@sha256:/);
  assert.match(dockerfile, /npm install --global bun@1\.3\.14/);
  assert.match(dockerfile, /openssl/);
});

test('the self-preview web server proxies browser API and WebSocket traffic to the configured local API', () => {
  const proxy = (viteConfig as { server?: { proxy?: Record<string, { target?: string; ws?: boolean }> } }).server
    ?.proxy;

  assert.equal(proxy?.['/auth']?.target, 'http://127.0.0.1:3000');
  assert.equal(proxy?.['/projects']?.target, 'http://127.0.0.1:3000');
  assert.equal(proxy?.['/sessions']?.target, 'http://127.0.0.1:3000');
  assert.equal(proxy?.['/tool-readiness']?.target, 'http://127.0.0.1:3000');
  assert.equal(proxy?.['/socket.io']?.target, 'http://127.0.0.1:3000');
  assert.equal(proxy?.['/socket.io']?.ws, true);
});
