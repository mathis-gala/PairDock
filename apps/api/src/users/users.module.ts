import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [PersistenceModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
