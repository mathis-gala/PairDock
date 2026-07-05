import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { Readable } from 'node:stream';
import { setTimeout as delay } from 'node:timers/promises';
import type { ProjectPreviewConfig } from '../docker/sandbox.port.js';
import type { PreviewTunnelOpenInput, PreviewTunnelPort, PreviewTunnelRef } from './preview-tunnel.port.js';

const TRY_CLOUDFLARE_URL = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;

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
    options: { cwd?: string; shell: true; stdio: ['ignore', 'pipe', 'pipe'] | 'ignore' },
  ) => TunnelProcessLike;
  waitForPublicUrl?: (process: TunnelProcessLike, timeoutMs: number) => Promise<string>;
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

    const startCommand = buildCloudflareDockerCommand(input.localUrl, tunnelConfig?.image);

    const { process, publicUrl } = await this.openTunnelProcess({
      command: startCommand,
      cwd: input.worktreePath,
      timeoutMs: tunnelConfig?.startupTimeoutMs ?? 45_000,
    });
    const ref: PreviewTunnelRef = {
      id: randomUUID(),
      sessionId: input.sessionId,
      publicUrl,
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

    if (managedProcess?.process && !managedProcess.process.killed) {
      managedProcess.process.kill('SIGTERM');
      await Promise.race([onceExit(managedProcess.process), delay(2_000)]);
      if (!managedProcess.process.killed && managedProcess.process.exitCode === null) {
        managedProcess.process.kill('SIGKILL');
      }
    }

    this.processes.delete(ref.id);
  }

  private spawn(command: string, options: Parameters<NonNullable<CloudflarePreviewTunnelDependencies['spawn']>>[1]) {
    return this.dependencies.spawn?.(command, options) ?? (spawn(command, options) as TunnelProcessLike);
  }

  private waitForPublicUrl(process: TunnelProcessLike, timeoutMs: number): Promise<string> {
    return this.dependencies.waitForPublicUrl?.(process, timeoutMs) ?? waitForPublicUrl(process, timeoutMs);
  }

  private async openTunnelProcess(input: {
    command: string;
    cwd: string;
    timeoutMs: number;
  }): Promise<{ process: TunnelProcessLike; publicUrl: string }> {
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const process = this.spawn(input.command, {
        cwd: input.cwd,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      try {
        return {
          process,
          publicUrl: await this.waitForPublicUrl(process, input.timeoutMs),
        };
      } catch (error) {
        lastError = error;
        await terminateProcess(process);
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }
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

function buildCloudflareDockerCommand(localUrl: string, image = 'cloudflare/cloudflared:latest'): string {
  return `docker run --rm --add-host host.docker.internal:host-gateway ${image} tunnel --url ${toHostDockerUrl(localUrl)}`;
}

function toHostDockerUrl(localUrl: string): string {
  try {
    const url = new URL(localUrl);

    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      url.hostname = 'host.docker.internal';
    }

    return url.toString().replace(/\/$/, '');
  } catch {
    return localUrl;
  }
}
