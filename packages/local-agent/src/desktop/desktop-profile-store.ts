import { randomUUID } from 'node:crypto';
import { chmod, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { z } from 'zod';
import { normalizeAgentConfig } from '../config/agent-config.js';
import { desktopProjectDraftSchema } from './project-inspection.js';

const connectionSchema = z.object({
  backendUrl: z.string().url(),
  frontendUrl: z.string().url(),
  agentId: z.string().regex(/^[A-Za-z0-9._-]{1,128}$/),
  authToken: z.string().min(32),
  projectKeyPrefix: z
    .string()
    .regex(/^[A-Za-z0-9._-]+-$/)
    .max(100),
  ownerName: z.string(),
});

export const desktopProfileSchema = z.object({
  version: z.literal(1),
  connection: connectionSchema,
  projects: z
    .array(desktopProjectDraftSchema.extend({ key: z.string().regex(/^[A-Za-z0-9._-]{1,128}$/) }))
    .max(100)
    .default([]),
});
export type DesktopProfile = z.infer<typeof desktopProfileSchema>;

export interface DesktopProfileStoreOptions {
  profileDirectory: string;
  encrypt(plaintext: string): string | Promise<string>;
  decrypt(ciphertext: string): string | Promise<string>;
}

export class DesktopProfileStore {
  constructor(private readonly options: DesktopProfileStoreOptions) {
    if (!isAbsolute(options.profileDirectory)) throw new Error('The desktop profile directory must be absolute.');
  }

  async load(): Promise<DesktopProfile | null> {
    let stored: string;
    try {
      stored = await readFile(this.path, 'utf8');
    } catch (error) {
      if (isMissingFile(error)) return null;
      throw new Error('The saved desktop profile could not be read.');
    }
    try {
      const envelope = z.object({ version: z.literal(1), encrypted: z.string().min(1) }).parse(JSON.parse(stored));
      const profile = desktopProfileSchema.parse(JSON.parse(await this.options.decrypt(envelope.encrypted)));
      normalizeAgentConfig({ backendUrl: profile.connection.backendUrl, agentId: profile.connection.agentId });
      normalizeAgentConfig({ backendUrl: profile.connection.frontendUrl, agentId: profile.connection.agentId });
      return profile;
    } catch {
      throw new Error('The desktop profile could not be unlocked. Restore access to your system keychain and retry.');
    }
  }

  async save(profile: DesktopProfile): Promise<void> {
    const encrypted = await this.options.encrypt(JSON.stringify(profile));
    if (!encrypted) throw new Error('Secure profile encryption is unavailable.');
    await mkdir(this.options.profileDirectory, { recursive: true, mode: 0o700 });
    await chmod(this.options.profileDirectory, 0o700);
    const temporaryPath = `${this.path}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporaryPath, JSON.stringify({ version: 1, encrypted }), { mode: 0o600, flag: 'wx' });
      await rename(temporaryPath, this.path);
    } finally {
      await unlink(temporaryPath).catch((error: unknown) => {
        if (!isMissingFile(error)) throw error;
      });
    }
  }

  private get path(): string {
    return join(this.options.profileDirectory, 'profile.json');
  }
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
