import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve, sep } from 'node:path';
import type { AttachmentObject, AttachmentStoragePort, PutAttachmentObjectInput } from './attachment-storage.port.js';

export class LocalAttachmentStorageAdapter implements AttachmentStoragePort {
  constructor(
    private readonly rootDirectory = resolve(homedir(), '.pairdock', 'attachments'),
    private readonly publicApiUrl = process.env.PAIRDOCK_PUBLIC_API_URL ??
      `http://localhost:${process.env.PORT ?? '3000'}`,
  ) {}

  async put(input: PutAttachmentObjectInput): Promise<void> {
    const path = this.resolveObjectPath(input.visibility, input.objectKey);
    await mkdir(resolve(path, '..'), { recursive: true, mode: 0o700 });
    await writeFile(path, input.body, { mode: 0o600 });
    await writeFile(`${path}.mime`, input.mimeType, { encoding: 'utf8', mode: 0o600 });
  }

  async read(visibility: PutAttachmentObjectInput['visibility'], objectKey: string): Promise<AttachmentObject> {
    const path = this.resolveObjectPath(visibility, objectKey);
    const [body, mimeType] = await Promise.all([readFile(path), readFile(`${path}.mime`, 'utf8')]);
    return { body, mimeType };
  }

  async delete(visibility: PutAttachmentObjectInput['visibility'], objectKey: string): Promise<void> {
    const path = this.resolveObjectPath(visibility, objectKey);
    await Promise.all([rm(path, { force: true }), rm(`${path}.mime`, { force: true })]);
  }

  publicUrl(attachmentId: string): string {
    return `${this.publicApiUrl.replace(/\/$/, '')}/public/attachments/${attachmentId}`;
  }

  private resolveObjectPath(visibility: PutAttachmentObjectInput['visibility'], objectKey: string): string {
    const visibilityRoot = resolve(this.rootDirectory, visibility);
    const path = resolve(visibilityRoot, objectKey);

    if (path !== visibilityRoot && !path.startsWith(`${visibilityRoot}${sep}`)) {
      throw new Error('Attachment object key resolves outside the configured storage root.');
    }

    return path;
  }
}
