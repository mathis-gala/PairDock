export interface ProjectPreviewConfig {
  sandbox?: {
    startCommand: string;
    stopCommand?: string;
    healthcheckUrl: string;
    image?: string;
    workdir?: string;
    network?: 'isolated' | 'host-services';
    env?: Record<string, string>;
    ports?: string[];
  };
  tunnel?: {
    provider?: 'cloudflare';
    publicUrl?: string;
    image?: string;
    startupTimeoutMs?: number;
  };
  healthcheckTimeoutMs?: number;
  healthcheckIntervalMs?: number;
}

export interface SandboxStartInput {
  sessionId: string;
  projectKey: string;
  repositoryPath: string;
  worktreePath: string;
  branchName: string;
  modelId: string;
  previewConfig?: ProjectPreviewConfig;
}

export interface SandboxRef {
  id: string;
  sessionId: string;
  healthcheckUrl: string;
  previewConfig?: ProjectPreviewConfig;
  metadata?: Record<string, string>;
}

export interface HealthcheckResult {
  ready: boolean;
  url: string;
  message?: string;
}

export interface SandboxPort {
  start(input: SandboxStartInput): Promise<SandboxRef>;
  stop(ref: SandboxRef, previewConfig?: ProjectPreviewConfig): Promise<void>;
  check(ref: SandboxRef): Promise<HealthcheckResult>;
}
