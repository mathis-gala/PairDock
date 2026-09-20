import { Inject, Injectable } from '@nestjs/common';
import type { ValidationRun } from '@pairdock/domain';
import { VALIDATION_RUNS_REPOSITORY } from '../persistence/persistence.tokens.js';
import type { ValidationRunsRepository } from '../persistence/ports/validation-runs.repository.js';

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
