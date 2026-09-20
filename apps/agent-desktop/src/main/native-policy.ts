import { isAbsolute, relative, resolve } from 'node:path';

export function validateRendererUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'pairdock:' && url.hostname === 'app' && !url.port && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function resolveRendererAsset(directory: string, value: string): string {
  if (!validateRendererUrl(value)) throw new Error('Untrusted application origin.');
  const pathname = decodeURIComponent(new URL(value).pathname);
  if (pathname.includes('\0') || pathname.includes('\\') || pathname.startsWith('//')) {
    throw new Error('Invalid application asset.');
  }
  const asset = resolve(directory, `.${pathname === '/' ? '/index.html' : pathname}`);
  const within = relative(directory, asset);
  if (within.startsWith('..') || isAbsolute(within)) throw new Error('Invalid application asset.');
  return asset;
}

export function validateExternalUrl(value: string): string {
  const url = new URL(value);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.username || url.password || (url.protocol !== 'https:' && !(loopback && url.protocol === 'http:'))) {
    throw new Error('Only secure web addresses or local development servers can be opened.');
  }
  return url.toString();
}
