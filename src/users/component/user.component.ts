import {ConflictException, Injectable, Logger} from '@nestjs/common';
import {GroupCode} from '../../groups/model/group-code.js';
import {GroupService} from '../../groups/service/group.service.js';
import {KeycloakComponent} from '../../keycloak/component/keycloak.component.js';
import {CreateKeycloakUserModel} from '../../keycloak/model/create-keycloak-user.model.js';
import {CreateUserModel} from '../model/create-user.model.js';
import {RegisterUserModel} from '../model/register-user.model.js';
import {UserModel} from '../model/user.model.js';
import {UserService} from '../service/user.service.js';
import {KeycloakCallException} from "../../common/exception/keycloak-call.exception.js";
import {KeycloakUserModel} from "../../keycloak/model/keycloak-user.model.js";
import {PaginatedResultModel} from "../../common/model/paginated-result.model.js";
import { UserDisabledReason } from '../model/user-disabled-reason.enum.js';

@Injectable()
export class UserComponent {
  private readonly logger = new Logger(UserComponent.name);
  constructor(
    private readonly userService: UserService,
    private readonly groupService: GroupService,
    private readonly keycloakComponent: KeycloakComponent,
  ) {
  }

  async registerUser(input: RegisterUserModel): Promise<UserModel> {
    const platformUsersGroup = await this.groupService.getByCode(GroupCode.PLATFORM_USERS);
    const keycloakUser = await this.createKeycloakUser(input);
    try {
      await this.keycloakComponent.addUserToGroup(keycloakUser.id, platformUsersGroup.keycloakGroupId);
      return await this.userService.createUser(
        new CreateUserModel(keycloakUser.id, input.email, input.displayName),
        platformUsersGroup.keycloakGroupId
      );
    } catch (error) {
      await this.compensateKeycloakUserCreation(keycloakUser.id);
      throw error;
    }
  }

  async getCurrentUser(keycloakSub: string): Promise<UserModel> {
    return this.userService.getByKeycloakSub(keycloakSub);
  }

  async findAll(page: number, size: number): Promise<PaginatedResultModel<UserModel>> {
    return this.userService.findAll(page, size);
  }

  async disableUser(keycloakSub: string): Promise<UserModel> {
    const user = await this.userService.getByKeycloakSub(keycloakSub);
    await this.keycloakComponent.disableUser(user.keycloakSub);
    try {
      return await this.userService.disableUser(user.keycloakSub, UserDisabledReason.ADMIN);
    } catch (error) {
      await this.compensateKeycloakUserDisable(user.keycloakSub);
      throw error;
    }
  }

  private async compensateKeycloakUserCreation(keycloakUserId: string): Promise<void> {
    try {
      await this.keycloakComponent.deleteUser(keycloakUserId);
    } catch (error) {
      this.logger.error(
        `Unable to compensate Keycloak user creation for '${keycloakUserId}'`,
        error instanceof Error
          ? error.stack
          : undefined,
      );
    }
  }

  private async compensateKeycloakUserDisable(keycloakUserId: string): Promise<void> {
    try {
      await this.keycloakComponent.enableUser(keycloakUserId);
    } catch (error) {
      this.logger.error(
        `Unable to compensate Keycloak user disable for '${keycloakUserId}'`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async createKeycloakUser(input: RegisterUserModel): Promise<KeycloakUserModel> {
    try {
      return await this.keycloakComponent.createUser(
        new CreateKeycloakUserModel(input.email, input.password,),
      );
    } catch (error) {
      if (error instanceof KeycloakCallException && error.status === 409) {
        throw new ConflictException(`User with email '${input.email}' already exists`);
      }
      throw error;
    }
  }
}
