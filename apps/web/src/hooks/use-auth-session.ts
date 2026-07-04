import { useSyncExternalStore } from 'react';
import { type AuthSession, authSessionSchema } from '../schemas/auth.js';

const AUTH_STORAGE_KEY = 'pairdock.auth.session';

export function useAuthSession(): AuthSession | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function setAuthSession(session: AuthSession): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(AUTH_STORAGE_KEY));
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_STORAGE_KEY));
}

function subscribe(listener: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const notify = () => listener();
  window.addEventListener('storage', notify);
  window.addEventListener(AUTH_STORAGE_KEY, notify);

  return () => {
    window.removeEventListener('storage', notify);
    window.removeEventListener(AUTH_STORAGE_KEY, notify);
  };
}

function getSnapshot(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const serializedSession = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!serializedSession) {
    return null;
  }

  try {
    const parsed = authSessionSchema.safeParse(JSON.parse(serializedSession));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
