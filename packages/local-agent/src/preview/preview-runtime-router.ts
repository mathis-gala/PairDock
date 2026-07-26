import { DockerSandboxAdapter } from '../docker/docker-sandbox.adapter.js';
import type { ProjectPreviewConfig, SandboxPort, SandboxRef, SandboxStartInput } from '../docker/sandbox.port.js';
import { HostPreviewRuntimeAdapter } from './host-preview-runtime.adapter.js';

interface PreviewRuntimeRouterDependencies {
  docker?: SandboxPort;
  host?: SandboxPort;
}

export class PreviewRuntimeRouter implements SandboxPort {
  private readonly docker: SandboxPort;
  private readonly host: SandboxPort;

  constructor(dependencies: PreviewRuntimeRouterDependencies = {}) {
    this.docker = dependencies.docker ?? new DockerSandboxAdapter();
    this.host = dependencies.host ?? new HostPreviewRuntimeAdapter();
  }

  start(input: SandboxStartInput): Promise<SandboxRef> {
    return this.runtimeForConfig(input.previewConfig).start(input);
  }

  stop(ref: SandboxRef, previewConfig?: ProjectPreviewConfig): Promise<void> {
    return this.runtimeForRef(ref).stop(ref, previewConfig);
  }

  check(ref: SandboxRef) {
    return this.runtimeForRef(ref).check(ref);
  }

  private runtimeForConfig(previewConfig: ProjectPreviewConfig | undefined): SandboxPort {
    return previewConfig?.runtime === 'docker' ? this.docker : this.host;
  }

  private runtimeForRef(ref: SandboxRef): SandboxPort {
    if (ref.metadata?.type === 'docker') {
      return this.docker;
    }
    if (ref.metadata?.type === 'host') {
      return this.host;
    }

    throw new Error(`Unknown preview runtime for session ${ref.sessionId}.`);
  }
}
