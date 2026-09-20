import { agentPairingUserCodeSchema } from '@pairdock/shared-contracts';
import { useSyncExternalStore } from 'react';
import { type AuthSession, authSessionSchema } from '../schemas/auth.js';
import { developerAgentsHash, getAppRouteSnapshot } from './use-app-route.js';

const AUTH_STORAGE_KEY = 'pairdock.auth.session';
const AGENT_RETURN_STORAGE_KEY = 'pairdock.auth.agent-return';
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

export function rememberDeveloperAgentReturn(): void {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return;
  }

  const route = getAppRouteSnapshot();
  window.sessionStorage.removeItem(AGENT_RETURN_STORAGE_KEY);
  if (route.kind === 'developer-agents') {
    window.sessionStorage.setItem(AGENT_RETURN_STORAGE_KEY, route.userCode ?? '');
  }
}

function subscribe(listener: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const notify = () => listener();
  window.addEventListener('storage', notify);
  window.addEventListener('hashchange', notify);
  window.addEventListener(AUTH_STORAGE_KEY, notify);

  return () => {
    window.removeEventListener('storage', notify);
    window.removeEventListener('hashchange', notify);
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
    cleanCallbackHash(callbackSession);
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

function cleanCallbackHash(session: AuthSession): void {
  if (!window.location || !window.history) {
    return;
  }

  const savedCode = window.sessionStorage?.getItem(AGENT_RETURN_STORAGE_KEY);
  window.sessionStorage?.removeItem(AGENT_RETURN_STORAGE_KEY);
  let returnHash = '';
  if (session.user.kind === 'developer' && session.provider === 'github' && savedCode != null) {
    const code = agentPairingUserCodeSchema.safeParse(savedCode);
    if (savedCode === '' || code.success) {
      returnHash = developerAgentsHash(code.success ? code.data : null);
    }
  }

  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${returnHash}`);
}
