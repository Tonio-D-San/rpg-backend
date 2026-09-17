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
