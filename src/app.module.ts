import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {AppController} from './app.controller.js';
import {AppService} from './app.service.js';
import {UsersModule} from "./users/users.module.js";
import {GroupsModule} from "./groups/groups.module.js";
import {getEnvironmentFile} from "./config/environment.js";

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true, expandVariables: true, envFilePath: getEnvironmentFile()}),
    UsersModule,
    GroupsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}
