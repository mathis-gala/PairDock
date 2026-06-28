import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { InvitationsService } from './invitations.service.js';

@Module({
  imports: [PersistenceModule],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
