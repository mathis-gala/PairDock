import { Module } from '@nestjs/common';
import { AgentGatewayModule } from '../agent-gateway/agent-gateway.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { AgentOnboardingController } from './agent-onboarding.controller.js';
import { AgentOnboardingService } from './agent-onboarding.service.js';
import { AgentPairingClientAddress } from './agent-pairing-client-address.js';
import { AgentPairingLimiter } from './agent-pairing-limiter.js';

@Module({
  imports: [PersistenceModule, AuthModule, AgentGatewayModule],
  controllers: [AgentOnboardingController],
  providers: [AgentOnboardingService, AgentPairingLimiter, AgentPairingClientAddress],
})
export class AgentOnboardingModule {}
