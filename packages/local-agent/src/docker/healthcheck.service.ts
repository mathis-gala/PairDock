import type { HealthcheckResult, SandboxPort, SandboxRef } from './sandbox.port.js';

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_INTERVAL_MS = 500;

export class HealthcheckTimeoutError extends Error {
  readonly retryable = true;

  constructor(message: string) {
    super(message);
    this.name = 'HealthcheckTimeoutError';
  }
}

export interface HealthcheckWaitInput {
  sandboxPort: SandboxPort;
  sandboxRef: SandboxRef;
  timeoutMs?: number;
  intervalMs?: number;
}

export class HealthcheckService {
  async waitUntilReady(input: HealthcheckWaitInput): Promise<HealthcheckResult> {
    const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const intervalMs = input.intervalMs ?? DEFAULT_INTERVAL_MS;
    const deadline = Date.now() + timeoutMs;
    let lastMessage: string | undefined;

    while (Date.now() <= deadline) {
      const result = await input.sandboxPort.check(input.sandboxRef);
      lastMessage = result.message;

      if (result.ready) {
        return result;
      }

      if (Date.now() + intervalMs > deadline) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new HealthcheckTimeoutError(
      `Preview healthcheck did not become ready for session ${input.sandboxRef.sessionId} within ${timeoutMs}ms.${lastMessage ? ` Last result: ${lastMessage}` : ''}`,
    );
  }
}
