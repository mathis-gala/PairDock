import type { Session, SessionStatus } from '@pairdock/domain';

type ProgressStatus = Exclude<SessionStatus, 'CREATED' | 'READY' | 'CLOSING' | 'CLOSED' | 'FAILED'>;
type NoChangesResumeStatus = Extract<SessionStatus, 'READY' | 'AWAITING_PM_VALIDATION' | 'FAILED'>;

export type SessionAgentEvent =
  | { type: 'session.progress'; payload: { status: ProgressStatus; message?: string } }
  | { type: 'session.ready'; payload: { previewUrl: string } }
  | {
      type: 'agent.done';
      payload: { exitCode: number; changesDetected?: boolean; resumeStatus?: NoChangesResumeStatus };
    }
  | { type: 'session.closed'; payload: { cleaned: boolean } }
  | { type: 'error'; payload: { message: string; retryable: boolean } };

export class InvalidSessionTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSessionTransitionError';
  }
}

const allowedProgressTransitions = new Map<Session['status'], SessionStatus[]>([
  ['CREATED', ['AGENT_CONNECTING']],
  ['AGENT_CONNECTING', ['WORKTREE_CREATING']],
  ['WORKTREE_CREATING', ['DOCKER_STARTING']],
  ['DOCKER_STARTING', ['PREVIEW_STARTING']],
  ['READY', ['AGENT_RUNNING']],
  ['AGENT_RUNNING', ['CHECKS_RUNNING']],
  ['CHECKS_RUNNING', ['AWAITING_PM_VALIDATION']],
  ['AWAITING_PM_VALIDATION', ['AGENT_RUNNING', 'REVIEW_REQUEST_CREATING']],
  ['FAILED', ['AGENT_RUNNING']],
  ['REVIEW_REQUEST_CREATING', ['REVIEW_REQUEST_CREATED']],
]);

export class SessionStateMachine {
  applyAgentEvent(session: Session, event: SessionAgentEvent): Session {
    switch (event.type) {
      case 'session.progress':
        return this.applyProgress(session, event.payload.status, event.payload.message);
      case 'session.ready':
        this.assertTransition(session.status, 'READY');
        return {
          ...session,
          status: 'READY',
          previewUrl: event.payload.previewUrl,
          lastError: null,
        };
      case 'agent.done':
        if (event.payload.exitCode === 0) {
          if (event.payload.changesDetected === false) {
            if (session.status !== 'AGENT_RUNNING') {
              throw new InvalidSessionTransitionError(
                `Cannot resume a session without changes from ${session.status}.`,
              );
            }

            return {
              ...session,
              status: event.payload.resumeStatus ?? 'READY',
              lastError:
                event.payload.resumeStatus === 'FAILED'
                  ? 'The latest validation remains failed because this prompt made no file changes.'
                  : null,
            };
          }

          this.assertTransition(session.status, 'CHECKS_RUNNING');
          return {
            ...session,
            status: 'CHECKS_RUNNING',
            lastError: null,
          };
        }

        return {
          ...session,
          status: 'FAILED',
          lastError: `Agent command failed with exit code ${event.payload.exitCode}.`,
        };
      case 'session.closed':
        return {
          ...session,
          status: 'CLOSED',
          closedAt: session.closedAt ?? new Date(),
        };
      case 'error':
        return {
          ...session,
          status: 'FAILED',
          lastError: event.payload.message,
        };
    }
  }

  closeSession(session: Session, closedAt: Date): Session {
    if (session.status === 'CLOSED') {
      return session;
    }

    return {
      ...session,
      status: 'CLOSED',
      closedAt,
    };
  }

  private applyProgress(session: Session, nextStatus: ProgressStatus, message?: string): Session {
    this.assertTransition(session.status, nextStatus);

    return {
      ...session,
      status: nextStatus,
      lastError: message ?? null,
    };
  }

  private assertTransition(currentStatus: Session['status'], nextStatus: Session['status']): void {
    if (nextStatus === 'READY') {
      if (currentStatus !== 'PREVIEW_STARTING') {
        throw new InvalidSessionTransitionError(`Cannot transition session from ${currentStatus} to READY.`);
      }

      return;
    }

    if (nextStatus === 'CHECKS_RUNNING' && currentStatus === 'AGENT_RUNNING') {
      return;
    }

    if (nextStatus === 'CLOSED' && currentStatus === 'CLOSING') {
      return;
    }

    const allowedTransitions = allowedProgressTransitions.get(currentStatus);

    if (allowedTransitions?.includes(nextStatus)) {
      return;
    }

    throw new InvalidSessionTransitionError(`Cannot transition session from ${currentStatus} to ${nextStatus}.`);
  }
}
