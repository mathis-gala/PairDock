import { Inject, Injectable } from '@nestjs/common';
import type { ValidationRun } from '@pairdock/domain';
import { type ChecksResultEventEnvelope, summarizeChecksFailure } from '@pairdock/shared-contracts';
import { VALIDATION_RUNS_REPOSITORY } from '../persistence/persistence.tokens.js';
import type {
  CreateValidationRunInput,
  ValidationRunsRepository,
} from '../persistence/ports/validation-runs.repository.js';

export interface SessionValidationView {
  status: string;
  buildStatus: string | null;
  testStatus: string | null;
  lintStatus: string | null;
  previewStatus: string | null;
}

@Injectable()
export class ValidationService {
  constructor(
    @Inject(VALIDATION_RUNS_REPOSITORY)
    private readonly validationRunsRepository: ValidationRunsRepository,
  ) {}

  async getLatestValidation(sessionId: string): Promise<SessionValidationView | null> {
    const validationRun = await this.validationRunsRepository.findLatestBySessionId(sessionId);
    return validationRun ? toValidationView(validationRun) : null;
  }

  toValidationRunInput(sessionId: string, payload: ChecksResultEventEnvelope['payload']): CreateValidationRunInput {
    return {
      sessionId,
      status: this.areAllChecksPassing(payload) ? 'passed' : 'failed',
      buildStatus: payload.build.status,
      testStatus: payload.tests.status,
      lintStatus: payload.lint.status,
      previewStatus: payload.preview.status,
      logsRef: null,
    };
  }

  toSessionUpdate(payload: ChecksResultEventEnvelope['payload']): {
    status: 'AWAITING_PM_VALIDATION' | 'FAILED';
    lastError: string | null;
  } {
    if (this.areAllChecksPassing(payload)) {
      return {
        status: 'AWAITING_PM_VALIDATION',
        lastError: null,
      };
    }

    return {
      status: 'FAILED',
      lastError: this.buildFailureMessage(payload),
    };
  }

  private areAllChecksPassing(payload: ChecksResultEventEnvelope['payload']): boolean {
    return [payload.build.status, payload.tests.status, payload.lint.status, payload.preview.status].every(
      (status) => status === 'passed',
    );
  }

  private buildFailureMessage(payload: ChecksResultEventEnvelope['payload']): string {
    return summarizeChecksFailure(payload)?.message ?? 'Validation failed without a reported check failure.';
  }
}

function toValidationView(validationRun: ValidationRun): SessionValidationView {
  return {
    status: validationRun.status,
    buildStatus: validationRun.buildStatus,
    testStatus: validationRun.testStatus,
    lintStatus: validationRun.lintStatus,
    previewStatus: validationRun.previewStatus,
  };
}
