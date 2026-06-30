import type { ProjectPreviewConfig } from '../docker/sandbox.port.js';

export interface PreviewTunnelOpenInput {
  sessionId: string;
  projectKey: string;
  localUrl: string;
  worktreePath: string;
  previewConfig?: ProjectPreviewConfig;
}

export interface PreviewTunnelRef {
  id: string;
  sessionId: string;
  publicUrl: string;
  metadata?: Record<string, string>;
}

export interface PreviewTunnelPort {
  open(input: PreviewTunnelOpenInput): Promise<PreviewTunnelRef>;
  close(ref: PreviewTunnelRef, previewConfig?: ProjectPreviewConfig): Promise<void>;
}
