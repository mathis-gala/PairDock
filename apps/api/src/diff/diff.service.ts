import type { AgentEventsRepository } from '../persistence/ports/agent-events.repository.js';

export interface SessionDiffView {
  diff: string;
  changedFiles: string[];
}

export class DiffService {
  constructor(private readonly agentEventsRepository: AgentEventsRepository) {}

  async getLatestDiff(sessionId: string): Promise<SessionDiffView | null> {
    const events = await this.agentEventsRepository.listBySessionId(sessionId);

    for (let index = events.length - 1; index >= 0; index -= 1) {
      const event = events[index];

      if (event?.type !== 'git.diff') {
        continue;
      }

      const payload = event.payload;

      if (!isSessionDiffPayload(payload)) {
        continue;
      }

      return {
        diff: payload.diff,
        changedFiles: [...payload.changedFiles],
      };
    }

    return null;
  }
}

function isSessionDiffPayload(payload: unknown): payload is SessionDiffView {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  if (!('diff' in payload) || !('changedFiles' in payload)) {
    return false;
  }

  return (
    typeof payload.diff === 'string' &&
    Array.isArray(payload.changedFiles) &&
    payload.changedFiles.every((file) => typeof file === 'string')
  );
}
