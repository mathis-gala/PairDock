import { type ChildProcess, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import type {
  HealthcheckResult,
  ProjectPreviewConfig,
  SandboxPort,
  SandboxRef,
  SandboxStartInput,
} from './sandbox.port.js';

interface ManagedSandboxProcess {
  process: ChildProcess;
  cwd: string;
}

export class DockerSandboxAdapter implements SandboxPort {
  private readonly processes = new Map<string, ManagedSandboxProcess>();

  async start(input: SandboxStartInput): Promise<SandboxRef> {
    const sandboxConfig = input.previewConfig?.sandbox;

    if (!sandboxConfig?.startCommand || !sandboxConfig.healthcheckUrl) {
      throw new Error(`Missing sandbox preview config for project ${input.projectKey}.`);
    }

    const process = spawn(sandboxConfig.startCommand, {
      cwd: input.worktreePath,
      shell: true,
      stdio: 'ignore',
    });

    const sandboxRef: SandboxRef = {
      id: randomUUID(),
      sessionId: input.sessionId,
      healthcheckUrl: sandboxConfig.healthcheckUrl,
      metadata: {
        projectKey: input.projectKey,
      },
    };

    this.processes.set(sandboxRef.id, {
      cwd: input.worktreePath,
      process,
    });
    return sandboxRef;
  }

  async stop(ref: SandboxRef, previewConfig?: ProjectPreviewConfig): Promise<void> {
    const sandboxConfig = previewConfig?.sandbox;
    const managedProcess = this.processes.get(ref.id);

    if (sandboxConfig?.stopCommand) {
      const stopProcess = spawn(sandboxConfig.stopCommand, {
        cwd: managedProcess?.cwd,
        shell: true,
        stdio: 'ignore',
      });

      await onceExit(stopProcess);
    }

    if (managedProcess?.process && !managedProcess.process.killed) {
      managedProcess.process.kill('SIGTERM');
      await Promise.race([onceExit(managedProcess.process), delay(2_000)]);
      if (!managedProcess.process.killed && managedProcess.process.exitCode === null) {
        managedProcess.process.kill('SIGKILL');
      }
    }

    this.processes.delete(ref.id);
  }

  async check(ref: SandboxRef): Promise<HealthcheckResult> {
    try {
      const response = await fetch(ref.healthcheckUrl);
      return {
        ready: response.ok,
        url: ref.healthcheckUrl,
        message: `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        ready: false,
        url: ref.healthcheckUrl,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

async function onceExit(process: ChildProcess): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    process.once('exit', () => resolve());
    process.once('error', reject);
  });
}
