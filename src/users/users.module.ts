import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { UserMapper } from './mapper/user.mapper.js';
import { PrismaUserRepository } from './repository/prisma-user.repository.js';
import { UserRepository } from './repository/user.repository.js';
import { UserService } from './service/user.service.js';
import {KeycloakModule} from "../keycloak/keycloak.module.js";
import {GroupsModule} from "../groups/groups.module.js";
import {UserComponent} from "./component/user.component.js";

@Module({
  imports: [
    DatabaseModule,
    GroupsModule,
    KeycloakModule,
  ],
  providers: [
    UserMapper,
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
    UserService,
    UserComponent
  ],
  exports: [
    UserService,
    UserComponent
  ],
})
export class UsersModule {}
