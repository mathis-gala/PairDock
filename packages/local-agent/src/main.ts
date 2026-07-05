#!/usr/bin/env bun

import { parseArgs } from 'node:util';
import { loadAgentConfig, saveAgentConfig, summarizeAgentConfig } from './config/agent-config.js';
import { enrichConfigWithProjectManifests } from './config/project-manifest.js';
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
      project: { type: 'string', multiple: true },
      token: { type: 'string' },
    },
    strict: true,
  });

  const projectPaths = parseProjectMappings(values.project);

  const { config, path } = await saveAgentConfig({
    agentId: values['agent-id'] ?? '',
    authToken: values.token,
    backendUrl: values['backend-url'] ?? '',
    capabilities: values.capability,
    projectPaths,
  });

  const summary = summarizeAgentConfig(config);
  console.log(`Saved PairDock agent config to ${path}.`);
  console.log(`Backend URL: ${summary.backendUrl}`);
  console.log(`Agent ID: ${summary.agentId}`);
  console.log(`Capabilities: ${summary.capabilities.length}`);
  console.log(`Projects configured: ${summary.projectCount}`);
  console.log(`Token configured: ${summary.tokenConfigured ? 'yes' : 'no'}`);
}

async function runStart() {
  const config = await enrichConfigWithProjectManifests(await loadAgentConfig());
  const client = new AgentClient(config);

  await client.start();
  await waitForShutdownSignal(async () => {
    await client.stop();
  });
}

async function runStatus() {
  const config = await enrichConfigWithProjectManifests(await loadAgentConfig());
  const summary = summarizeAgentConfig(config);

  console.log(`Backend URL: ${summary.backendUrl}`);
  console.log(`Agent ID: ${summary.agentId}`);
  console.log(`Capabilities: ${summary.capabilities.join(', ') || '(none)'}`);
  console.log(`Projects configured: ${summary.projectCount}`);
  console.log(`Projects published: ${summary.publishedProjectCount}`);
  console.log(`Models published: ${summary.modelCount}`);
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

function parseProjectMappings(projectMappings: string[] | undefined): Record<string, string> {
  return Object.fromEntries((projectMappings ?? []).map(parseProjectMapping));
}

function parseProjectMapping(projectMapping: string): [string, string] {
  const separatorIndex = projectMapping.indexOf('=');

  if (separatorIndex <= 0 || separatorIndex === projectMapping.length - 1) {
    throw new Error(`Invalid --project value "${projectMapping}". Expected <project-key>=<repository-path>.`);
  }

  return [projectMapping.slice(0, separatorIndex), projectMapping.slice(separatorIndex + 1)];
}

await main();
