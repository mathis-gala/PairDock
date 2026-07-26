import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  SandboxPort,
  SandboxRef,
  SandboxStartInput,
} from '../../../../packages/local-agent/src/docker/sandbox.port.js';
import { PreviewRuntimeRouter } from '../../../../packages/local-agent/src/preview/preview-runtime-router.js';

test('PreviewRuntimeRouter uses host by default and Docker only when explicitly requested', async () => {
  const host = new FakePreviewRuntime('host');
  const docker = new FakePreviewRuntime('docker');
  const router = new PreviewRuntimeRouter({ docker, host });
  const baseInput = {
    sessionId: '99999999-9999-4999-8999-999999999999',
    projectKey: 'pairdock',
    repositoryPath: '/tmp/repository',
    worktreePath: '/tmp/worktree',
    branchName: 'pairdock/session-9999',
    modelId: 'agent/gpt-5',
    previewConfig: {
      sandbox: {
        startCommand: 'bun run dev',
        healthcheckUrl: 'http://127.0.0.1:4000',
      },
    },
  } satisfies SandboxStartInput;

  const hostRef = await router.start(baseInput);
  const dockerRef = await router.start({
    ...baseInput,
    previewConfig: {
      ...baseInput.previewConfig,
      runtime: 'docker',
    },
  });

  assert.equal(hostRef.metadata?.type, 'host');
  assert.equal(dockerRef.metadata?.type, 'docker');
  assert.equal(host.startCalls, 1);
  assert.equal(docker.startCalls, 1);
});

class FakePreviewRuntime implements SandboxPort {
  startCalls = 0;

  constructor(private readonly type: 'host' | 'docker') {}

  async start(input: SandboxStartInput): Promise<SandboxRef> {
    this.startCalls += 1;
    return {
      id: `${this.type}-${input.sessionId}`,
      sessionId: input.sessionId,
      healthcheckUrl: 'http://127.0.0.1:4000',
      metadata: { type: this.type },
    };
  }

  async stop(): Promise<void> {}

  async check(ref: SandboxRef) {
    return { ready: true, url: ref.healthcheckUrl };
  }
}
