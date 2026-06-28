import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeAgentConfig } from '../../../../packages/local-agent/src/config/agent-config.js';

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
          startCommand: ' cloudflared tunnel run ',
          closeCommand: ' pkill cloudflared ',
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
          startCommand: 'cloudflared tunnel run',
          closeCommand: 'pkill cloudflared',
          startupTimeoutMs: 15000,
        },
        healthcheckTimeoutMs: 30000,
        healthcheckIntervalMs: 500,
      },
    },
  });
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
