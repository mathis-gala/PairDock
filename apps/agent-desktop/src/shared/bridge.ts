import type {
  BeginDesktopPairingInput,
  DesktopAgentSnapshot,
  DesktopProjectDraft,
} from '@pairdock/local-agent/desktop-contracts';

export interface DesktopPreferences {
  deviceName: string;
  launchAtLogin: boolean;
  canLaunchAtLogin: boolean;
}

export interface DesktopBridge {
  initialize(): Promise<DesktopAgentSnapshot>;
  getSnapshot(): Promise<DesktopAgentSnapshot>;
  beginPairing(input: BeginDesktopPairingInput): Promise<DesktopAgentSnapshot>;
  pollPairing(): Promise<DesktopAgentSnapshot>;
  cancelPairing(): Promise<DesktopAgentSnapshot>;
  chooseFolder(): Promise<DesktopProjectDraft | null>;
  saveProject(draft: DesktopProjectDraft): Promise<DesktopAgentSnapshot>;
  removeProject(projectKey: string): Promise<DesktopAgentSnapshot>;
  checkTools(): Promise<DesktopAgentSnapshot>;
  loginCodex(): Promise<DesktopAgentSnapshot>;
  runReadiness(projectKey: string): Promise<DesktopAgentSnapshot>;
  start(): Promise<DesktopAgentSnapshot>;
  stop(): Promise<DesktopAgentSnapshot>;
  openPairing(): Promise<void>;
  openProjects(agentProjectKey?: string): Promise<void>;
  openToolHelp(tool: 'git' | 'docker' | 'codex'): Promise<void>;
  openDocker(): Promise<void>;
  getPreferences(): Promise<DesktopPreferences>;
  setLaunchAtLogin(enabled: boolean): Promise<DesktopPreferences>;
}

declare global {
  interface Window {
    pairdock: DesktopBridge;
  }
}
