import { join } from 'node:path';

export function resolveSessionTempDirectory(sessionId: string): string {
  return join('/tmp', 'pairdock', sessionId);
}
