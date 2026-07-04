import { Module } from '@nestjs/common';
import { AgentGatewayModule } from '../agent-gateway/agent-gateway.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { ToolReadinessController } from './tool-readiness.controller.js';
import { ToolReadinessService } from './tool-readiness.service.js';

@Module({
  imports: [AuthModule, PersistenceModule, AgentGatewayModule],
  controllers: [ToolReadinessController],
  providers: [ToolReadinessService],
  exports: [ToolReadinessService],
})
export class ToolReadinessModule {}
