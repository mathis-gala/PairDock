import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type { AgentPairingStarted } from '@pairdock/shared-contracts';
import { type AgentConfig, type AgentModelConfig, normalizeAgentConfig } from '../config/agent-config.js';
import { LogRedactor } from '../logging/redactor.js';
import type { PreviewCompanionRuntime } from '../preview/preview-companion-manager.js';
import { backendRequiresPublicPreviews, requirePublicPreviews } from '../preview/public-preview-policy.js';
import { ReadinessRunner } from '../readiness/readiness-runner.js';
import { type StartAgentRuntimeInput, startAgentRuntime } from '../runtime/agent-runtime.js';
import { previewUsesDockerTunnel } from '../tunnel/preview-tunnel.port.js';
import type { BeginDesktopPairingInput, DesktopAgentSnapshot, DesktopProjectDraft } from './desktop-contracts.js';
import { DesktopPairingClient, DesktopPairingUnavailableError } from './desktop-pairing-client.js';
import {
  type DesktopProfile,
  DesktopProfileStore,
  type DesktopProfileStoreOptions,
  desktopProfileSchema,
} from './desktop-profile-store.js';
import {
  type DesktopCommandRunner,
  type DesktopToolsOptions,
  discoverDesktopCodexModels,
  inspectDesktopProjectTools,
  inspectDesktopTools,
  loginDesktopCodex,
  resolveDesktopCodexCommand,
} from './desktop-tools.js';
import { desktopProjectDraftSchema, inspectDesktopProject, loadDesktopProjectConfig } from './project-inspection.js';

export type {
  BeginDesktopPairingInput,
  DesktopAgentSnapshot,
  DesktopProject,
  DesktopProjectDraft,
  DesktopTools,
} from './desktop-contracts.js';

export interface DesktopAgentManagerOptions extends DesktopProfileStoreOptions {
  codexCommand?: string;
  runCommand?: DesktopCommandRunner;
  discoverModels?(options: DesktopToolsOptions): Promise<AgentModelConfig[]>;
  startRuntime?(input: StartAgentRuntimeInput): Promise<PreviewCompanionRuntime>;
  onChange?(snapshot: DesktopAgentSnapshot): void;
  fetch?(url: string, init?: RequestInit): Promise<Response>;
  now?(): number;
}

export class DesktopAgentManager {
  private profile: DesktopProfile | null = null;
  private pairing: (AgentPairingStarted & { backendUrl: string; frontendUrl: string }) | null = null;
  private nextPairingPoll = 0;
  private queue: Promise<unknown> = Promise.resolve();
  private runtime: PreviewCompanionRuntime | null = null;
  private runtimeGeneration = 0;
  private readonly loginControllers = new Set<AbortController>();
  private readonly profileStore: DesktopProfileStore;
  private readonly pairingClient: DesktopPairingClient;
  private readonly state: DesktopAgentSnapshot = {
    initialized: false,
    status: 'stopped',
    running: false,
    dockerRequired: false,
    busy: false,
    error: null,
    connection: null,
    pairing: null,
    projects: [],
    tools: null,
    models: [],
    readiness: {},
  };

  constructor(private readonly options: DesktopAgentManagerOptions) {
    this.profileStore = new DesktopProfileStore(options);
    this.pairingClient = new DesktopPairingClient(options.fetch);
  }

  getSnapshot(): DesktopAgentSnapshot {
    return structuredClone(this.state);
  }

  initialize(): Promise<DesktopAgentSnapshot> {
    return this.serialize(async () => {
      if (this.state.initialized) return;
      this.profile = await this.profileStore.load();
      this.publishConnection();
      await this.refreshDockerRequirement();
      this.state.initialized = true;
    });
  }

  beginPairing(input: BeginDesktopPairingInput): Promise<DesktopAgentSnapshot> {
    return this.serialize(async () => {
      this.requireEditable();
      const backendUrl = normalizeBackendUrl(input.backendUrl);
      const result = await this.pairingClient.begin(backendUrl, input.deviceName);
      normalizeBackendUrl(result.verificationUrl);
      const frontend = new URL(result.verificationUrl);
      frontend.hash = '';
      frontend.search = '';
      const frontendUrl = frontend.toString().replace(/\/$/, '');
      if (Date.parse(result.expiresAt) <= this.now())
        throw new Error('The pairing code has expired. Start pairing again.');
      this.pairing = { ...result, backendUrl, frontendUrl };
      this.nextPairingPoll = 0;
      this.state.pairing = {
        userCode: result.userCode,
        verificationUrl: result.verificationUrl,
        expiresAt: result.expiresAt,
        intervalSeconds: result.intervalSeconds,
      };
    });
  }

