import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { Resolver } from 'node:dns/promises';
import type { Readable } from 'node:stream';
import { setTimeout as delay } from 'node:timers/promises';
import type { ProjectPreviewConfig } from '../docker/sandbox.port.js';
import type { PreviewTunnelOpenInput, PreviewTunnelPort, PreviewTunnelRef } from './preview-tunnel.port.js';

const TRY_CLOUDFLARE_URL = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;
const DEFAULT_CLOUDFLARED_IMAGE =
  'cloudflare/cloudflared@sha256:4f6655284ab3d252b7f28fedb19fe6c8fc82ee5b1295c20ac74d475e5398a52d';

interface ManagedTunnelProcess {
  process: TunnelProcessLike;
  cwd: string;
}

interface TunnelProcessLike {
  killed: boolean;
  exitCode: number | null;
  stdout: Readable | null;
  stderr: Readable | null;
  kill(signal?: NodeJS.Signals): boolean;
  off(event: 'exit', listener: (code: number | null) => void): this;
  off(event: 'error', listener: (error: Error) => void): this;
  once(event: 'exit', listener: (code: number | null) => void): this;
  once(event: 'error', listener: (error: Error) => void): this;
}

interface CloudflarePreviewTunnelDependencies {
  spawn?: (
    command: string,
    args: string[],
    options: { cwd?: string; shell: false; stdio: ['ignore', 'pipe', 'pipe'] | 'ignore' },
  ) => TunnelProcessLike;
  waitForPublicUrl?: (process: TunnelProcessLike, timeoutMs: number) => Promise<string>;
  waitUntilPublicUrlReady?: (publicUrl: string, timeoutMs: number) => Promise<void>;
}

export class CloudflarePreviewTunnelAdapter implements PreviewTunnelPort {
  private readonly processes = new Map<string, ManagedTunnelProcess>();

  constructor(private readonly dependencies: CloudflarePreviewTunnelDependencies = {}) {}

  async open(input: PreviewTunnelOpenInput): Promise<PreviewTunnelRef> {
    const tunnelConfig = input.previewConfig?.tunnel;

    if (tunnelConfig?.publicUrl) {
      return {
        id: randomUUID(),
        sessionId: input.sessionId,
        publicUrl: tunnelConfig.publicUrl,
      };
    }

    const containerName = buildTunnelContainerName(input.sessionId);
    const startArgs = buildCloudflareDockerArgs(input.localUrl, containerName, tunnelConfig?.image);

    const { process, publicUrl } = await this.openTunnelProcess({
      args: startArgs,
      cwd: input.worktreePath,
      timeoutMs: tunnelConfig?.startupTimeoutMs ?? 45_000,
    });
    const ref: PreviewTunnelRef = {
      id: randomUUID(),
      sessionId: input.sessionId,
      publicUrl,
      metadata: {
        type: 'docker',
        containerName,
      },
    };

    this.processes.set(ref.id, {
      cwd: input.worktreePath,
      process,
    });
    return ref;
  }

  async close(ref: PreviewTunnelRef, previewConfig?: ProjectPreviewConfig): Promise<void> {
    void previewConfig;
    const managedProcess = this.processes.get(ref.id);
    const containerName = resolveRestoredTunnelContainerName(ref);

    if (containerName) {
      const stopProcess = this.spawn('docker', ['stop', containerName], {
        cwd: managedProcess?.cwd,
        shell: false,
        stdio: 'ignore',
      });
      await Promise.race([onceExit(stopProcess), delay(5_000)]);
    }

    if (managedProcess?.process && !managedProcess.process.killed && managedProcess.process.exitCode === null) {
      managedProcess.process.kill('SIGTERM');
      await Promise.race([onceExit(managedProcess.process), delay(2_000)]);
      if (!managedProcess.process.killed && managedProcess.process.exitCode === null) {
        managedProcess.process.kill('SIGKILL');
      }
    }

    this.processes.delete(ref.id);
  }

  private spawn(
    command: string,
    args: string[],
    options: Parameters<NonNullable<CloudflarePreviewTunnelDependencies['spawn']>>[2],
  ) {
    return this.dependencies.spawn?.(command, args, options) ?? (spawn(command, args, options) as TunnelProcessLike);
  }

  private waitForPublicUrl(process: TunnelProcessLike, timeoutMs: number): Promise<string> {
    return this.dependencies.waitForPublicUrl?.(process, timeoutMs) ?? waitForPublicUrl(process, timeoutMs);
  }

  private waitUntilPublicUrlReady(publicUrl: string, timeoutMs: number): Promise<void> {
    return (
      this.dependencies.waitUntilPublicUrlReady?.(publicUrl, timeoutMs) ?? waitUntilPublicUrlReady(publicUrl, timeoutMs)
    );
  }

