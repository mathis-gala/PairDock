import { agentPairingUserCodeSchema } from '@pairdock/shared-contracts';
import { useSyncExternalStore } from 'react';
import type { AppRoute } from '../routing/route-types.js';

const loginRoute: AppRoute = { kind: 'login' };
let cachedHash: string | null = null;
let cachedRoute: AppRoute = loginRoute;

export function useAppRoute(): AppRoute {
  return useSyncExternalStore(subscribe, getAppRouteSnapshot, getAppRouteSnapshot);
}

export function openLogin(): void {
  setHash('/login');
}

export function openDeveloperHome(): void {
  setHash('/developer');
}

export function developerProjectSetupHash(agentProjectKey: string): string {
  return `#/developer?agentProjectKey=${encodeURIComponent(agentProjectKey)}`;
}

export function developerAgentsHash(userCode: string | null = null): string {
  return userCode ? `#/developer/agents?code=${encodeURIComponent(userCode)}` : '#/developer/agents';
}

export function openDeveloperAgents(userCode: string | null = null): void {
  setHash(developerAgentsHash(userCode));
}

export function openPmDashboard(): void {
  setHash('/pm');
}

export function openPmSession(sessionId: string): void {
  setHash(`/pm/sessions/${sessionId}`);
}

export function openPmSessionHistory(): void {
  setHash('/pm/sessions');
}

export function openPmReviewRequests(): void {
  setHash('/pm/review-requests');
}

function subscribe(listener: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}

export function getAppRouteSnapshot(): AppRoute {
  if (typeof window === 'undefined') {
    return loginRoute;
  }

  const currentHash = window.location.hash;
  if (currentHash === cachedHash) {
    return cachedRoute;
  }

  cachedHash = currentHash;
  cachedRoute = parseHash(currentHash);
  return cachedRoute;
}

function parseHash(hashValue: string): AppRoute {
  const normalizedHash = hashValue.replace(/^#/, '').replace(/\/$/, '');

  const [pathname, search = ''] = normalizedHash.split('?');
  if (pathname === '/developer/agents') {
    const code = agentPairingUserCodeSchema.safeParse(new URLSearchParams(search).get('code'));
    return { kind: 'developer-agents', userCode: code.success ? code.data : null };
  }

  if (pathname === '/developer') {
    const agentProjectKey = new URLSearchParams(search).get('agentProjectKey')?.trim();
    if (agentProjectKey && agentProjectKey.length <= 128) {
      return { kind: 'developer-home', agentProjectKey };
    }
    return { kind: 'developer-home' };
  }

  const developerSessionRouteMatch = normalizedHash.match(/^\/developer\/sessions\/([0-9a-f-]{36})$/i);
  if (developerSessionRouteMatch?.[1]) {
    return { kind: 'developer-session', sessionId: developerSessionRouteMatch[1] };
  }

  if (normalizedHash === '/pm') {
    return { kind: 'pm-dashboard' };
  }

  if (normalizedHash === '/pm/sessions') {
    return { kind: 'pm-session-history' };
  }

  if (normalizedHash === '/pm/review-requests') {
    return { kind: 'pm-review-requests' };
  }

  const sessionRouteMatch = normalizedHash.match(/^\/pm\/sessions\/([0-9a-f-]{36})$/i);
  if (sessionRouteMatch?.[1]) {
    return { kind: 'pm-session', sessionId: sessionRouteMatch[1] };
  }

  return loginRoute;
}

function setHash(nextHash: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.hash = nextHash;
}
