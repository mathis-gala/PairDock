import { setTimeout as delay } from 'node:timers/promises';

export async function terminateHostProcessGroup(pid: number): Promise<void> {
  if (!signalProcessGroup(pid, 'SIGTERM')) {
    return;
  }

  await delay(2_000);
  signalProcessGroup(pid, 'SIGKILL');
}

function signalProcessGroup(pid: number, signal: NodeJS.Signals): boolean {
  try {
    process.kill(-pid, signal);
    return true;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ESRCH') {
      return false;
    }
    throw error;
  }
}
