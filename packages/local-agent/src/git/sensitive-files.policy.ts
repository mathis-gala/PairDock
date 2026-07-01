import { posix } from 'node:path';

export class SensitiveFilesPolicy {
  isSensitive(relativePath: string): boolean {
    const normalizedPath = normalizeRelativePath(relativePath);
    const baseName = posix.basename(normalizedPath);

    return (
      baseName === '.env' ||
      baseName.startsWith('.env.') ||
      baseName.endsWith('.pem') ||
      baseName === 'id_rsa' ||
      baseName === 'id_ed25519' ||
      normalizedPath === '.aws' ||
      normalizedPath.startsWith('.aws/') ||
      normalizedPath === '.ssh' ||
      normalizedPath.startsWith('.ssh/')
    );
  }
}

function normalizeRelativePath(relativePath: string): string {
  return relativePath.replaceAll('\\', '/').replace(/^\.\//, '');
}
