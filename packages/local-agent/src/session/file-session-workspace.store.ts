import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';
import type { SessionWorkspace } from './session-registry.js';
import type { SessionWorkspaceStore } from './session-workspace.store.js';

const metadataSchema = z.record(z.string(), z.string());
const workspaceSchema = z
  .object({
    sessionId: z.uuid(),
    projectKey: z.string().min(1),
    repositoryPath: z.string().min(1),
    worktreePath: z.string().min(1),
    branchName: z.string().min(1),
    modelId: z.string().min(1).optional(),
    sandboxRef: z
      .object({
        id: z.string().min(1),
        sessionId: z.uuid(),
        healthcheckUrl: z.url(),
        metadata: metadataSchema.optional(),
      })
      .optional(),
    tunnelRef: z
      .object({
        id: z.string().min(1),
        sessionId: z.uuid(),
        publicUrl: z.url(),
        metadata: metadataSchema.optional(),
      })
      .optional(),
    previewUrl: z.url().optional(),
  })
  .strict()
  .superRefine((workspace, context) => {
    if (workspace.sandboxRef && workspace.sandboxRef.sessionId !== workspace.sessionId) {
      context.addIssue({ code: 'custom', message: 'Sandbox sessionId must match workspace sessionId.' });
    }

    if (workspace.tunnelRef && workspace.tunnelRef.sessionId !== workspace.sessionId) {
      context.addIssue({ code: 'custom', message: 'Tunnel sessionId must match workspace sessionId.' });
    }
  });

const stateSchema = z
  .object({
    version: z.literal(1),
    workspaces: z.array(workspaceSchema),
  })
  .strict()
  .superRefine((state, context) => {
    const sessionIds = new Set<string>();

    for (const [index, workspace] of state.workspaces.entries()) {
      if (sessionIds.has(workspace.sessionId)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate persisted session ${workspace.sessionId}.`,
          path: ['workspaces', index, 'sessionId'],
        });
      }
      sessionIds.add(workspace.sessionId);
    }
  });

const DEFAULT_SESSION_STATE_PATH = resolve(homedir(), '.pairdock', 'sessions.json');
const SESSION_STATE_PATH_ENV_VAR = 'PAIRDOCK_AGENT_SESSION_STATE_PATH';

export function resolveAgentSessionStatePath(): string {
  return process.env[SESSION_STATE_PATH_ENV_VAR] || DEFAULT_SESSION_STATE_PATH;
}

export class FileSessionWorkspaceStore implements SessionWorkspaceStore {
  constructor(private readonly statePath = resolveAgentSessionStatePath()) {}

  async load(): Promise<SessionWorkspace[]> {
    let rawState: string;

    try {
      rawState = await readFile(this.statePath, 'utf8');
    } catch (error) {
      if (isMissingFileError(error)) {
        return [];
      }

      throw error;
    }

    return stateSchema.parse(JSON.parse(rawState)).workspaces;
  }

  async save(workspaces: SessionWorkspace[]): Promise<void> {
    const stateDirectory = dirname(this.statePath);
    const temporaryPath = `${this.statePath}.${process.pid}.${randomUUID()}.tmp`;
    const state = {
      version: 1 as const,
      workspaces: workspaces.map(toPersistedWorkspace),
    };

    await mkdir(stateDirectory, { recursive: true, mode: 0o700 });

    try {
      await writeFile(temporaryPath, JSON.stringify(state, null, 2), { encoding: 'utf8', mode: 0o600 });
      await rename(temporaryPath, this.statePath);
    } catch (error) {
      await unlink(temporaryPath).catch(() => undefined);
      throw error;
    }
  }
}

function toPersistedWorkspace(workspace: SessionWorkspace): SessionWorkspace {
  return {
    sessionId: workspace.sessionId,
    projectKey: workspace.projectKey,
    repositoryPath: workspace.repositoryPath,
    worktreePath: workspace.worktreePath,
    branchName: workspace.branchName,
    ...(workspace.modelId ? { modelId: workspace.modelId } : {}),
    ...(workspace.sandboxRef
      ? {
          sandboxRef: {
            id: workspace.sandboxRef.id,
            sessionId: workspace.sandboxRef.sessionId,
            healthcheckUrl: workspace.sandboxRef.healthcheckUrl,
            ...(workspace.sandboxRef.metadata ? { metadata: workspace.sandboxRef.metadata } : {}),
          },
        }
      : {}),
    ...(workspace.tunnelRef
      ? {
          tunnelRef: {
            id: workspace.tunnelRef.id,
            sessionId: workspace.tunnelRef.sessionId,
            publicUrl: workspace.tunnelRef.publicUrl,
            ...(workspace.tunnelRef.metadata ? { metadata: workspace.tunnelRef.metadata } : {}),
          },
        }
      : {}),
    ...(workspace.previewUrl ? { previewUrl: workspace.previewUrl } : {}),
  };
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
