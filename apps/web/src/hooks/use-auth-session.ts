import { useSyncExternalStore } from 'react';
import { type AuthSession, authSessionSchema } from '../schemas/auth.js';

const AUTH_STORAGE_KEY = 'pairdock.auth.session';
let cachedSerializedSession: string | null | undefined;
let cachedAuthSession: AuthSession | null = null;

export function useAuthSession(): AuthSession | null {
  return useSyncExternalStore(subscribe, getAuthSessionSnapshot, getAuthSessionSnapshot);
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

export function getAuthSessionSnapshot(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const callbackSession = readCallbackSession();

  if (callbackSession) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(callbackSession));
    cachedSerializedSession = undefined;
    cleanCallbackHash();
  }

  const serializedSession = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (serializedSession === cachedSerializedSession) {
    return cachedAuthSession;
  }

  cachedSerializedSession = serializedSession;

  if (!serializedSession) {
    cachedAuthSession = null;
    return null;
  }

  try {
    const parsed = authSessionSchema.safeParse(JSON.parse(serializedSession));
    cachedAuthSession = parsed.success ? parsed.data : null;
    return cachedAuthSession;
  } catch {
    cachedAuthSession = null;
    return null;
  }
}

function readCallbackSession(): AuthSession | null {
  if (!window.location) {
    return null;
  }

  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const serializedSession = params.get('pairdock_auth');

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

function cleanCallbackHash(): void {
  if (!window.location || !window.history) {
    return;
  }

  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}
