import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { InvitationsModule } from '../invitations/invitations.module.js';
import { UiGateway } from './ui.gateway.js';

@Module({
  imports: [AuthModule, InvitationsModule],
  providers: [UiGateway],
  exports: [UiGateway],
})
export class UiGatewayModule {}
