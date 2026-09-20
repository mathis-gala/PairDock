import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer, request, type Server } from 'node:http';
import type { Socket } from 'node:net';
import test from 'node:test';
import { brotliCompressSync, deflateSync, gzipSync } from 'node:zlib';
import { Server as SocketIOServer } from 'socket.io';
import { io } from 'socket.io-client';
import { InstrumentedPreviewTunnelAdapter } from '../../../../packages/local-agent/src/tunnel/instrumented-preview-tunnel.adapter.js';
import type {
  PreviewTunnelOpenInput,
  PreviewTunnelPort,
  PreviewTunnelRef,
} from '../../../../packages/local-agent/src/tunnel/preview-tunnel.port.js';

test('managed previews serve the element picker from the preview origin and close its listener with the tunnel', async (t) => {
  const upstream = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html', etag: 'original-html' });
    response.end('<!doctype html><html><body><button>Save</button></body></html>');
  });
  const localUrl = await listen(upstream);
  t.after(() => close(upstream));
  const tunnel = new LocalTunnel();
  const adapter = new InstrumentedPreviewTunnelAdapter(tunnel);
  const ref = await adapter.open(input(localUrl));
  t.after(() => adapter.close(ref));

  assert.notEqual(tunnel.opened[0]?.localUrl, localUrl);
  const response = await fetch(ref.publicUrl);
  const html = await response.text();
  assert.match(html, /<button>Save<\/button>/);
  const scriptPath = /<script[^>]+src="([^"]+)"[^>]+data-pairdock-preview-picker/.exec(html)?.[1];
  assert.ok(scriptPath, 'The HTML must load the picker as a same-origin script');
  const script = await fetch(new URL(scriptPath, ref.publicUrl));
  assert.match(script.headers.get('content-type') ?? '', /javascript/);
  assert.ok((await script.text()).includes('postMessage'));
  assert.equal(response.headers.get('etag'), null);
  assert.equal(response.headers.get('cache-control'), 'no-store');

  await adapter.close(ref);
  await assert.rejects(fetch(ref.publicUrl, { signal: AbortSignal.timeout(500) }));
});

test('compressed HTML is instrumented without weakening CSP or leaving stale encoding and integrity headers', async (t) => {
  const policy = "default-src 'self'; script-src 'none'";
  const html = `<html><head><meta http-equiv="Content-Security-Policy" content="${policy}"></head><body>Hello</body></html>`;
  const compressedBodies = new Map([
    ['gzip', gzipSync(html)],
    ['br', brotliCompressSync(html)],
    ['deflate', deflateSync(html)],
  ]);
  const upstream = createServer((request, response) => {
    const encoding = request.url?.slice(1);
    const body = compressedBodies.get(encoding ?? '');
    assert.ok(body);
    response.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'content-encoding': encoding,
      'content-length': body.length,
      'content-security-policy': policy,
      'content-md5': 'original-digest',
    });
    response.end(body);
  });
  const adapter = new InstrumentedPreviewTunnelAdapter(new LocalTunnel());
  const ref = await adapter.open(input(await listen(upstream)));
  t.after(() => close(upstream));
  t.after(() => adapter.close(ref));
  for (const encoding of compressedBodies.keys()) {
    const response = await fetch(new URL(`/${encoding}`, ref.publicUrl));
    const body = await response.text();
    assert.match(body, /data-pairdock-preview-picker/);
    assert.ok(body.includes(`<meta http-equiv="Content-Security-Policy" content="${policy}">`));
    assert.equal(response.headers.get('content-security-policy'), policy);
    assert.equal(response.headers.get('content-encoding'), null);
    assert.equal(response.headers.get('content-md5'), null);
  }
});

