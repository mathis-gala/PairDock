import { Inject, Injectable } from '@nestjs/common';
import type { Session } from '@pairdock/domain';
import { type ChecksResultEventEnvelope, summarizeChecksFailure } from '@pairdock/shared-contracts';
import { PERSISTENCE_UNIT_OF_WORK } from '../persistence/persistence.tokens.js';
import type { PersistenceUnitOfWork } from '../persistence/ports/persistence-unit-of-work.js';
import { type SessionAgentEvent, SessionStateMachine } from './session-state-machine.js';

type SessionEvent =
  | SessionAgentEvent
  | {
      type: 'checks.result';
      payload: ChecksResultEventEnvelope['payload'];
    };

@Injectable()
export class SessionEventsService {
  private readonly stateMachine = new SessionStateMachine();

  constructor(
    @Inject(PERSISTENCE_UNIT_OF_WORK)
    private readonly persistenceUnitOfWork: PersistenceUnitOfWork,
  ) {}

  async apply(sessionId: string, event: SessionEvent, agentId: string | null = null): Promise<Session | null> {
    return this.persistenceUnitOfWork.execute(async (repositories) => {
      const session = await repositories.sessions.findById(sessionId);

      if (!session) {
        await repositories.agentEvents.create({ sessionId, agentId, type: event.type, payload: event.payload });
        return null;
      }

      let nextSession: Session;
      if (event.type === 'checks.result') {
        const failure = summarizeChecksFailure(event.payload);
        await repositories.validationRuns.create({
          sessionId,
          status: failure ? 'failed' : 'passed',
          buildStatus: event.payload.build.status,
          testStatus: event.payload.tests.status,
          lintStatus: event.payload.lint.status,
          previewStatus: event.payload.preview.status,
          logsRef: null,
        });
        nextSession = {
          ...session,
          status: failure ? 'FAILED' : 'AWAITING_PM_VALIDATION',
          lastError: failure?.message ?? null,
        };
      } else {
        let resolvedEvent = event;
        if (event.type === 'agent.done' && event.payload.exitCode === 0 && event.payload.changesDetected === false) {
          const validation = await repositories.validationRuns.findLatestBySessionId(sessionId);
          let resumeStatus: 'READY' | 'AWAITING_PM_VALIDATION' | 'FAILED' = 'READY';
          if (validation?.status === 'passed') {
            resumeStatus = 'AWAITING_PM_VALIDATION';
          } else if (validation?.status === 'failed') {
            resumeStatus = 'FAILED';
          }
          resolvedEvent = { ...event, payload: { ...event.payload, resumeStatus } };
        }
        nextSession = this.stateMachine.applyAgentEvent(session, resolvedEvent);
      }

      await repositories.agentEvents.create({ sessionId, agentId, type: event.type, payload: event.payload });
      return repositories.sessions.updateStatus({
        id: sessionId,
        status: nextSession.status,
        lastError: nextSession.lastError,
        previewUrl: nextSession.previewUrl,
        closedAt: nextSession.closedAt,
      });
    });
  }
}