  pollPairing(): Promise<DesktopAgentSnapshot> {
    return this.serialize(async () => {
      if (!this.pairing) return;
      this.requireEditable();
      if (Date.parse(this.pairing.expiresAt) <= this.now()) {
        this.clearPairing();
        throw new Error('The pairing code has expired. Start pairing again.');
      }
      if (this.now() < this.nextPairingPoll) return;
      this.nextPairingPoll = this.now() + this.pairing.intervalSeconds * 1_000;
      const current = this.pairing;
      const result = await this.pairingClient.claim(current.backendUrl, current.deviceCode);
      if (result.status === 'pending') return;
      const next = desktopProfileSchema.parse({
        version: 1,
        connection: { ...result, backendUrl: current.backendUrl, frontendUrl: current.frontendUrl },
        projects: (this.profile?.projects ?? []).map((project) => ({
          ...project,
          key: `${result.projectKeyPrefix}${randomUUID().slice(0, 12)}`,
        })),
      });
      try {
        await this.profileStore.save(next);
      } catch {
        this.clearPairing();
        throw new Error('Pairing succeeded, but the profile could not be saved securely. Start pairing again.');
      }
      this.profile = next;
      this.state.readiness = {};
      this.clearPairing();
      this.publishConnection();
      await this.refreshDockerRequirement();
    });
  }

  cancelPairing(): Promise<DesktopAgentSnapshot> {
    return this.serialize(async () => {
      this.clearPairing();
    });
  }

  async inspectProject(path: string): Promise<DesktopProjectDraft> {
    this.requireEditable();
    return inspectDesktopProject(path);
  }

  saveProject(input: unknown): Promise<DesktopAgentSnapshot> {
    return this.serialize(async () => {
      this.requireEditable();
      const profile = this.requireProfile();
      const draft = desktopProjectDraftSchema.parse(input);
      const existing = profile.projects.find((project) => project.path === draft.path);
      const key = existing?.key ?? `${profile.connection.projectKeyPrefix}${randomUUID().slice(0, 12)}`;
      const loaded = await loadDesktopProjectConfig(key, draft);
      normalizeAgentConfig({
        backendUrl: profile.connection.backendUrl,
        agentId: profile.connection.agentId,
        previewConfigs: { [key]: loaded.previewConfig },
        checksConfigs: { [key]: loaded.checksConfig },
      });
      const project = { ...draft, repoFullName: loaded.descriptor.repoFullName, key };
      const next = desktopProfileSchema.parse({
        ...profile,
        projects: [...profile.projects.filter((candidate) => candidate.key !== key), project],
      });
      await this.profileStore.save(next);
      this.profile = next;
      this.state.readiness = {};
      this.publishConnection();
      await this.refreshDockerRequirement();
    });
  }

  removeProject(projectKey: string): Promise<DesktopAgentSnapshot> {
    return this.serialize(async () => {
      this.requireEditable();
      const profile = this.requireProfile();
      if (!profile.projects.some((project) => project.key === projectKey))
        throw new Error('This project is not configured.');
      const next = { ...profile, projects: profile.projects.filter((project) => project.key !== projectKey) };
      await this.profileStore.save(next);
      this.profile = next;
      delete this.state.readiness[projectKey];
      this.publishConnection();
      await this.refreshDockerRequirement();
    });
  }

  checkTools(): Promise<DesktopAgentSnapshot> {
    return this.serialize(() => this.refreshTools());
  }

  loginCodex(): Promise<DesktopAgentSnapshot> {
    const controller = new AbortController();
    this.loginControllers.add(controller);
    return this.serialize(async () => {
      this.requireEditable();
      if (controller.signal.aborted) throw new Error('Codex login was cancelled.');
      await loginDesktopCodex({ ...this.toolOptions, signal: controller.signal });
      await this.refreshTools();
    }).finally(() => this.loginControllers.delete(controller));
  }

