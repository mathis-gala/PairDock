import { type ClientRequest, createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { Socket } from 'node:net';
import { brotliDecompressSync, gunzipSync, inflateSync } from 'node:zlib';
import { createProxyServer } from 'http-proxy-3';
import { defaultTreeAdapter, parse } from 'parse5';
import { getPreviewPickerScript, PREVIEW_PICKER_SCRIPT_PATH } from './preview-picker-script.js';

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_HTML_BUFFER_MS = 2_000;

export interface PreviewPickerProxy {
  localUrl: string;
  close(): Promise<void>;
}

export async function startPreviewPickerProxy(localUrl: string): Promise<PreviewPickerProxy> {
  const upstreamUrl = new URL(localUrl);
  if (!['http:', 'https:'].includes(upstreamUrl.protocol) || upstreamUrl.username || upstreamUrl.password) {
    throw new Error('Preview instrumentation requires an HTTP(S) URL without credentials.');
  }

  const sockets = new Set<Socket>();
  const trackSocket = (socket: Socket) => {
    if (sockets.has(socket)) return;
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
  };
  const trackRequestSocket = (request: ClientRequest) => {
    if (request.socket) trackSocket(request.socket);
    else request.once('socket', trackSocket);
  };
  const proxy = createProxyServer({
    target: upstreamUrl.origin,
    selfHandleResponse: true,
    changeOrigin: true,
    proxyTimeout: 0,
    connectTimeout: 10_000,
  });
  proxy.on('proxyReq', (request, incoming) => {
    trackRequestSocket(request);
    if (incoming.headers.accept?.includes('text/html')) {
      request.setHeader('accept-encoding', 'identity');
      request.removeHeader('if-none-match');
      request.removeHeader('if-modified-since');
    }
  });
  proxy.on('proxyReqWs', (request, _incoming, socket) => {
    trackRequestSocket(request);
    const abortHandshake = () => request.destroy();
    socket.once('end', abortHandshake);
    socket.once('close', abortHandshake);
    request.once('close', () => {
      socket.off('end', abortHandshake);
      socket.off('close', abortHandshake);
    });
  });
  proxy.on('open', trackSocket);
  proxy.on('error', (_error, _request, response) => {
    if ('writeHead' in response && !response.headersSent) {
      response.writeHead(502, { 'content-type': 'text/plain' });
      response.end('The preview server is unavailable.');
    } else response.destroy();
  });
  proxy.on('proxyRes', (upstream, request, response) => {
    upstream.once('error', () => response.destroy());
    rewriteLocalRedirect(upstream, upstreamUrl);
    if (request.method !== 'GET' || !canInstrumentHtml(upstream)) {
      copyResponseHeaders(upstream, response);
      upstream.pipe(response);
      return;
    }
    const chunks: Buffer[] = [];
    let size = 0;
    let streaming = false;
    const flushOriginal = () => {
      streaming = true;
      clearTimeout(bufferTimeout);
      upstream.off('data', bufferChunk);
      copyResponseHeaders(upstream, response);
      for (const chunk of chunks) response.write(chunk);
      chunks.length = 0;
      upstream.pipe(response);
    };
    const bufferChunk = (chunk: Buffer) => {
      chunks.push(chunk);
      size += chunk.length;
      if (size > MAX_HTML_BYTES) flushOriginal();
    };
    // Slow or continuously streamed HTML must keep rendering even without instrumentation.
    const bufferTimeout = setTimeout(flushOriginal, MAX_HTML_BUFFER_MS);
    response.once('close', () => clearTimeout(bufferTimeout));
    upstream.on('data', bufferChunk);
    upstream.on('end', () => {
      clearTimeout(bufferTimeout);
      if (streaming) return;
      const original = Buffer.concat(chunks);
      const decoded = decodeHtml(original, upstream.headers['content-encoding']);
      if (!decoded || decoded.subarray(0, 64).includes(0)) {
        copyResponseHeaders(upstream, response);
        response.end(original);
        return;
      }
      const instrumented = injectPicker(decoded);
      for (const name of [
        'content-length',
        'content-encoding',
        'etag',
        'last-modified',
        'content-md5',
        'digest',
        'content-digest',
        'repr-digest',
      ]) {
        delete upstream.headers[name];
      }
      upstream.headers['cache-control'] = 'no-store';
      copyResponseHeaders(upstream, response);
      response.end(instrumented);
    });
  });

  const server = createServer((request, response) => {
    if (!isOriginFormRequest(request)) {
      response.writeHead(400, { 'content-type': 'text/plain' });
      response.end('The preview requires a relative request path.');
      return;
    }
    if (request.url?.split('?')[0] === PREVIEW_PICKER_SCRIPT_PATH && ['GET', 'HEAD'].includes(request.method ?? '')) {
      response.writeHead(200, {
        'content-type': 'text/javascript; charset=utf-8',
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      });
      response.end(request.method === 'HEAD' ? undefined : getPreviewPickerScript());
      return;
    }
    proxy.web(request, response);
  });
  server.on('connection', trackSocket);
  server.on('upgrade', (request, socket, head) => {
    if (!isOriginFormRequest(request)) {
      socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
      return;
    }
    proxy.ws(request, socket, head);
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('The preview instrumentation listener has no port.');
  let closing: Promise<void> | undefined;
  return {
    localUrl: `http://127.0.0.1:${address.port}${upstreamUrl.pathname}${upstreamUrl.search}`,
    close() {
      closing ??= new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        for (const socket of sockets) socket.destroy();
      });
      return closing;
    },
  };
}

function isOriginFormRequest(request: IncomingMessage): boolean {
  return Boolean(request.url?.startsWith('/') && !request.url.startsWith('//') && !request.url.includes('\\'));
}

function canInstrumentHtml(response: IncomingMessage): boolean {
  const contentType = response.headers['content-type'] ?? '';
  if (response.statusCode !== 200 || !/^text\/html(?:;|$)/i.test(contentType)) return false;
  if (/charset\s*=\s*["']?(?:utf-?(?:16|32)|ucs-?2)/i.test(contentType)) return false;
  if (/^attachment(?:;|$)/i.test(response.headers['content-disposition'] ?? '')) return false;
  if (
    response.headers['content-range'] ||
    /(?:^|,)\s*no-transform\s*(?:,|$)/i.test(response.headers['cache-control'] ?? '')
  )
    return false;
  return true;
}

function rewriteLocalRedirect(response: IncomingMessage, upstreamUrl: URL): void {
  const location = response.headers.location;
  if (!location || (!location.startsWith('//') && !/^https?:\/\//i.test(location))) return;
  const redirected = URL.parse(location, upstreamUrl);
  if (redirected?.origin === upstreamUrl.origin) {
    response.headers.location = `${redirected.pathname}${redirected.search}${redirected.hash}`;
  }
}

function injectPicker(body: Buffer): Buffer {
  // Latin-1 gives one character per byte so slicing preserves the document's original encoding.
  const html = body.toString('latin1');
  const document = parse(html, { sourceCodeLocationInfo: true });
  const root = document.childNodes.find(defaultTreeAdapter.isElementNode);
  const head = root?.childNodes.filter(defaultTreeAdapter.isElementNode).find((node) => node.tagName === 'head');
  let offset = head?.sourceCodeLocation?.startTag?.endOffset ?? root?.sourceCodeLocation?.startTag?.endOffset;
  if (offset === undefined) {
    offset = document.childNodes.find((node) => node.nodeName === '#documentType')?.sourceCodeLocation?.endOffset ?? 0;
  }
  if (head && 'childNodes' in head) {
    for (const node of head.childNodes) {
      if (
        'tagName' in node &&
        node.tagName === 'meta' &&
        node.attrs.some(
          (attribute) => attribute.name === 'http-equiv' && attribute.value.toLowerCase() === 'content-security-policy',
        )
      ) {
        offset = Math.max(offset, node.sourceCodeLocation?.endOffset ?? 0);
      }
    }
  }
  const script = `<script src="${PREVIEW_PICKER_SCRIPT_PATH}" data-pairdock-preview-picker></script>`;
  return Buffer.concat([body.subarray(0, offset), Buffer.from(script), body.subarray(offset)]);
}

function decodeHtml(body: Buffer, encoding: string | undefined): Buffer | null {
  try {
    switch (encoding?.trim().toLowerCase()) {
      case undefined:
      case 'identity':
        return body;
      case 'gzip':
        return gunzipSync(body, { maxOutputLength: MAX_HTML_BYTES });
      case 'br':
        return brotliDecompressSync(body, { maxOutputLength: MAX_HTML_BYTES });
      case 'deflate':
        return inflateSync(body, { maxOutputLength: MAX_HTML_BYTES });
      default:
        return null;
    }
  } catch {
    // Preserve responses the proxy cannot safely decode, including decompression size limits.
    return null;
  }
}

function copyResponseHeaders(upstream: IncomingMessage, response: ServerResponse): void {
  const hopHeaders = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
  ]);
  for (const token of upstream.headers.connection?.split(',') ?? []) hopHeaders.add(token.trim().toLowerCase());
  for (const [name, value] of Object.entries(upstream.headers)) {
    if (value !== undefined && !hopHeaders.has(name)) response.setHeader(name, value);
  }
  response.statusCode = upstream.statusCode ?? 502;
}
