import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { AttachmentVisibility } from '@pairdock/domain';
import type { AttachmentObject, AttachmentStoragePort, PutAttachmentObjectInput } from './attachment-storage.port.js';

export interface R2AttachmentStorageConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  privateBucket: string;
  publicBucket: string;
  publicBaseUrl: string;
}

export class R2AttachmentStorageAdapter implements AttachmentStoragePort {
  private readonly client: S3Client;

  constructor(private readonly config: R2AttachmentStorageConfig) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async put(input: PutAttachmentObjectInput): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket(input.visibility),
        Key: input.objectKey,
        Body: input.body,
        ContentLength: input.body.byteLength,
        ContentType: input.mimeType,
        ...(input.visibility === 'public'
          ? { CacheControl: 'public, max-age=31536000, immutable', ContentDisposition: 'inline' }
          : {}),
      }),
    );
  }

  async read(visibility: AttachmentVisibility, objectKey: string): Promise<AttachmentObject> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket(visibility),
        Key: objectKey,
      }),
    );

    if (!response.Body) {
      throw new Error(`R2 object ${objectKey} returned no body.`);
    }

    return {
      body: Buffer.from(await response.Body.transformToByteArray()),
      mimeType: response.ContentType ?? 'application/octet-stream',
    };
  }

  async delete(visibility: AttachmentVisibility, objectKey: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket(visibility), Key: objectKey }));
  }

  publicUrl(_attachmentId: string, objectKey: string): string {
    const encodedKey = objectKey.split('/').map(encodeURIComponent).join('/');
    return `${this.config.publicBaseUrl.replace(/\/$/, '')}/${encodedKey}`;
  }

  private bucket(visibility: AttachmentVisibility): string {
    return visibility === 'private' ? this.config.privateBucket : this.config.publicBucket;
  }
}
