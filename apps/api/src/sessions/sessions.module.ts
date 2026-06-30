import { Module } from '@nestjs/common';
import { AgentGatewayModule } from '../agent-gateway/agent-gateway.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthenticatedUserGuard } from '../auth/authenticated-user.guard.js';
import { SessionAccessGuard } from '../auth/session-access.guard.js';
import { InvitationsModule } from '../invitations/invitations.module.js';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { SessionCloseService } from './session-close.service.js';
import { SessionPromptService } from './session-prompt.service.js';
import { SessionsController } from './sessions.controller.js';
import { SessionsService } from './sessions.service.js';

@Module({
  imports: [AuthModule, InvitationsModule, PersistenceModule, AgentGatewayModule],
  controllers: [SessionsController],
  providers: [AuthenticatedUserGuard, SessionAccessGuard, SessionsService, SessionCloseService, SessionPromptService],
})
export class SessionsModule {}