test('oversized and decompression-heavy HTML passes through intact instead of being buffered without a bound', async (t) => {
  const html = `<html><body>${'x'.repeat(2 * 1024 * 1024)}</body></html>`;
  const upstream = createServer((request, response) => {
    response.writeHead(200, {
      'content-type': 'text/html',
      ...(request.url === '/gzip' ? { 'content-encoding': 'gzip' } : {}),
    });
    response.write(request.url === '/gzip' ? gzipSync(html) : html);
    response.end();
  });
  const adapter = new InstrumentedPreviewTunnelAdapter(new LocalTunnel());
  const ref = await adapter.open(input(await listen(upstream)));
  t.after(() => close(upstream));
  t.after(() => adapter.close(ref));
  for (const path of ['/', '/gzip']) {
    const response = await fetch(new URL(path, ref.publicUrl));
    assert.equal(await response.text(), html);
  }
});

test('picker loads before app scripts but after CSP meta without changing inline script literals or text encoding', async (t) => {
  const meta = '<meta http-equiv="content-security-policy" content="script-src \'self\'">';
  const application = '<script>window.template = "</body>";</script>';
  const html = `<html><head>${meta}${application}</head><body>Café</body></html>`;
  const upstream = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=iso-8859-1' });
    response.end(Buffer.from(html, 'latin1'));
  });
  const adapter = new InstrumentedPreviewTunnelAdapter(new LocalTunnel());
  const ref = await adapter.open(input(await listen(upstream)));
  t.after(() => close(upstream));
  t.after(() => adapter.close(ref));
  const response = await fetch(ref.publicUrl);
  const body = Buffer.from(await response.arrayBuffer()).toString('latin1');
  assert.ok(body.indexOf('data-pairdock-preview-picker') > body.indexOf(meta) + meta.length);
  assert.ok(body.indexOf('data-pairdock-preview-picker') < body.indexOf(application));
  assert.ok(body.includes(application), 'Existing inline code must remain byte-for-byte intact');
  assert.ok(body.includes('Café'));
});

test('proxy preserves binary assets, POST bodies, cookies, redirects, and live event streams', async (t) => {
  const asset = Buffer.from([0, 255, 7, 31, 128]);
  let localUrl = '';
  const upstream = createServer((request, response) => {
    if (request.url === '/asset') {
      response.writeHead(200, { 'content-type': 'application/octet-stream', etag: 'asset-tag' });
      response.end(asset);
    } else if (request.url === '/submit') {
      response.writeHead(201, { 'content-type': 'text/plain', 'set-cookie': ['a=1; Path=/', 'b=2; HttpOnly'] });
      request.pipe(response);
    } else if (request.url === '/redirect') {
      response.writeHead(302, { location: `${localUrl}/next?tab=one`, 'content-type': 'text/html' });
      response.end('');
    } else if (request.url === '/external') {
      response.writeHead(302, { location: 'https://example.org/docs' });
      response.end('');
    } else {
      response.writeHead(200, { 'content-type': 'text/event-stream' });
      response.write('data: ready\n\n');
    }
  });
  localUrl = await listen(upstream);
  const adapter = new InstrumentedPreviewTunnelAdapter(new LocalTunnel());
  const ref = await adapter.open(input(localUrl));
  t.after(() => close(upstream));
  t.after(() => adapter.close(ref));

  const downloaded = await fetch(new URL('/asset', ref.publicUrl));
  assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), asset);
  assert.equal(downloaded.headers.get('etag'), 'asset-tag');
  const posted = await fetch(new URL('/submit', ref.publicUrl), { method: 'POST', body: 'text=Bonjour&count=2' });
  assert.equal(posted.status, 201);
  assert.equal(await posted.text(), 'text=Bonjour&count=2');
  assert.deepEqual(posted.headers.getSetCookie(), ['a=1; Path=/', 'b=2; HttpOnly']);
  const redirect = await fetch(new URL('/redirect', ref.publicUrl), { redirect: 'manual' });
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.get('location'), '/next?tab=one');
  await redirect.body?.cancel();
  const external = await fetch(new URL('/external', ref.publicUrl), { redirect: 'manual' });
  assert.equal(external.headers.get('location'), 'https://example.org/docs');
  await external.body?.cancel();
  const abort = new AbortController();
  const stream = await fetch(new URL('/events', ref.publicUrl), {
    signal: AbortSignal.any([abort.signal, AbortSignal.timeout(500)]),
  });
  const reader = stream.body?.getReader();
  assert.ok(reader);
  assert.equal(new TextDecoder().decode((await reader.read()).value), 'data: ready\n\n');
  abort.abort();
});

