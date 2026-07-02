import { Injectable } from '@nestjs/common';
import type { SessionStatus, ValidationRun } from '@pairdock/domain';

@Injectable()
export class ValidationPolicy {
  canCreateDraftReviewRequest(validationRun: ValidationRun | null, sessionStatus: SessionStatus): boolean {
    return this.failureReasons(validationRun, sessionStatus).length === 0;
  }

  failureReasons(validationRun: ValidationRun | null, sessionStatus: SessionStatus): string[] {
    const reasons: string[] = [];

    if (!validationRun) {
      reasons.push('A validation run is required before creating a draft review request.');
      return reasons;
    }

    if (sessionStatus !== 'AWAITING_PM_VALIDATION') {
      reasons.push('Session must be awaiting PM validation before creating a draft review request.');
    }

    if (validationRun.buildStatus !== 'passed') {
      reasons.push('Build validation must pass before creating a draft review request.');
    }

    if (validationRun.testStatus !== 'passed') {
      reasons.push('Test validation must pass before creating a draft review request.');
    }

    if (validationRun.lintStatus !== 'passed') {
      reasons.push('Lint validation must pass before creating a draft review request.');
    }

    if (validationRun.previewStatus !== 'passed') {
      reasons.push('Preview validation must pass before creating a draft review request.');
    }

    return reasons;
  }
}
