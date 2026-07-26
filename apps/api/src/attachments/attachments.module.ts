import { Module } from '@nestjs/common';
import { AgentGatewayModule } from '../agent-gateway/agent-gateway.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { SessionAccessGuard } from '../auth/session-access.guard.js';
import { InvitationsModule } from '../invitations/invitations.module.js';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { createAttachmentStorage } from './attachment-storage.factory.js';
import { ATTACHMENT_STORAGE } from './attachment-storage.port.js';
import { AttachmentsController } from './attachments.controller.js';
import { SessionAttachmentsService } from './session-attachments.service.js';

@Module({
  imports: [AgentGatewayModule, AuthModule, InvitationsModule, PersistenceModule],
  controllers: [AttachmentsController],
  providers: [
    SessionAccessGuard,
    SessionAttachmentsService,
    {
      provide: ATTACHMENT_STORAGE,
      useFactory: createAttachmentStorage,
    },
  ],
  exports: [SessionAttachmentsService],
})
export class AttachmentsModule {}
