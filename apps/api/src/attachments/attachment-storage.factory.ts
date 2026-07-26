import type { AttachmentStoragePort } from './attachment-storage.port.js';
import { LocalAttachmentStorageAdapter } from './local-attachment-storage.adapter.js';
import { R2AttachmentStorageAdapter, type R2AttachmentStorageConfig } from './r2-attachment-storage.adapter.js';

const R2_ENVIRONMENT_KEYS = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_PRIVATE_BUCKET',
  'R2_PUBLIC_BUCKET',
  'R2_PUBLIC_BASE_URL',
] as const;

export function createAttachmentStorage(environment: NodeJS.ProcessEnv = process.env): AttachmentStoragePort {
  const configuredValues = R2_ENVIRONMENT_KEYS.map((key) => environment[key]?.trim());
  const configuredCount = configuredValues.filter(Boolean).length;

  if (configuredCount === 0) {
    if (environment.NODE_ENV === 'production') {
      throw new Error('R2 attachment storage is required in production.');
    }

    return new LocalAttachmentStorageAdapter(
      environment.PAIRDOCK_ATTACHMENT_STORAGE_PATH,
      environment.PAIRDOCK_PUBLIC_API_URL,
    );
  }

  if (configuredCount !== R2_ENVIRONMENT_KEYS.length) {
    const missing = R2_ENVIRONMENT_KEYS.filter((key) => !environment[key]?.trim());
    throw new Error(`Incomplete R2 attachment storage configuration. Missing: ${missing.join(', ')}.`);
  }

  const [accountId, accessKeyId, secretAccessKey, privateBucket, publicBucket, publicBaseUrl] = configuredValues as [
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  const config: R2AttachmentStorageConfig = {
    accountId,
    accessKeyId,
    secretAccessKey,
    privateBucket,
    publicBucket,
    publicBaseUrl: normalizePublicBaseUrl(publicBaseUrl),
  };
  return new R2AttachmentStorageAdapter(config);
}

function normalizePublicBaseUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:') {
    throw new Error('R2_PUBLIC_BASE_URL must use HTTPS.');
  }
  return url.toString().replace(/\/$/, '');
}
