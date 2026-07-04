import { useState } from 'react';
import { authApi } from '../api/client.js';
import { normalizeSeed } from '../lib/normalize-seed.js';
import type { AuthSession } from '../schemas/auth.js';

export function useAuthenticateDeveloper(onAuthenticated: (session: AuthSession) => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function authenticate(seed: string): Promise<void> {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const trimmedSeed = normalizeSeed(seed, 'developer');
      const session = await authApi.authenticateDeveloper(
        `github:${trimmedSeed}:dev-${trimmedSeed}@pairdock.test:Dev ${trimmedSeed}`,
      );
      onAuthenticated(session);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return { isSubmitting, errorMessage, authenticate };
}

export function useAuthenticatePm(onAuthenticated: (session: AuthSession) => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function authenticate(seed: string, teamId: string): Promise<void> {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const trimmedSeed = normalizeSeed(seed, 'pm');
      const trimmedTeamId = normalizeSeed(teamId, 'team');
      const session = await authApi.authenticatePm(
        `slack:${trimmedSeed}:${trimmedTeamId}:pm-${trimmedSeed}@pairdock.test:PM ${trimmedSeed}`,
      );
      onAuthenticated(session);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return { isSubmitting, errorMessage, authenticate };
}
