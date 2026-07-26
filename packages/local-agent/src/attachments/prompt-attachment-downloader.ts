import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AgentPromptCommandEnvelope } from '@pairdock/shared-contracts';
import { resolveHarnessTempDirectory } from '../harness/codex-harness.adapter.js';

type PromptAttachment = NonNullable<AgentPromptCommandEnvelope['payload']['attachments']>[number];

export class PromptAttachmentDownloader {
  constructor(
    private readonly backendUrl: string,
    private readonly authToken?: string,
    private readonly fetchImplementation: typeof fetch = fetch,
  ) {}

  async download(sessionId: string, attachments: PromptAttachment[] | undefined): Promise<string[]> {
    const directory = join(resolveHarnessTempDirectory(sessionId), 'attachments');
    await this.cleanup(sessionId);

    if (!attachments?.length) {
      return [];
    }

    await mkdir(directory, { recursive: true, mode: 0o700 });

    try {
      return await Promise.all(
        attachments.map(async (attachment) => {
          const response = await this.fetchImplementation(
            `${this.backendUrl.replace(/\/$/, '')}/agent/attachments/${attachment.id}`,
            {
              headers: this.authToken ? { authorization: `Bearer ${this.authToken}` } : undefined,
            },
          );

          if (!response.ok) {
            throw new Error(`PairDock could not download screenshot ${attachment.fileName} (${response.status}).`);
          }

          const body = Buffer.from(await response.arrayBuffer());
          if (body.byteLength !== attachment.byteSize) {
            throw new Error(`Downloaded screenshot ${attachment.fileName} has an unexpected size.`);
          }

          const path = join(directory, `${attachment.id}.${extensionFor(attachment.mimeType)}`);
          await writeFile(path, body, { mode: 0o600 });
          return path;
        }),
      );
    } catch (error) {
      await this.cleanup(sessionId);
      throw error;
    }
  }

  async cleanup(sessionId: string): Promise<void> {
    await rm(join(resolveHarnessTempDirectory(sessionId), 'attachments'), { recursive: true, force: true });
  }
}

function extensionFor(mimeType: PromptAttachment['mimeType']): string {
  if (mimeType === 'image/jpeg') {
    return 'jpg';
  }
  return mimeType === 'image/png' ? 'png' : 'webp';
}
