import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {AppController} from './app.controller.js';
import {AppService} from './app.service.js';
import {UsersModule} from "./users/users.module.js";
import {GroupsModule} from "./groups/groups.module.js";
import {KeycloakModule} from "./keycloak/keycloak.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true, expandVariables: true}),
    UsersModule,
    GroupsModule,
    KeycloakModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}
