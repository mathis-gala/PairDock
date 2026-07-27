import assert from 'node:assert/strict';
import test from 'node:test';
import type { AgentConfig } from '../../../../packages/local-agent/src/config/agent-config.js';
import {
  PreviewCompanionManager,
  type PreviewCompanionRuntime,
  type PreviewCompanionRuntimeStartInput,
} from '../../../../packages/local-agent/src/preview/preview-companion-manager.js';

const outerSessionId = '22222222-2222-4222-8222-222222222222';
const token = 't'.repeat(64);

function companionAgentConfig(): AgentConfig {
  return {
    backendUrl: 'http://127.0.0.1:3000',
    agentId: 'tcg-dev-agent',
    authToken: 'existing-local-token-must-not-be-reused',
    capabilities: ['session.prepare', 'agent.prompt'],
    models: [],
    projects: [],
    projectPaths: {
      tcg: '/tmp/tcg-collection',
    },
    previewConfigs: {},
  };
}

test('PreviewCompanionManager injects an ephemeral credential and connects the configured agent to the preview', async () => {
  const runtimeStarts: PreviewCompanionRuntimeStartInput[] = [];
  const runtimeStops: Array<{ cleanupSessions: boolean }> = [];
  const runtime: PreviewCompanionRuntime = {
    async stop(input) {
      runtimeStops.push(input);
    },
  };
  const manager = new PreviewCompanionManager(
    {
      pairdock: {
        agentConfigPath: '/tmp/agent-tcg-local.json',
      },
    },
    {
      async loadAgentConfig(path) {
        assert.equal(path, '/tmp/agent-tcg-local.json');
        return companionAgentConfig();
      },
      randomToken: () => token,
      resolveStatePath: (sessionId) => `/tmp/companions/${sessionId}.json`,
      async startRuntime(input) {
        runtimeStarts.push(input);
        return runtime;
      },
    },
  );

  const previewConfig = await manager.prepare({
    previewConfig: {
      runtime: 'docker',
      sandbox: {
        startCommand: 'bun run dev',
        healthcheckUrl: 'http://127.0.0.1:{{hostPort}}',
      },
    },
    projectKey: 'pairdock',
    sessionId: outerSessionId,
  });
  const credentials = JSON.parse(previewConfig?.sandbox?.env?.AGENT_AUTH_CREDENTIALS_JSON ?? '') as Record<
    string,
    { projectKeys: string[]; token: string }
  >;

  assert.deepEqual(credentials, {
    'tcg-dev-agent': {
      projectKeys: ['tcg'],
      token,
    },
  });

  await manager.start({
    localUrl: 'http://127.0.0.1:54321',
    sessionId: outerSessionId,
  });

  assert.equal(runtimeStarts.length, 1);
  assert.equal(runtimeStarts[0]?.config.backendUrl, 'http://127.0.0.1:54321');
  assert.equal(runtimeStarts[0]?.config.authToken, token);
  assert.equal(runtimeStarts[0]?.config.authToken === companionAgentConfig().authToken, false);
  assert.equal(runtimeStarts[0]?.statePath, `/tmp/companions/${outerSessionId}.json`);
  assert.equal(runtimeStarts[0]?.runtimeOwnerId, `tcg-dev-agent-companion-${outerSessionId}`);

  await manager.stop({ cleanupSessions: true, sessionId: outerSessionId });
  assert.deepEqual(runtimeStops, [{ cleanupSessions: true }]);
});

test('PreviewCompanionManager leaves unrelated project previews unchanged', async () => {
  const manager = new PreviewCompanionManager(
    {
      pairdock: {
        agentConfigPath: '/tmp/agent-tcg-local.json',
      },
    },
    {
      async loadAgentConfig() {
        throw new Error('must not load a companion for unrelated projects');
      },
      randomToken: () => token,
      resolveStatePath: (sessionId) => `/tmp/companions/${sessionId}.json`,
      async startRuntime() {
        throw new Error('must not start a companion for unrelated projects');
      },
    },
  );
  const previewConfig = {
    runtime: 'docker' as const,
    sandbox: {
      startCommand: 'bun run dev',
      healthcheckUrl: 'http://127.0.0.1:{{hostPort}}',
    },
  };

  assert.equal(
    await manager.prepare({
      previewConfig,
      projectKey: 'tcg',
      sessionId: outerSessionId,
    }),
    previewConfig,
  );
  await manager.start({
    localUrl: 'http://127.0.0.1:54321',
    sessionId: outerSessionId,
  });
});
