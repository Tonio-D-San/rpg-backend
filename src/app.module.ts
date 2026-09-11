import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {AppController} from './app.controller.js';
import {AppService} from './app.service.js';
import {UsersModule} from "./users/users.module.js";
import {GroupsModule} from "./groups/groups.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
    UsersModule,
    GroupsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}