  runReadiness(projectKey: string): Promise<DesktopAgentSnapshot> {
    return this.serialize(async () => {
      const project = this.requireProfile().projects.find((project) => project.key === projectKey);
      if (!project) {
        throw new Error('This project is not configured.');
      }
      const config = await this.buildConfig();
      const result = await new ReadinessRunner(config).run({ projectKey });
      const missing = await inspectDesktopProjectTools(project, this.toolOptions);
      if (missing.length > 0) {
        result.ok = false;
        result.checks = result.checks.map((check) =>
          check.key === 'project-commands'
            ? {
                ...check,
                status: 'failed',
                message: `Required project tools are unavailable: ${missing.join(', ')}.`,
                remediation: 'Install the project tools, then reopen PairDock and rerun the checks.',
              }
            : check,
        );
      }
      this.state.readiness[projectKey] = result;
    });
  }

  start(): Promise<DesktopAgentSnapshot> {
    return this.serialize(async () => {
      if (this.runtime) throw new Error('The agent is already running.');
      if (this.pairing) throw new Error('Finish or cancel pairing before starting the agent.');
      if (this.requireProfile().projects.length === 0)
        throw new Error('Choose and configure a repository before starting.');
      this.state.status = 'starting';
      this.state.error = null;
      const generation = ++this.runtimeGeneration;
      this.notify();
      try {
        await this.refreshTools();
        const tools = this.state.tools;
        if (!tools?.git.available) throw new Error('Install Git before starting the agent.');
        if (!tools.codex.available || !tools.codex.authenticated) {
          throw new Error('Connect Codex before starting the agent.');
        }
        if (this.state.models.length === 0) throw new Error(tools.codex.message);
        const config = await this.buildConfig();
        const dockerRequired = Object.values(config.previewConfigs).some(
          (preview) => preview.runtime === 'docker' || previewUsesDockerTunnel(preview),
        );
        if (dockerRequired && !tools.docker.available)
          throw new Error('Start Docker Desktop before starting the agent.');
        for (const project of this.requireProfile().projects) {
          const missing = await inspectDesktopProjectTools(project, this.toolOptions);
          if (missing.length > 0)
            throw new Error(`Install ${missing.join(', ')} for ${project.name}, then reopen PairDock before starting.`);
        }
        this.runtime = await (this.options.startRuntime ?? startAgentRuntime)({
          config,
          statePath: join(this.options.profileDirectory, 'sessions', `${config.agentId}.json`),
          preventStopWhileBusy: true,
          onStatus: (state) => {
            if (generation !== this.runtimeGeneration) return;
            this.state.status = state.status;
            this.state.busy = state.busy;
            this.state.error = state.message ? this.redact(state.message) : null;
            this.notify();
          },
        });
        this.state.running = true;
      } catch (error) {
        this.runtimeGeneration += 1;
        this.state.status = 'error';
        this.state.busy = false;
        throw error;
      }
    });
  }

  stop(): Promise<DesktopAgentSnapshot> {
    for (const controller of this.loginControllers) controller.abort();
    return this.serialize(async () => {
      if (this.runtime) {
        await this.runtime.stop({ cleanupSessions: false });
        this.runtime = null;
      }
      this.runtimeGeneration += 1;
      this.state.running = false;
      this.state.status = 'stopped';
      this.state.busy = false;
    });
  }

  private get toolOptions(): DesktopToolsOptions {
    return { codexCommand: this.options.codexCommand, runCommand: this.options.runCommand };
  }

  private async refreshTools(): Promise<void> {
    this.state.tools = await inspectDesktopTools(this.toolOptions);
    this.state.models = [];
    if (this.state.tools.codex.authenticated) {
      try {
        this.state.models = await (this.options.discoverModels ?? discoverDesktopCodexModels)(this.toolOptions);
      } catch (error) {
        this.state.tools.codex.message = this.redact(
          error instanceof Error ? error.message : 'Codex models could not be loaded.',
        );
      }
    }
  }

