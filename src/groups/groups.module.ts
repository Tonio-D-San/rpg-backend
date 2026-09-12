import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { KeycloakModule } from '../keycloak/keycloak.module.js';
import { GroupComponent } from './component/group.component.js';
import { GroupMapper } from './mapper/group.mapper.js';
import { PrismaGroupRepository } from './repository/prisma-group.repository.js';
import { GroupRepository } from './repository/group.repository.js';
import { GroupService } from './service/group.service.js';

@Module({
  imports: [
    DatabaseModule,
    KeycloakModule,
  ],
  providers: [
    GroupMapper,
    {
      provide: GroupRepository,
      useClass: PrismaGroupRepository,
    },
    GroupService,
    GroupComponent,
  ],
  exports: [
    GroupService,
    GroupComponent,
  ],
})
export class GroupsModule {}
