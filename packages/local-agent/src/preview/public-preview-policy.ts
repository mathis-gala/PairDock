import type { ProjectPreviewConfig } from '../docker/sandbox.port.js';

export function backendRequiresPublicPreviews(backendUrl: string): boolean {
  return !isLoopbackUrlTemplate(backendUrl);
}

export function requirePublicPreviews(
  previewConfigs: Record<string, ProjectPreviewConfig>,
): Record<string, ProjectPreviewConfig> {
  return Object.fromEntries(
    Object.entries(previewConfigs).map(([projectKey, previewConfig]) => {
      const publicUrl = previewConfig.tunnel?.publicUrl;

      if (!publicUrl || !isLoopbackUrlTemplate(publicUrl)) {
        return [projectKey, previewConfig];
      }

      const tunnel = { ...previewConfig.tunnel };
      delete tunnel.publicUrl;

      return [
        projectKey,
        {
          ...previewConfig,
          tunnel,
        },
      ];
    }),
  );
}

function isLoopbackUrlTemplate(value: string): boolean {
  const url = new URL(value.replaceAll('{{hostPort}}', '4000').replaceAll('{{sessionId}}', 'session'));
  return url.hostname === '127.0.0.1' || url.hostname === 'localhost' || url.hostname === '[::1]';
}
