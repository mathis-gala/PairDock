import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { normalizeAgentConfig } from '../../../../packages/local-agent/src/config/agent-config.js';
import { enrichConfigWithCodexModels } from '../../../../packages/local-agent/src/config/codex-model-catalog.js';

test('Codex-backed agent publishes visible cached models and their supported reasoning efforts', async () => {
  const configDir = await mkdtemp(join(tmpdir(), 'pairdock-codex-models-'));
  const cachePath = join(configDir, 'models_cache.json');
  await writeFile(
    cachePath,
    JSON.stringify({
      models: [
        {
          slug: 'gpt-5.6-sol',
          display_name: 'GPT-5.6-Sol',
          visibility: 'list',
          default_reasoning_level: 'low',
          supported_reasoning_levels: [
            { effort: 'low', description: 'Fast responses' },
            { effort: 'high', description: 'Deeper reasoning' },
          ],
        },
        {
          slug: 'gpt-hidden',
          display_name: 'Hidden',
          visibility: 'hide',
          default_reasoning_level: 'medium',
          supported_reasoning_levels: [{ effort: 'medium', description: 'Balanced' }],
        },
      ],
    }),
  );
  const config = normalizeAgentConfig({
    backendUrl: 'https://pairdock.test',
    agentId: 'local-agent-1',
    models: [],
  });

  const enriched = await enrichConfigWithCodexModels(config, cachePath);

  assert.deepEqual(enriched.models, [
    {
      id: 'gpt-5.6-sol',
      label: 'GPT-5.6-Sol',
      provider: 'codex',
      defaultReasoningEffort: 'low',
      reasoningEfforts: [
        { id: 'low', label: 'Low', description: 'Fast responses' },
        { id: 'high', label: 'High', description: 'Deeper reasoning' },
      ],
    },
  ]);
});

test('Codex-backed agent does not publish a catalog produced by a newer incompatible CLI', async () => {
  const configDir = await mkdtemp(join(tmpdir(), 'pairdock-codex-model-version-'));
  const cachePath = join(configDir, 'models_cache.json');
  await writeFile(
    cachePath,
    JSON.stringify({
      client_version: '0.145.0',
      models: [
        {
          slug: 'gpt-5.6-luna',
          display_name: 'GPT-5.6-Luna',
          visibility: 'list',
          default_reasoning_level: 'low',
          supported_reasoning_levels: [{ effort: 'low' }],
        },
      ],
    }),
  );
  const config = normalizeAgentConfig({
    backendUrl: 'https://pairdock.test',
    agentId: 'local-agent-1',
    models: [{ id: 'gpt-5.5', label: 'GPT-5.5', provider: 'codex' }],
  });
  const warnings: string[] = [];

  const enriched = await enrichConfigWithCodexModels(config, cachePath, {
    installedCodexVersion: '0.143.0',
    onWarning: (message) => warnings.push(message),
  });

  assert.deepEqual(enriched.models, config.models);
  assert.match(warnings[0] ?? '', /codex update/);
});

test('BT-020: normalizeAgentConfig trims and preserves preview config fields', () => {
  const config = normalizeAgentConfig({
    backendUrl: ' https://pairdock.test/agent?ignored=yes#ignored ',
    agentId: ' local-agent-1 ',
    authToken: ' secret-token ',
    capabilities: [' session.prepare ', 'session.close', 'session.prepare '],
    projectPaths: {
      ' pairdock ': ' /tmp/pairdock ',
    },
    previewConfigs: {
      ' pairdock ': {
        sandbox: {
          startCommand: ' bun dev ',
          stopCommand: ' bun stop ',
          healthcheckUrl: ' http://127.0.0.1:3000/health ',
        },
        tunnel: {
          publicUrl: ' https://preview.pairdock.test ',
          image: ' cloudflare/cloudflared:latest ',
          startupTimeoutMs: 15000,
        },
        healthcheckTimeoutMs: 30000,
        healthcheckIntervalMs: 500,
      },
    },
  });

  assert.deepEqual(config, {
    backendUrl: 'https://pairdock.test',
    agentId: 'local-agent-1',
    authToken: 'secret-token',
    capabilities: ['session.prepare', 'session.close'],
    models: [],
    projects: [],
    projectPaths: {
      pairdock: '/tmp/pairdock',
    },
    previewConfigs: {
      pairdock: {
        sandbox: {
          startCommand: 'bun dev',
          stopCommand: 'bun stop',
          healthcheckUrl: 'http://127.0.0.1:3000/health',
        },
        tunnel: {
          publicUrl: 'https://preview.pairdock.test',
          image: 'cloudflare/cloudflared:latest',
          startupTimeoutMs: 15000,
        },
        healthcheckTimeoutMs: 30000,
        healthcheckIntervalMs: 500,
      },
    },
  });
});

test('normalizeAgentConfig refuses to send agent credentials over remote plaintext HTTP', () => {
  assert.throws(
    () => normalizeAgentConfig({ backendUrl: 'http://pairdock.example.test', agentId: 'local-agent-1' }),
    /must use HTTPS/,
  );
  assert.throws(
    () => normalizeAgentConfig({ backendUrl: 'https://user:password@pairdock.example.test', agentId: 'local-agent-1' }),
    /must not contain credentials/,
  );

  assert.equal(
    normalizeAgentConfig({ backendUrl: 'http://127.0.0.1:3000', agentId: 'local-agent-1' }).backendUrl,
    'http://127.0.0.1:3000',
  );
});

