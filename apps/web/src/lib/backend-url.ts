const DEFAULT_BACKEND_URL = 'http://127.0.0.1:3000';

export function getBackendUrl(): string {
  const runtimeUrl = typeof window === 'undefined' ? undefined : window.__PAIRDOCK_CONFIG__?.apiBaseUrl;
  const buildUrl = (import.meta as ImportMeta & { env?: ImportMetaEnv }).env?.VITE_API_BASE_URL;
  const configuredUrl = runtimeUrl?.trim() || buildUrl?.trim();

  return configuredUrl && configuredUrl.length > 0 ? configuredUrl.replace(/\/$/, '') : DEFAULT_BACKEND_URL;
}
