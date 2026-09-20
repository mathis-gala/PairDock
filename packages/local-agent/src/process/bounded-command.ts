import { type ChildProcess, spawn } from 'node:child_process';
import { signalProcessGroup } from './host-process-group.js';

export type BoundedCommandRunner = (
  command: string,
  args: string[],
  timeoutMs: number,
  signal?: AbortSignal,
) => Promise<{ stdout: string; stderr: string }>;

const MAX_COMMAND_OUTPUT_BYTES = 512 * 1_024;

// Commands must be spawned detached on POSIX so npm launchers and their native child exit together.
export function killCommandProcess(child: ChildProcess): void {
  if (!child.pid) return;
  if (process.platform === 'win32') child.kill('SIGKILL');
  else signalProcessGroup(child.pid, 'SIGKILL');
}

export function runBoundedCommand(
  command: string,
  args: string[],
  timeoutMs: number,
  signal?: AbortSignal,
  environment?: NodeJS.ProcessEnv,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('The local command was cancelled.'));
      return;
    }
    const child = spawn(command, args, {
      detached: process.platform !== 'win32',
      env: environment,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    let receivedBytes = 0;
    let failure: Error | undefined;
    const timeout = setTimeout(() => stop(new Error('The local command timed out.')), timeoutMs);
    const abort = () => stop(new Error('The local command was cancelled.'));
    signal?.addEventListener('abort', abort, { once: true });

    function stop(error: Error) {
      if (failure) return;
      failure = error;
      clearTimeout(timeout);
      child.stdout.destroy();
      child.stderr.destroy();
      killCommandProcess(child);
    }

    function collect(chunk: string, stream: 'stdout' | 'stderr') {
      if (failure) return;
      receivedBytes += Buffer.byteLength(chunk);
      if (receivedBytes > MAX_COMMAND_OUTPUT_BYTES) {
        stop(new Error('The local command exceeded its output limit.'));
        return;
      }
      if (stream === 'stdout') stdout += chunk;
      else stderr += chunk;
    }

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => collect(chunk, 'stdout'));
    child.stderr.on('data', (chunk: string) => collect(chunk, 'stderr'));
    child.on('error', () => stop(new Error('The local command could not be started.')));
    child.on('close', (code) => {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
      if (failure) reject(failure);
      else if (code !== 0) reject(new Error('The local command failed.'));
      else resolve({ stdout, stderr });
    });
  });
}
