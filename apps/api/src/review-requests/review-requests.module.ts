import { Module } from '@nestjs/common';
import { AgentGatewayModule } from '../agent-gateway/agent-gateway.module.js';
import { AttachmentsModule } from '../attachments/attachments.module.js';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { SourceControlModule } from '../source-control/source-control.module.js';
import { ValidationModule } from '../validation/validation.module.js';
import { CreateReviewRequestUseCase } from './create-review-request.use-case.js';

@Module({
  imports: [AgentGatewayModule, AttachmentsModule, PersistenceModule, SourceControlModule, ValidationModule],
  providers: [CreateReviewRequestUseCase],
  exports: [CreateReviewRequestUseCase],
})
export class ReviewRequestsModule {}
