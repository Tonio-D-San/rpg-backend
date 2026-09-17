import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserComponent } from '../component/user.component.js';
import { RegisterUserDto } from '../dto/register-user.dto.js';
import { UserResponseDto } from '../dto/user-response.dto.js';
import { RegisterUserModel } from '../model/register-user.model.js';
import {CurrentUser} from "../../auth/decorator/current-user.decorator.js";
import {JwtAuthGuard} from "../../auth/guard/jwt-auth.guard.js";
import {AuthenticatedUserModel} from "../../auth/model/authenticated-user.model.js";
import {PlatformGroupGuard} from "../../auth/guard/platform-group.guard.js";
import {RequireGroup} from "../../auth/decorator/require-group.decorator.js";
import {GroupCode} from "../../groups/model/group-code.js";

@Controller('api/v1/users')
export class UserController {
  constructor(
    private readonly userComponent: UserComponent,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterUserDto): Promise<UserResponseDto> {
    return UserResponseDto.fromModel(
      await this.userComponent.registerUser(new RegisterUserModel(dto.email, dto.password, dto.displayName))
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, PlatformGroupGuard)
  @RequireGroup(GroupCode.PLATFORM_ADMINS)
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userComponent.findAll();
    return users.map((user) => UserResponseDto.fromModel(user));
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, PlatformGroupGuard)
  @RequireGroup(GroupCode.PLATFORM_USERS)
  async me(@CurrentUser() authenticatedUser: AuthenticatedUserModel): Promise<UserResponseDto> {
    return UserResponseDto.fromModel(await this.userComponent.getCurrentUser(authenticatedUser.subject));
  }
}
