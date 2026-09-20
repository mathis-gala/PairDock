import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api/client.js';

// Reflect companion connection changes while the device page is open.
const AGENT_REFRESH_INTERVAL_MS = 5_000;

export function useDeveloperAgents(accessToken: string) {
  const api = createApiClient(accessToken);
  const queryClient = useQueryClient();
  const queryKey = ['developer-agents', accessToken];
  const agentsQuery = useQuery({
    queryKey,
    queryFn: () => api.agents.list(),
    refetchInterval: AGENT_REFRESH_INTERVAL_MS,
  });
  const revokeMutation = useMutation({
    mutationFn: (agentId: string) => api.agents.revoke(agentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: ['developer-project-setup', accessToken] });
      void queryClient.invalidateQueries({ queryKey: ['developer-projects', accessToken] });
    },
  });
  return { agentsQuery, revokeMutation };
}

export function useAgentPairing(accessToken: string, userCode: string | null) {
  const api = createApiClient(accessToken);
  const queryClient = useQueryClient();
  const pairingQuery = useQuery({
    queryKey: ['agent-pairing', accessToken, userCode],
    queryFn: () => api.agents.pairing(userCode ?? ''),
    enabled: Boolean(userCode),
    retry: false,
    staleTime: 0,
  });
  const approveMutation = useMutation({
    mutationFn: (code: string) => api.agents.approve(code),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['developer-agents', accessToken] });
      void queryClient.invalidateQueries({ queryKey: ['developer-project-setup', accessToken] });
      queryClient.removeQueries({ queryKey: ['agent-pairing', accessToken, userCode] });
    },
  });
  return { pairingQuery, approveMutation };
}
