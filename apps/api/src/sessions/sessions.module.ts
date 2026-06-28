import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { SessionAccessGuard } from '../auth/session-access.guard.js';
import { InvitationsModule } from '../invitations/invitations.module.js';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { SessionsController } from './sessions.controller.js';

@Module({
  imports: [AuthModule, InvitationsModule, PersistenceModule],
  controllers: [SessionsController],
  providers: [SessionAccessGuard],
})
export class SessionsModule {}
