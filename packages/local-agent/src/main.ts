#!/usr/bin/env bun

import { parseArgs } from 'node:util';
import { loadAgentConfig, saveAgentConfig, summarizeAgentConfig } from './config/agent-config.js';
import { enrichConfigWithCodexModels } from './config/codex-model-catalog.js';
import { enrichConfigWithProjectManifests } from './config/project-manifest.js';
import { PreviewCompanionManager } from './preview/preview-companion-manager.js';
import { startAgentRuntime } from './runtime/agent-runtime.js';

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
      model: { type: 'string', multiple: true },
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
    models: parseModelMappings(values.model),
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
  const config = await loadEnrichedAgentConfig();
  const previewCompanionPort = new PreviewCompanionManager(config.previewCompanions ?? {}, {
    loadAgentConfig: loadEnrichedAgentConfig,
    startRuntime: (input) =>
      startAgentRuntime({
        ...input,
        logger: console,
      }),
  });
  const runtime = await startAgentRuntime({
    config,
    logger: console,
    previewCompanionPort,
  });

  await waitForShutdownSignal(async () => {
    await runtime.stop({ cleanupSessions: false });
  });
}

async function runStatus() {
  const config = await loadEnrichedAgentConfig();
  const summary = summarizeAgentConfig(config);

  console.log(`Backend URL: ${summary.backendUrl}`);
  console.log(`Agent ID: ${summary.agentId}`);
  console.log(`Capabilities: ${summary.capabilities.join(', ') || '(none)'}`);
  console.log(`Projects configured: ${summary.projectCount}`);
  console.log(`Projects published: ${summary.publishedProjectCount}`);
  console.log(`Models published: ${summary.modelCount}`);
  console.log(`Preview companions configured: ${summary.previewCompanionCount}`);
  console.log(`Token configured: ${summary.tokenConfigured ? 'yes' : 'no'}`);
}

async function loadEnrichedAgentConfig(path?: string) {
  return enrichConfigWithProjectManifests(await enrichConfigWithCodexModels(await loadAgentConfig(path)));
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

function parseModelMappings(modelMappings: string[] | undefined) {
  return (modelMappings ?? []).map(parseModelMapping);
}

function parseModelMapping(modelMapping: string): { id: string; label: string; provider: string } {
  const parts = modelMapping.split('=');

  if (parts.length !== 3 || parts.some((part) => part.trim().length === 0)) {
    throw new Error(`Invalid --model value "${modelMapping}". Expected <model-id>=<label>=<provider>.`);
  }

  const [id, label, provider] = parts;
  return { id, label, provider };
}

function parseProjectMapping(projectMapping: string): [string, string] {
  const separatorIndex = projectMapping.indexOf('=');

  if (separatorIndex <= 0 || separatorIndex === projectMapping.length - 1) {
    throw new Error(`Invalid --project value "${projectMapping}". Expected <project-key>=<repository-path>.`);
  }

  return [projectMapping.slice(0, separatorIndex), projectMapping.slice(separatorIndex + 1)];
}

await main();
