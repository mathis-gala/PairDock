#!/usr/bin/env bun

import { parseArgs } from 'node:util';
import { loadAgentConfig, saveAgentConfig, summarizeAgentConfig } from './config/agent-config.js';
import { AgentClient } from './websocket/agent-client.js';

async function main() {
  const command = process.argv[2] ?? 'start';

  switch (command) {
    case 'login':
      await runLogin();
      return;
    case 'start':
      await runStart();
      return;
    case 'status':
      await runStatus();
      return;
    case 'stop':
      runStop();
      return;
    default:
      console.error(`Unknown pairdock-agent command: ${command}`);
      process.exitCode = 1;
  }
}

async function runLogin() {
  const { values } = parseArgs({
    args: process.argv.slice(3),
    options: {
      'agent-id': { type: 'string' },
      'backend-url': { type: 'string' },
      capability: { type: 'string', multiple: true },
      token: { type: 'string' },
    },
    strict: true,
  });

  const { config, path } = await saveAgentConfig({
    agentId: values['agent-id'] ?? '',
    authToken: values.token,
    backendUrl: values['backend-url'] ?? '',
    capabilities: values.capability,
  });

  const summary = summarizeAgentConfig(config);
  console.log(`Saved PairDock agent config to ${path}.`);
  console.log(`Backend URL: ${summary.backendUrl}`);
  console.log(`Agent ID: ${summary.agentId}`);
  console.log(`Capabilities: ${summary.capabilities.length}`);
  console.log(`Token configured: ${summary.tokenConfigured ? 'yes' : 'no'}`);
}

async function runStart() {
  const config = loadAgentConfig();
  const client = new AgentClient(await config);

  await client.start();
  await waitForShutdownSignal(async () => {
    await client.stop();
  });
}

async function runStatus() {
  const config = await loadAgentConfig();
  const summary = summarizeAgentConfig(config);

  console.log(`Backend URL: ${summary.backendUrl}`);
  console.log(`Agent ID: ${summary.agentId}`);
  console.log(`Capabilities: ${summary.capabilities.join(', ') || '(none)'}`);
  console.log(`Token configured: ${summary.tokenConfigured ? 'yes' : 'no'}`);
}

function runStop() {
  console.log('pairdock-agent start runs in the foreground. Stop the active process with Ctrl+C.');
}

async function waitForShutdownSignal(onShutdown: () => Promise<void>): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      process.off('SIGINT', handleSignal);
      process.off('SIGTERM', handleSignal);
    };

    const handleSignal = () => {
      cleanup();
      onShutdown().then(resolve).catch(reject);
    };

    process.on('SIGINT', handleSignal);
    process.on('SIGTERM', handleSignal);
  });
}

await main();
