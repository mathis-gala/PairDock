import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parse } from 'yaml';
import viteConfig from '../../apps/web/vite.config.js';

test('PairDock publishes a self-preview manifest backed by local development services', async () => {
  const sandboxDockerfile = await readFile(new URL('../../deploy/Dockerfile.sandbox', import.meta.url), 'utf8');
  const manifest = parse(await readFile(new URL('../../pairdock.yml', import.meta.url), 'utf8')) as {
    name?: unknown;
    repoFullName?: unknown;
    sandbox?: {
      env?: Record<string, unknown>;
      image?: unknown;
      network?: unknown;
      ports?: unknown;
    };
    preview?: { start?: unknown; tunnel?: unknown };
    version?: unknown;
  };

  assert.equal(manifest.version, 1);
  assert.equal(manifest.name, 'PairDock');
  assert.equal(manifest.repoFullName, 'mathis-gala/PairDock');
  assert.equal(manifest.sandbox?.image, 'pairdock/self-preview-sandbox:node22-bun1.3.14');
  assert.equal(manifest.sandbox?.network, 'host-services');
  assert.equal(
    manifest.sandbox?.env?.DATABASE_URL,
    'postgresql://postgres:pairdockdev@host.docker.internal:55432/pairdock',
  );
  assert.equal(manifest.sandbox?.env?.DEV_AUTH_ENABLED, 'true');
  assert.equal(manifest.sandbox?.env?.VITE_API_BASE_URL, 'same-origin');
  assert.equal(manifest.sandbox?.env?.PAIRDOCK_DEV_API_PROXY_TARGET, 'http://127.0.0.1:3100');
  assert.deepEqual(manifest.sandbox?.ports, ['127.0.0.1:{{hostPort}}:4000']);
  assert.match(String(manifest.preview?.start), /db:migrate/);
  assert.match(String(manifest.preview?.start), /apps\/api/);
  assert.match(String(manifest.preview?.start), /apps\/web/);
  assert.equal(manifest.preview?.tunnel, 'cloudflare');
  assert.match(sandboxDockerfile, /FROM node:22-bookworm-slim@sha256:/);
  assert.match(sandboxDockerfile, /npm install --global bun@1\.3\.14/);
  assert.match(sandboxDockerfile, /openssl/);
});

test('the Vite preview proxies API routes and sockets to the local PairDock API', () => {
  const proxy = (viteConfig as { server?: { proxy?: Record<string, { target?: string; ws?: boolean }> } }).server
    ?.proxy;

  assert.equal(proxy?.['/auth']?.target, 'http://127.0.0.1:3000');
  assert.equal(proxy?.['/projects']?.target, 'http://127.0.0.1:3000');
  assert.equal(proxy?.['/sessions']?.target, 'http://127.0.0.1:3000');
  assert.equal(proxy?.['/tool-readiness']?.target, 'http://127.0.0.1:3000');
  assert.equal(proxy?.['/socket.io']?.target, 'http://127.0.0.1:3000');
  assert.equal(proxy?.['/socket.io']?.ws, true);
});
