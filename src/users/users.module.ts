import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { UserMapper } from './mapper/user.mapper.js';
import { PrismaUserRepository } from './repository/prisma-user.repository.js';
import { UserRepository } from './repository/user.repository.js';
import { UserService } from './service/user.service.js';

@Module({
  imports: [
    DatabaseModule,
  ],
  providers: [
    UserMapper,
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
    UserService,
  ],
  exports: [
    UserService,
  ],
})
export class UsersModule {}
