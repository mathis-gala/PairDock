import { useSyncExternalStore } from 'react';
import type { AuthSession } from '../schemas/auth.js';

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
    const parsedSession = JSON.parse(serializedSession) as Partial<AuthSession>;

    if (
      typeof parsedSession.accessToken !== 'string' ||
      (parsedSession.provider !== 'github' && parsedSession.provider !== 'slack') ||
      !parsedSession.user ||
      typeof parsedSession.user.id !== 'string' ||
      typeof parsedSession.user.email !== 'string' ||
      (parsedSession.user.kind !== 'developer' && parsedSession.user.kind !== 'pm')
    ) {
      return null;
    }

    return {
      accessToken: parsedSession.accessToken,
      provider: parsedSession.provider,
      user: {
        id: parsedSession.user.id,
        email: parsedSession.user.email,
        displayName: parsedSession.user.displayName ?? null,
        kind: parsedSession.user.kind,
      },
    } satisfies AuthSession;
  } catch {
    return null;
  }
}
