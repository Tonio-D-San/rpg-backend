import { Injectable } from '@nestjs/common';
import { KeycloakAdminClient } from '../client/keycloak-admin.client.js';
import { KeycloakGroupModel } from '../model/keycloak-group.model.js';
import {ExternalDataException} from "../../common/exception/external-data.exception.js";
import {CreateKeycloakUserModel} from "../model/create-keycloak-user.model.js";
import {KeycloakUserModel} from "../model/keycloak-user.model.js";
import {KeycloakGroupRepresentationModel} from "../model/keycloak-group-representation.model.js";

@Injectable()
export class KeycloakComponent {
  constructor(
    private readonly client: KeycloakAdminClient,
  ) {}

  async createUser(input: CreateKeycloakUserModel): Promise<KeycloakUserModel> {
    return new KeycloakUserModel(await this.client.createUser(input), input.email);
  }

  async addUserToGroup(userId: string, groupId: string): Promise<void> {
    await this.client.addUserToGroup(userId, groupId);
  }

  async deleteUser(userId: string): Promise<void> {
    await this.client.deleteUser(userId);
  }

  async getGroups(): Promise<KeycloakGroupModel[]> {
    return this.toGroupModels(await this.client.getGroups());
  }

  async getUserGroups(userId: string): Promise<KeycloakGroupModel[]> {
    return this.toGroupModels(await this.client.getUserGroups(userId));
  }

  private toGroupModels(groups: KeycloakGroupRepresentationModel[]): KeycloakGroupModel[] {
    return groups.map((group) => {
      if (!group.id || !group.name || !group.path) {
        throw new ExternalDataException('Invalid group representation returned by Keycloak');
      }
      return new KeycloakGroupModel(group.id, group.name, group.path);
    });
  }
}
