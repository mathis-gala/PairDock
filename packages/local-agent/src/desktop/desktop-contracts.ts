import type { AgentModelConfig } from '../config/agent-config.js';
import type { ReadinessResult } from '../readiness/readiness-runner.js';

export type DesktopAgentStatus = 'stopped' | 'starting' | 'online' | 'reconnecting' | 'error';

export interface DesktopProjectDraft {
  path: string;
  name: string;
  repoFullName: string;
  defaultBranch: string;
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun';
  scripts: Array<{ name: string; command: string }>;
  setupCommand: string;
  previewCommand: string;
  healthcheckUrl: string;
  runtime: 'host' | 'docker';
  buildCommand: string;
  testCommand: string;
  lintCommand: string;
  manifestStatus: 'missing' | 'valid' | 'invalid';
  warnings: string[];
}

export interface DesktopProject extends DesktopProjectDraft {
  key: string;
}

export interface DesktopToolStatus {
  available: boolean;
  version: string | null;
  message: string;
}

export interface DesktopTools {
  git: DesktopToolStatus;
  docker: DesktopToolStatus;
  codex: DesktopToolStatus & { authenticated: boolean };
}

export interface DesktopAgentSnapshot {
  initialized: boolean;
  status: DesktopAgentStatus;
  running: boolean;
  dockerRequired: boolean;
  busy: boolean;
  error: string | null;
  connection: { backendUrl: string; frontendUrl: string; agentId: string; ownerName: string } | null;
  pairing: {
    userCode: string;
    verificationUrl: string;
    expiresAt: string;
    intervalSeconds: number;
  } | null;
  projects: DesktopProject[];
  tools: DesktopTools | null;
  models: AgentModelConfig[];
  readiness: Record<string, ReadinessResult>;
}

export interface BeginDesktopPairingInput {
  backendUrl: string;
  deviceName: string;
}
