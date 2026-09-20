import type { DesktopAgentSnapshot } from '@pairdock/local-agent/desktop-contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DesktopBridge } from '../shared/bridge.js';

const snapshotKey = ['desktop-agent'] as const;
const preferencesKey = ['desktop-preferences'] as const;

export type DesktopActionRunner = (label: string, execute: () => Promise<unknown>) => void;

interface DesktopAction {
  label: string;
  execute: () => Promise<unknown>;
}

export async function readDesktopSnapshot(
  bridge: DesktopBridge,
  publishSnapshot: (snapshot: DesktopAgentSnapshot) => void,
): Promise<DesktopAgentSnapshot> {
  let snapshot = await bridge.getSnapshot();
  publishSnapshot(snapshot);
  if (!snapshot.initialized) return snapshot;
  if (snapshot.pairing) {
    snapshot = await bridge.pollPairing();
    publishSnapshot(snapshot);
  }
  if (snapshot.connection && !snapshot.tools) {
    snapshot = await bridge.checkTools();
  }
  return snapshot;
}

export async function initializeDesktopProfile(
  bridge: DesktopBridge,
  publishSnapshot: (snapshot: DesktopAgentSnapshot) => void,
): Promise<DesktopAgentSnapshot> {
  await bridge.initialize();
  return readDesktopSnapshot(bridge, publishSnapshot);
}

export function useDesktopAgent(bridge: DesktopBridge) {
  const client = useQueryClient();
  function publishSnapshot(snapshot: DesktopAgentSnapshot) {
    client.setQueryData(snapshotKey, snapshot);
  }
  const snapshot = useQuery({
    queryKey: snapshotKey,
    queryFn: () => readDesktopSnapshot(bridge, publishSnapshot),
    refetchInterval: 2_000,
    retry: false,
  });
  const preferences = useQuery({
    queryKey: preferencesKey,
    queryFn: () => bridge.getPreferences(),
    retry: false,
  });
  const action = useMutation({
    mutationFn: (command: DesktopAction) => command.execute(),
    onSettled: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: snapshotKey }),
        client.invalidateQueries({ queryKey: preferencesKey }),
      ]);
    },
  });

  function run(label: string, execute: () => Promise<unknown>) {
    if (!action.isPending) {
      action.mutate({ label, execute });
    }
  }

  function retryInitialization() {
    run('Chargement du profil local', () => initializeDesktopProfile(bridge, publishSnapshot));
  }

  return { snapshot, preferences, action, run, retryInitialization };
}
