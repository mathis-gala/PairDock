import type { ProjectReadinessSnapshot } from '../schemas/project-readiness.js';

interface ReadinessApi {
  getReadiness(projectId: string, signal?: AbortSignal): Promise<ProjectReadinessSnapshot | null>;
  requestReadinessCheck(projectId: string, signal?: AbortSignal): Promise<void>;
}

interface ReadinessRequestOptions {
  pollIntervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

const READINESS_POLL_INTERVAL_MS = 1_500;
const READINESS_TIMEOUT_MS = 90_000;

export async function requestProjectReadiness(
  api: ReadinessApi,
  projectId: string,
  options: ReadinessRequestOptions = {},
): Promise<ProjectReadinessSnapshot> {
  const controller = new AbortController();
  const { signal } = controller;
  const cancel = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener('abort', cancel, { once: true });
  if (options.signal?.aborted) cancel();
  let pollTimer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: () => void = () => undefined;
  const aborted = new Promise<never>((_resolve, reject) => {
    onAbort = () => reject(signal.reason);
    if (signal.aborted) onAbort();
    else signal.addEventListener('abort', onAbort, { once: true });
  });
  const deadline = setTimeout(() => {
    controller.abort(
      new Error(
        'Aucun résultat récent reçu à temps. Vérifiez que l’application PairDock est ouverte et que l’agent est connecté, puis réessayez.',
      ),
    );
  }, options.timeoutMs ?? READINESS_TIMEOUT_MS);

  async function waitForResult(): Promise<ProjectReadinessSnapshot> {
    signal.throwIfAborted();
    // Compare server timestamps, not the browser clock; checks may finish before the POST response.
    const previous = await api.getReadiness(projectId, signal);
    signal.throwIfAborted();
    await api.requestReadinessCheck(projectId, signal);
    while (true) {
      signal.throwIfAborted();
      const current = await api.getReadiness(projectId, signal);
      signal.throwIfAborted();
      if (current && (!previous || Date.parse(current.updatedAt) > Date.parse(previous.updatedAt))) {
        return current;
      }
      await new Promise<void>((resolve) => {
        pollTimer = setTimeout(resolve, options.pollIntervalMs ?? READINESS_POLL_INTERVAL_MS);
      });
    }
  }

  try {
    return await Promise.race([waitForResult(), aborted]);
  } catch (error) {
    if (signal.aborted) throw signal.reason;
    const detail = error instanceof Error ? error.message : 'Erreur inconnue.';
    throw new Error(`La vérification n’a pas pu aboutir. ${detail}`, { cause: error });
  } finally {
    clearTimeout(deadline);
    clearTimeout(pollTimer);
    signal.removeEventListener('abort', onAbort);
    options.signal?.removeEventListener('abort', cancel);
  }
}
