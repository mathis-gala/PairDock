import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { UiGatewayModule } from '../ui-gateway/ui-gateway.module.js';
import { ValidationModule } from '../validation/validation.module.js';
import { AgentGateway } from './agent.gateway.js';
import { AgentAuthenticationService } from './agent-authentication.service.js';
import { AgentCommandRouterService } from './agent-command-router.service.js';
import { AgentExecutionCapabilitiesService } from './agent-execution-capabilities.service.js';
import { ConnectedAgentsRegistry } from './connected-agents.registry.js';

@Module({
  imports: [PersistenceModule, UiGatewayModule, ValidationModule],
  providers: [
    AgentAuthenticationService,
    ConnectedAgentsRegistry,
    AgentGateway,
    AgentCommandRouterService,
    AgentExecutionCapabilitiesService,
  ],
  exports: [AgentGateway, AgentCommandRouterService, AgentExecutionCapabilitiesService, ConnectedAgentsRegistry],
})
export class AgentGatewayModule {}
