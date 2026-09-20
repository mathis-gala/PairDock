import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { SessionEventsService } from './session-events.service.js';

@Module({
  imports: [PersistenceModule],
  providers: [SessionEventsService],
  exports: [SessionEventsService],
})
export class SessionEventsModule {}
