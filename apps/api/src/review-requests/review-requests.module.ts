import { Module } from '@nestjs/common';
import { AgentGatewayModule } from '../agent-gateway/agent-gateway.module.js';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { SourceControlModule } from '../source-control/source-control.module.js';
import { ValidationModule } from '../validation/validation.module.js';
import { CreateDraftReviewRequestUseCase } from './create-draft-review-request.use-case.js';

@Module({
  imports: [AgentGatewayModule, PersistenceModule, SourceControlModule, ValidationModule],
  providers: [CreateDraftReviewRequestUseCase],
  exports: [CreateDraftReviewRequestUseCase],
})
export class ReviewRequestsModule {}
