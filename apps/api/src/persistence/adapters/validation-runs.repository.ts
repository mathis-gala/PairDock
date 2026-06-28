import { Injectable } from '@nestjs/common';
import type { ValidationRun } from '@pairdock/domain';
import type { DatabaseExecutor } from '../client.js';
import type { CreateValidationRunInput, ValidationRunsRepository } from '../ports/validation-runs.repository.js';
import { mapValidationRun } from './mappers.js';

@Injectable()
export class ValidationRunsRepositoryAdapter implements ValidationRunsRepository {
  constructor(private readonly prisma: DatabaseExecutor) {}

  async create(input: CreateValidationRunInput): Promise<ValidationRun> {
    const record = await this.prisma.validationRun.create({
      data: {
        sessionId: input.sessionId,
        status: input.status,
        buildStatus: input.buildStatus ?? null,
        testStatus: input.testStatus ?? null,
        lintStatus: input.lintStatus ?? null,
        previewStatus: input.previewStatus ?? null,
        logsRef: input.logsRef ?? null,
      },
    });

    return mapValidationRun(record);
  }

  async findLatestBySessionId(sessionId: string): Promise<ValidationRun | null> {
    const record = await this.prisma.validationRun.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });

    return record ? mapValidationRun(record) : null;
  }
}
