import type { DesktopAgentSnapshot } from '@pairdock/local-agent/desktop-contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { DesktopBridge } from '../shared/bridge.js';

const snapshotKey = ['desktop-agent'] as const;
const preferencesKey = ['desktop-preferences'] as const;

interface DesktopActionContext {
  readinessProjectKey: string;
}

export type DesktopActionRunner = (
  label: string,
  execute: () => Promise<unknown>,
  context?: DesktopActionContext,
) => void;

export interface DesktopReadinessOperation {
  projectKey: string;
  status: 'checking' | 'failed';
  error: string | null;
}

interface DesktopAction {
  label: string;
  execute: () => Promise<unknown>;
  readinessProjectKey?: string;
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

export async function checkDesktopProject(bridge: DesktopBridge, projectKey: string): Promise<DesktopAgentSnapshot> {
  await bridge.checkTools();
  return bridge.runReadiness(projectKey);
}

export function useDesktopAgent(bridge: DesktopBridge) {
  const client = useQueryClient();
  const [failedReadiness, setFailedReadiness] = useState<Record<string, DesktopReadinessOperation>>({});
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
    onError: (error, command) => {
      const projectKey = command.readinessProjectKey;
      if (projectKey) {
        setFailedReadiness((current) => ({
          ...current,
          [projectKey]: { projectKey, status: 'failed', error: error.message },
        }));
      }
    },
    onSettled: async (_result, error, command) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: snapshotKey }),
        client.invalidateQueries({ queryKey: preferencesKey }),
      ]);
      const projectKey = command.readinessProjectKey;
      if (!error && projectKey) {
        setFailedReadiness((current) => {
          const next = { ...current };
          delete next[projectKey];
          return next;
        });
      }
    },
  });

  function run(label: string, execute: () => Promise<unknown>, context?: DesktopActionContext) {
    if (!action.isPending) {
      action.mutate({ label, execute, readinessProjectKey: context?.readinessProjectKey });
    }
  }

  function retryInitialization() {
    run('Chargement du profil local', () => initializeDesktopProfile(bridge, publishSnapshot));
  }

  let readinessOperation: DesktopReadinessOperation | null = null;
  if (action.variables?.readinessProjectKey && (action.isPending || action.isError)) {
    readinessOperation = {
      projectKey: action.variables.readinessProjectKey,
      status: action.isPending ? 'checking' : 'failed',
      error: action.error?.message ?? null,
    };
  }
  const readinessOperations = { ...failedReadiness };
  if (readinessOperation) readinessOperations[readinessOperation.projectKey] = readinessOperation;

  return { snapshot, preferences, action, run, retryInitialization, readinessOperation, readinessOperations };
}