  private async openTunnelProcess(input: {
    args: string[];
    cwd: string;
    timeoutMs: number;
  }): Promise<{ process: TunnelProcessLike; publicUrl: string }> {
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const startedAt = Date.now();
      const process = this.spawn('docker', input.args, {
        cwd: input.cwd,
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      try {
        const publicUrl = await this.waitForPublicUrl(process, input.timeoutMs);
        const remainingTimeoutMs = Math.max(1, input.timeoutMs - (Date.now() - startedAt));
        await this.waitUntilPublicUrlReady(publicUrl, remainingTimeoutMs);

        return {
          process,
          publicUrl,
        };
      } catch (error) {
        lastError = error;
        await terminateProcess(process);
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }
}

async function waitUntilPublicUrlReady(publicUrl: string, timeoutMs: number): Promise<void> {
  const url = new URL(publicUrl);
  const resolver = new Resolver();
  resolver.setServers(['1.1.1.1', '1.0.0.1']);
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      await resolver.resolve4(url.hostname);
      const remainingTimeoutMs = Math.max(1, deadline - Date.now());
      const response = await fetch(publicUrl, {
        redirect: 'manual',
        signal: AbortSignal.timeout(Math.min(5_000, remainingTimeoutMs)),
      });

      if (response.status >= 200 && response.status < 400) {
        await response.body?.cancel();
        return;
      }

      await response.body?.cancel();
      lastError = new Error(`Cloudflare preview returned HTTP ${response.status}.`);
    } catch (error) {
      lastError = error;
    }

    const remainingTimeoutMs = deadline - Date.now();
    if (remainingTimeoutMs > 0) {
      await delay(Math.min(500, remainingTimeoutMs));
    }
  }

  const reason = lastError instanceof Error ? lastError.message : String(lastError ?? 'unknown error');
  throw new Error(`Cloudflare preview URL was not reachable after ${timeoutMs}ms: ${reason}`);
}

async function waitForPublicUrl(process: TunnelProcessLike, timeoutMs: number): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for Cloudflare tunnel URL after ${timeoutMs}ms.`));
    }, timeoutMs);

    const handleChunk = (chunk: Buffer | string) => {
      const text = chunk.toString();
      const match = text.match(TRY_CLOUDFLARE_URL);

      if (match?.[0]) {
        cleanup();
        resolve(match[0]);
      }
    };

    const handleExit = (code: number | null) => {
      cleanup();
      reject(new Error(`Cloudflare tunnel process exited before publishing a URL (code: ${code ?? 'unknown'}).`));
    };

    const cleanup = () => {
      clearTimeout(timeout);
      process.stdout?.off('data', handleChunk);
      process.stderr?.off('data', handleChunk);
      process.off('exit', handleExit);
      process.off('error', reject);
    };

    process.stdout?.on('data', handleChunk);
    process.stderr?.on('data', handleChunk);
    process.once('exit', handleExit);
    process.once('error', reject);
  });
}

async function onceExit(process: TunnelProcessLike): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    process.once('exit', () => resolve());
    process.once('error', reject);
  });
}

async function terminateProcess(process: TunnelProcessLike): Promise<void> {
  if (process.killed || process.exitCode !== null) {
    return;
  }

  process.kill('SIGTERM');
  await Promise.race([onceExit(process), delay(2_000)]);
  if (!process.killed && process.exitCode === null) {
    process.kill('SIGKILL');
  }
}

function buildCloudflareDockerArgs(
  localUrl: string,
  containerName: string,
  image = DEFAULT_CLOUDFLARED_IMAGE,
): string[] {
  assertSafeContainerImage(image);
  return [
    'run',
    '--rm',
    '--name',
    containerName,
    '--add-host',
    'host.docker.internal:host-gateway',
    image,
    'tunnel',
    '--url',
    toHostDockerUrl(localUrl),
    '--http-host-header',
    'localhost',
  ];
}

function buildTunnelContainerName(sessionId: string): string {
  const normalizedSessionId = sessionId
    .toLowerCase()
    .replaceAll(/[^a-z0-9]/g, '')
    .slice(0, 24);
  return `pairdock-tunnel-${normalizedSessionId}`;
}

function resolveRestoredTunnelContainerName(ref: PreviewTunnelRef): string | null {
  if (ref.metadata?.type !== 'docker') {
    return null;
  }

  const expectedContainerName = buildTunnelContainerName(ref.sessionId);
  if (ref.metadata.containerName !== expectedContainerName) {
    throw new Error(`Invalid persisted Cloudflare container name for session ${ref.sessionId}.`);
  }

  return expectedContainerName;
}

function toHostDockerUrl(localUrl: string): string {
  const url = new URL(localUrl);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Preview tunnel URL must use HTTP(S).');
  }

  if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
    url.hostname = 'host.docker.internal';
  }

  return url.toString().replace(/\/$/, '');
}

function assertSafeContainerImage(image: string): void {
  if (
    image.length > 512 ||
    image.startsWith('-') ||
    image.includes('://') ||
    /[\s\0]/.test(image) ||
    !/^[a-z0-9][a-z0-9._\-/:@]+$/i.test(image)
  ) {
    throw new Error('Cloudflare tunnel image must be a valid container image reference.');
  }
}
