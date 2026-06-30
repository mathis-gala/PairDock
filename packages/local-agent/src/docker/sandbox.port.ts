export interface ProjectPreviewConfig {
  sandbox?: {
    startCommand: string;
    stopCommand?: string;
    healthcheckUrl: string;
  };
  tunnel?: {
    publicUrl?: string;
    startCommand?: string;
    closeCommand?: string;
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
