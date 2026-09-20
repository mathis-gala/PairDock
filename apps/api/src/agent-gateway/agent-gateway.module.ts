import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { SessionEventsModule } from '../sessions/session-events.module.js';
import { UiGatewayModule } from '../ui-gateway/ui-gateway.module.js';
import { AgentGateway } from './agent.gateway.js';
import { AgentAuthenticationService } from './agent-authentication.service.js';
import { AgentCommandRouterService } from './agent-command-router.service.js';
import { AgentExecutionCapabilitiesService } from './agent-execution-capabilities.service.js';
import { AgentProjectBindingService } from './agent-project-binding.service.js';
import { ConnectedAgentsRegistry } from './connected-agents.registry.js';

@Module({
  imports: [PersistenceModule, UiGatewayModule, SessionEventsModule],
  providers: [
    AgentAuthenticationService,
    ConnectedAgentsRegistry,
    AgentGateway,
    AgentCommandRouterService,
    AgentExecutionCapabilitiesService,
    AgentProjectBindingService,
  ],
  exports: [
    AgentGateway,
    AgentAuthenticationService,
    AgentCommandRouterService,
    AgentExecutionCapabilitiesService,
    AgentProjectBindingService,
    ConnectedAgentsRegistry,
  ],
})
export class AgentGatewayModule {}
