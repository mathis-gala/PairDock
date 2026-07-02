import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { ValidationPolicy } from './validation.policy.js';
import { ValidationService } from './validation.service.js';

@Module({
  imports: [PersistenceModule],
  providers: [ValidationPolicy, ValidationService],
  exports: [ValidationPolicy, ValidationService],
})
export class ValidationModule {}