test('normalizeAgentConfig rejects preview settings that expose ports or enable Docker option injection', () => {
  const baseConfig = {
    backendUrl: 'https://pairdock.test',
    agentId: 'local-agent-1',
  };

  assert.throws(
    () =>
      normalizeAgentConfig({
        ...baseConfig,
        previewConfigs: {
          pairdock: {
            sandbox: {
              startCommand: 'bun dev',
              healthcheckUrl: 'http://169.254.169.254/latest/meta-data',
            },
          },
        },
      }),
    /must target a loopback address/,
  );
  assert.throws(
    () =>
      normalizeAgentConfig({
        ...baseConfig,
        previewConfigs: {
          pairdock: {
            sandbox: {
              startCommand: 'bun dev',
              healthcheckUrl: 'http://127.0.0.1:4000',
              image: '--privileged',
              ports: ['0.0.0.0:4000:4000'],
            },
          },
        },
      }),
    /safe container image reference|must bind valid ports/,
  );
});

test('V1: normalizeAgentConfig trims and deduplicates agent models and published projects', () => {
  const config = normalizeAgentConfig({
    backendUrl: 'https://pairdock.test',
    agentId: 'local-agent-1',
    models: [
      { id: ' agent/gpt-5 ', label: ' GPT-5 ', provider: ' local ' },
      { id: 'agent/gpt-5', label: 'Duplicate', provider: 'local' },
    ],
    projects: [
      {
        key: ' pairdock ',
        name: ' PairDock ',
        repoFullName: ' mathis-gala/PairDock ',
        pathAlias: ' PairDock ',
        defaultBranch: ' main ',
        models: [' agent/gpt-5 '],
      },
    ],
  });

  assert.deepEqual(config.models, [{ id: 'agent/gpt-5', label: 'GPT-5', provider: 'local' }]);
  assert.deepEqual(config.projects, [
    {
      key: 'pairdock',
      name: 'PairDock',
      repoFullName: 'mathis-gala/PairDock',
      pathAlias: 'PairDock',
      defaultBranch: 'main',
      models: ['agent/gpt-5'],
    },
  ]);
});

test('BT-021: normalizeAgentConfig omits optional preview config sections when absent', () => {
  const config = normalizeAgentConfig({
    backendUrl: 'https://pairdock.test',
    agentId: 'local-agent-1',
    previewConfigs: {
      pairdock: {
        sandbox: {
          startCommand: 'bun dev',
          healthcheckUrl: 'http://127.0.0.1:3000/health',
        },
      },
    },
  });

  assert.deepEqual(config.previewConfigs, {
    pairdock: {
      sandbox: {
        startCommand: 'bun dev',
        healthcheckUrl: 'http://127.0.0.1:3000/health',
      },
    },
  });
});

test('Task 9: normalizeAgentConfig trims and preserves agent harness command templates', () => {
  const config = normalizeAgentConfig({
    backendUrl: 'https://pairdock.test',
    agentId: 'local-agent-1',
    agentHarnessConfigs: {
      ' pairdock ': {
        command: ' node ',
        args: [' /tmp/mock-harness.mjs ', ' {{prompt}} ', '{{modelId}} '],
      },
    },
  });

  assert.deepEqual(config.agentHarnessConfigs, {
    pairdock: {
      command: 'node',
      args: ['/tmp/mock-harness.mjs', '{{prompt}}', '{{modelId}}'],
    },
  });
});

test('Task 11: normalizeAgentConfig trims and preserves validation check commands', () => {
  const config = normalizeAgentConfig({
    backendUrl: 'https://pairdock.test',
    agentId: 'local-agent-1',
    checksConfigs: {
      ' pairdock ': {
        build: ' bun run build ',
        test: ' bun test ',
        lint: ' bun run lint ',
      },
    },
  });

  assert.deepEqual(config.checksConfigs, {
    pairdock: {
      build: 'bun run build',
      test: 'bun test',
      lint: 'bun run lint',
    },
  });
});

test('V1: local agent login command stores declared models and project mappings', async () => {
  const configDir = await mkdtemp(join(tmpdir(), 'pairdock-agent-config-'));
  const configPath = join(configDir, 'agent.json');
  const result = await runCommand(
    'node',
    [
      '--import',
      'tsx',
      resolve(__dirname, '../../../../packages/local-agent/src/main.ts'),
      'login',
      '--agent-id',
      'local-agent-1',
      '--backend-url',
      'http://127.0.0.1:3000',
      '--token',
      'local-agent-secret-token',
      '--model',
      'gpt-5=GPT-5=codex',
      '--project',
      'tcg=/Users/mathis/Documents/TCG Collection',
    ],
    {
      PAIRDOCK_AGENT_CONFIG_PATH: configPath,
    },
  );

  assert.equal(result.exitCode, 0, result.output);

  const config = JSON.parse(await readFile(configPath, 'utf8')) as {
    models: Array<{ id: string; label: string; provider: string }>;
    projectPaths: Record<string, string>;
  };

  assert.deepEqual(config.models, [{ id: 'gpt-5', label: 'GPT-5', provider: 'codex' }]);
  assert.deepEqual(config.projectPaths, { tcg: '/Users/mathis/Documents/TCG Collection' });
  assert.equal((await stat(configPath)).mode & 0o777, 0o600);
});

function runCommand(
  command: string,
  args: string[],
  env: Record<string, string>,
): Promise<{ exitCode: number | null; output: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';

    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (exitCode) => resolve({ exitCode, output }));
  });
}
