import { useSyncExternalStore } from 'react';
import type { AppRoute } from '../routing/route-types.js';

export function useAppRoute(): AppRoute {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function openLogin(): void {
  setHash('/login');
}

export function openDeveloperHome(): void {
  setHash('/developer');
}

export function openPmDashboard(): void {
  setHash('/pm');
}

export function openPmSession(sessionId: string): void {
  setHash(`/pm/sessions/${sessionId}`);
}

function subscribe(listener: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}

function getSnapshot(): AppRoute {
  if (typeof window === 'undefined') {
    return { kind: 'login' };
  }

  return parseHash(window.location.hash);
}

function parseHash(hashValue: string): AppRoute {
  const normalizedHash = hashValue.replace(/^#/, '').replace(/\/$/, '');

  if (normalizedHash === '/developer') {
    return { kind: 'developer-home' };
  }

  if (normalizedHash === '/pm') {
    return { kind: 'pm-dashboard' };
  }

  const sessionRouteMatch = normalizedHash.match(/^\/pm\/sessions\/([0-9a-f-]{36})$/i);
  if (sessionRouteMatch?.[1]) {
    return { kind: 'pm-session', sessionId: sessionRouteMatch[1] };
  }

  return { kind: 'login' };
}

function setHash(nextHash: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.hash = nextHash;
}
