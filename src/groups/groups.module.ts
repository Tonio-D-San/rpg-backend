import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { GroupMapper } from './mapper/group.mapper.js';
import { PrismaGroupRepository } from './repository/prisma-group.repository.js';
import { GroupRepository } from './repository/group.repository.js';
import { GroupService } from './service/group.service.js';

@Module({
  imports: [
    DatabaseModule,
  ],
  providers: [
    GroupMapper,
    {
      provide: GroupRepository,
      useClass: PrismaGroupRepository,
    },

    GroupService,
  ],
  exports: [
    GroupService,
  ],
})
export class GroupsModule {}