test('WebSocket upgrades carry app messages and tunnel shutdown disconnects both sides', async (t) => {
  const upstream = createServer();
  const websocketServer = new SocketIOServer(upstream, { transports: ['websocket'] });
  websocketServer.on('connection', (socket) => {
    socket.on('echo', (value, acknowledge) => acknowledge(value));
  });
  const adapter = new InstrumentedPreviewTunnelAdapter(new LocalTunnel());
  const ref = await adapter.open(input(await listen(upstream)));
  const client = io(ref.publicUrl, { transports: ['websocket'], reconnection: false, timeout: 1_000 });
  t.after(() => client.disconnect());
  t.after(() => websocketServer.close());
  t.after(() => adapter.close(ref));
  const connected = new Promise<void>((resolve, reject) => {
    client.once('connect', resolve);
    client.once('connect_error', reject);
  });
  await connected;
  assert.deepEqual(await client.timeout(1_000).emitWithAck('echo', { type: 'update', path: '/app.tsx' }), {
    type: 'update',
    path: '/app.tsx',
  });
  const disconnected = new Promise<void>((resolve) => client.once('disconnect', () => resolve()));
  await adapter.close(ref);
  await disconnected;
  assert.equal(client.connected, false);
});

for (const reason of ['shutdown', 'client disconnect']) {
  test(`pending WebSocket upstream connections close on ${reason}`, async (t) => {
    const upstream = createServer();
    const sockets = new Set<Socket>();
    upstream.on('connection', (socket) => sockets.add(socket));
    const upgrade = new Promise<void>((resolve) =>
      upstream.once('upgrade', (_request, socket) => {
        socket.resume();
        resolve();
      }),
    );
    const adapter = new InstrumentedPreviewTunnelAdapter(new LocalTunnel());
    const ref = await adapter.open(input(await listen(upstream)));
    t.after(() => {
      for (const socket of sockets) socket.destroy();
      return close(upstream);
    });
    t.after(() => adapter.close(ref));
    const outgoing = request(ref.publicUrl, { headers: { connection: 'Upgrade', upgrade: 'websocket' } });
    const disconnected = new Promise<void>((resolve) => outgoing.once('error', () => resolve()));
    outgoing.end();
    await upgrade;
    const upstreamClosed = Promise.all(
      [...sockets].map((socket) => once(socket, 'end', { signal: AbortSignal.timeout(500) })),
    );
    if (reason === 'shutdown') await adapter.close(ref);
    else outgoing.destroy();
    await Promise.all([disconnected, upstreamClosed]);
  });
}

test('proxy rejects forward-proxy request targets and leaves download or unsupported HTML encodings intact', async (t) => {
  let received = 0;
  const utf16 = Buffer.from('<html><body>Hello</body></html>', 'utf16le');
  const download = '<html><body>Download</body></html>';
  const upstream = createServer((incoming, response) => {
    received += 1;
    if (incoming.url === '/utf16') {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-16le' });
      response.end(utf16);
    } else {
      response.writeHead(200, { 'content-type': 'text/html', 'content-disposition': 'attachment; filename=page.html' });
      response.end(download);
    }
  });
  const adapter = new InstrumentedPreviewTunnelAdapter(new LocalTunnel());
  const ref = await adapter.open(input(await listen(upstream)));
  t.after(() => close(upstream));
  t.after(() => adapter.close(ref));
  const status = await new Promise<number | undefined>((resolve, reject) => {
    const outgoing = request(ref.publicUrl, { path: 'http://example.org/private' }, (response) => {
      response.resume();
      response.once('end', () => resolve(response.statusCode));
    });
    outgoing.once('error', reject);
    outgoing.end();
  });
  assert.equal(status, 400);
  assert.equal(received, 0);
  assert.deepEqual(Buffer.from(await (await fetch(new URL('/utf16', ref.publicUrl))).arrayBuffer()), utf16);
  assert.equal(await (await fetch(new URL('/download', ref.publicUrl))).text(), download);
});

