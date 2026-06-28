import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { PersistenceModule } from './persistence/persistence.module.js';
import { SourceControlModule } from './source-control/source-control.module.js';

@Module({
  imports: [PersistenceModule, SourceControlModule],
  controllers: [HealthController],
})
export class AppModule {}
