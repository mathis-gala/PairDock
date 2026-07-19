import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '../api/client.js';

export function useSharedSessionHistory(accessToken: string) {
  const api = createApiClient(accessToken);

  return useQuery({
    queryKey: ['shared-session-history', accessToken],
    queryFn: () => api.projects.listSharedSessionHistory(),
  });
}
