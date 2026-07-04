const DEFAULT_BACKEND_URL = 'http://127.0.0.1:3000';

export function getBackendUrl(): string {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  return configuredUrl && configuredUrl.length > 0 ? configuredUrl.replace(/\/$/, '') : DEFAULT_BACKEND_URL;
}