  private async buildConfig(): Promise<AgentConfig> {
    const profile = this.requireProfile();
    const codexCommand = await resolveDesktopCodexCommand(this.toolOptions);
    const config = normalizeAgentConfig({
      backendUrl: profile.connection.backendUrl,
      agentId: profile.connection.agentId,
      authToken: profile.connection.authToken,
      capabilities: [
        'session.prepare',
        'session.close',
        'readiness.check',
        'agent.prompt',
        'agent.cancel',
        'git.pushBranch',
      ],
      models: this.state.models,
    });
    for (const project of profile.projects) {
      if (!project.key.startsWith(profile.connection.projectKeyPrefix))
        throw new Error('The project belongs to another agent. Pair it again.');
      const loaded = await loadDesktopProjectConfig(project.key, project);
      config.projects.push(loaded.descriptor);
      config.projectPaths[project.key] = project.path;
      config.previewConfigs[project.key] = {
        ...loaded.previewConfig,
        tunnel: loaded.previewConfig.tunnel ?? { provider: 'cloudflare' },
      };
      config.checksConfigs ??= {};
      config.checksConfigs[project.key] = loaded.checksConfig;
      config.agentHarnessConfigs ??= {};
      config.agentHarnessConfigs[project.key] = { command: codexCommand };
    }
    if (backendRequiresPublicPreviews(config.backendUrl)) {
      config.previewConfigs = requirePublicPreviews(config.previewConfigs);
    }
    return normalizeAgentConfig(config);
  }

  private requireProfile(): DesktopProfile {
    if (!this.state.initialized) throw new Error('Initialize the desktop profile before configuring the agent.');
    if (!this.profile) throw new Error('Pair this computer with PairDock first.');
    return this.profile;
  }

  private async refreshDockerRequirement(): Promise<void> {
    if (!this.profile) return;
    let dockerRequired = false;
    for (const project of this.profile.projects) {
      try {
        const loaded = await loadDesktopProjectConfig(project.key, project);
        let previews = { [project.key]: loaded.previewConfig };
        if (backendRequiresPublicPreviews(this.profile.connection.backendUrl)) {
          previews = requirePublicPreviews(previews);
        }
        const preview = previews[project.key];
        dockerRequired ||= preview.runtime === 'docker' || previewUsesDockerTunnel(preview);
      } catch {
        dockerRequired = true;
        const displayed = this.state.projects.find((candidate) => candidate.key === project.key);
        displayed?.warnings.push('The repository could not be inspected. Re-select its folder before starting.');
      }
    }
    this.state.dockerRequired = dockerRequired;
  }

  private now(): number {
    return this.options.now?.() ?? Date.now();
  }

  private clearPairing(): void {
    this.pairing = null;
    this.state.pairing = null;
  }

  private publishConnection(): void {
    if (!this.profile) return;
    const { backendUrl, frontendUrl, agentId, ownerName } = this.profile.connection;
    this.state.connection = { backendUrl, frontendUrl, agentId, ownerName };
    this.state.projects = structuredClone(this.profile.projects);
  }

  private requireEditable(): void {
    if (!this.state.initialized) throw new Error('Initialize the desktop profile before configuring the agent.');
    if (this.runtime || (this.state.status !== 'stopped' && this.state.status !== 'error')) {
      throw new Error('Stop the agent before changing its configuration.');
    }
  }

  private serialize(operation: () => Promise<void>): Promise<DesktopAgentSnapshot> {
    const result = this.queue.then(async () => {
      try {
        await operation();
        this.state.error = null;
      } catch (error) {
        if (error instanceof DesktopPairingUnavailableError) this.clearPairing();
        this.state.error = this.redact(
          error instanceof Error ? error.message : 'The operation could not be completed.',
        );
        this.notify();
        throw new Error(this.state.error);
      }
      this.notify();
      return this.getSnapshot();
    });
    this.queue = result.catch(() => undefined);
    return result;
  }

  private notify(): void {
    this.options.onChange?.(this.getSnapshot());
  }

  private redact(input: string): string {
    let message = input;
    for (const secret of [this.profile?.connection.authToken, this.pairing?.deviceCode]) {
      if (secret) message = message.replaceAll(secret, '[REDACTED]');
    }
    return new LogRedactor().redact(message);
  }
}

function normalizeBackendUrl(value: string): string {
  return normalizeAgentConfig({ backendUrl: value, agentId: 'desktop-validation' }).backendUrl;
}
