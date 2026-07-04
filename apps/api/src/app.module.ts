import { Module } from '@nestjs/common';
import { AgentGatewayModule } from './agent-gateway/agent-gateway.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthController } from './health.controller.js';
import { InvitationsModule } from './invitations/invitations.module.js';
import { PersistenceModule } from './persistence/persistence.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { SessionsModule } from './sessions/sessions.module.js';
import { SourceControlModule } from './source-control/source-control.module.js';
import { ToolReadinessModule } from './tool-readiness/tool-readiness.module.js';
import { UiGatewayModule } from './ui-gateway/ui-gateway.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    PersistenceModule,
    SourceControlModule,
    UsersModule,
    InvitationsModule,
    AuthModule,
    ProjectsModule,
    ToolReadinessModule,
    SessionsModule,
    UiGatewayModule,
    AgentGatewayModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
