import { posix } from 'node:path';

export class SensitiveFilesPolicy {
  isSensitive(relativePath: string): boolean {
    const normalizedPath = normalizeRelativePath(relativePath);
    const lowerPath = normalizedPath.toLowerCase();
    const baseName = posix.basename(lowerPath);
    const safeEnvironmentTemplates = new Set(['.env.example', '.env.sample', '.env.template']);

    return (
      baseName === '.env' ||
      (baseName.startsWith('.env.') && !safeEnvironmentTemplates.has(baseName)) ||
      baseName === '.npmrc' ||
      baseName === '.netrc' ||
      baseName === '.pypirc' ||
      baseName === '.git-credentials' ||
      baseName.endsWith('.pem') ||
      baseName.endsWith('.key') ||
      baseName.endsWith('.p12') ||
      baseName.endsWith('.pfx') ||
      baseName.endsWith('.keystore') ||
      baseName.endsWith('.tfvars') ||
      baseName.endsWith('.tfvars.json') ||
      /^id_(rsa|dsa|ecdsa|ed25519)(\.pub)?$/.test(baseName) ||
      isInsideSensitiveDirectory(lowerPath, '.aws') ||
      isInsideSensitiveDirectory(lowerPath, '.ssh') ||
      isInsideSensitiveDirectory(lowerPath, '.gnupg') ||
      isInsideSensitiveDirectory(lowerPath, '.kube') ||
      lowerPath === '.docker/config.json' ||
      lowerPath === '.config/gcloud/application_default_credentials.json' ||
      lowerPath === '.gem/credentials'
    );
  }
}

function isInsideSensitiveDirectory(relativePath: string, directory: string): boolean {
  return relativePath === directory || relativePath.startsWith(`${directory}/`);
}

function normalizeRelativePath(relativePath: string): string {
  return relativePath.replaceAll('\\', '/').replace(/^\.\//, '');
}