test('failed tunnel startup and shutdown release the instrumentation listener', async () => {
  let proxyUrl = '';
  const failedStart = new InstrumentedPreviewTunnelAdapter({
    async open(value) {
      proxyUrl = value.localUrl;
      throw new Error('tunnel startup failed');
    },
    async close() {},
  });
  await assert.rejects(failedStart.open(input('http://127.0.0.1:9')), /tunnel startup failed/);
  await assert.rejects(fetch(proxyUrl, { signal: AbortSignal.timeout(500) }));

  const failedClose = new InstrumentedPreviewTunnelAdapter({
    async open(value) {
      return { id: 'failed-close', sessionId: value.sessionId, publicUrl: value.localUrl };
    },
    async close() {
      throw new Error('tunnel shutdown failed');
    },
  });
  const ref = await failedClose.open(input('http://127.0.0.1:9'));
  await assert.rejects(failedClose.close(ref), /tunnel shutdown failed/);
  await assert.rejects(fetch(ref.publicUrl, { signal: AbortSignal.timeout(500) }));
});

test('manually configured public URLs retain their routing instead of being silently replaced', async () => {
  const publicUrl = 'https://custom-preview.example.org/app';
  let opened: PreviewTunnelOpenInput | undefined;
  const adapter = new InstrumentedPreviewTunnelAdapter({
    async open(value) {
      opened = value;
      return { id: 'manual', sessionId: value.sessionId, publicUrl };
    },
    async close() {},
  });
  const configured = { ...input('http://127.0.0.1:9'), previewConfig: { tunnel: { publicUrl } } };
  const ref = await adapter.open(configured);
  assert.equal(ref.publicUrl, publicUrl);
  assert.equal(opened?.localUrl, configured.localUrl);
  await adapter.close(ref);
});

test('slow streaming HTML starts rendering within the buffer deadline', async (t) => {
  const upstream = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html' });
    response.write('<html><body>Loading…');
  });
  const adapter = new InstrumentedPreviewTunnelAdapter(new LocalTunnel());
  const ref = await adapter.open(input(await listen(upstream)));
  t.after(() => close(upstream));
  t.after(() => adapter.close(ref));
  const controller = new AbortController();
  const response = await fetch(ref.publicUrl, {
    signal: AbortSignal.any([controller.signal, AbortSignal.timeout(3_500)]),
  });
  const reader = response.body?.getReader();
  assert.ok(reader);
  assert.equal(new TextDecoder().decode((await reader.read()).value), '<html><body>Loading…');
  controller.abort();
});

function input(localUrl: string): PreviewTunnelOpenInput {
  return { localUrl, projectKey: 'preview', sessionId: 'session-preview', worktreePath: '/tmp' };
}

class LocalTunnel implements PreviewTunnelPort {
  readonly opened: PreviewTunnelOpenInput[] = [];

  async open(value: PreviewTunnelOpenInput): Promise<PreviewTunnelRef> {
    this.opened.push(value);
    return { id: `tunnel-${this.opened.length}`, sessionId: value.sessionId, publicUrl: value.localUrl };
  }

  async close(): Promise<void> {}
}

async function listen(server: Server): Promise<string> {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  return `http://127.0.0.1:${address.port}`;
}

async function close(server: Server): Promise<void> {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
