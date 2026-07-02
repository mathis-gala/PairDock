import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { UiGatewayModule } from '../ui-gateway/ui-gateway.module.js';
import { ValidationModule } from '../validation/validation.module.js';
import { AgentGateway } from './agent.gateway.js';
import { AgentCommandRouterService } from './agent-command-router.service.js';
import { ConnectedAgentsRegistry } from './connected-agents.registry.js';

@Module({
  imports: [PersistenceModule, UiGatewayModule, ValidationModule],
  providers: [ConnectedAgentsRegistry, AgentGateway, AgentCommandRouterService],
  exports: [AgentGateway, AgentCommandRouterService],
})
export class AgentGatewayModule {}
