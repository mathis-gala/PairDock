import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

export const PAIRDOCK_DOCKER_OWNER_LABEL = 'com.pairdock.owner';
export const PAIRDOCK_DOCKER_SESSION_LABEL = 'com.pairdock.session';

interface ManagedDockerContainer {
  name: string;
  sessionId: string;
}

interface DockerOrphanReconcilerDependencies {
  listManagedContainers?: (ownerId: string) => Promise<ManagedDockerContainer[]>;
  stopContainers?: (names: string[]) => Promise<void>;
}

export interface DockerOrphanReconcileInput {
  ownerId: string;
  activeSessionIds: ReadonlySet<string>;
}

export class DockerOrphanReconciler {
  constructor(private readonly dependencies: DockerOrphanReconcilerDependencies = {}) {}

  async reconcile(input: DockerOrphanReconcileInput): Promise<void> {
    const containers = await (this.dependencies.listManagedContainers ?? listManagedContainers)(input.ownerId);
    const orphanNames = containers
      .filter((container) => !input.activeSessionIds.has(container.sessionId))
      .map((container) => container.name);

    if (orphanNames.length > 0) {
      await (this.dependencies.stopContainers ?? stopContainers)(orphanNames);
    }
  }
}

const execFileAsync = promisify(execFile);

async function listManagedContainers(ownerId: string): Promise<ManagedDockerContainer[]> {
  const { stdout } = await execFileAsync('docker', [
    'ps',
    '--filter',
    `label=${PAIRDOCK_DOCKER_OWNER_LABEL}=${ownerId}`,
    '--format',
    `{{.Names}}\t{{.Label "${PAIRDOCK_DOCKER_SESSION_LABEL}"}}`,
  ]);

  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, sessionId] = line.split('\t');
      if (!name || !sessionId || !/^pairdock-(?:tunnel-)?[a-z0-9-]+$/.test(name)) {
        throw new Error('Docker returned an invalid PairDock managed-resource record.');
      }
      return { name, sessionId };
    });
}

async function stopContainers(names: string[]): Promise<void> {
  await execFileAsync('docker', ['stop', ...names]);
}
