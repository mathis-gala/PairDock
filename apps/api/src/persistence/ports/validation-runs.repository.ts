import type { ValidationRun } from '@pairdock/domain';

export interface CreateValidationRunInput {
  sessionId: string;
  status: string;
  buildStatus?: string | null;
  testStatus?: string | null;
  lintStatus?: string | null;
  previewStatus?: string | null;
  logsRef?: string | null;
}

export interface ValidationRunsRepository {
  create(input: CreateValidationRunInput): Promise<ValidationRun>;
  findLatestBySessionId(sessionId: string): Promise<ValidationRun | null>;
}
