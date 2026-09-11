import { Injectable } from '@nestjs/common';
import { KeycloakAdminClient } from '../client/keycloak-admin.client.js';
import { KeycloakGroupModel } from '../model/keycloak-group.model.js';
import {ExternalDataException} from "../../common/exception/external-data.exception.js";

@Injectable()
export class KeycloakComponent {
  constructor(
    private readonly client: KeycloakAdminClient,
  ) {}

  async getGroups(): Promise<KeycloakGroupModel[]> {
    const groups = await this.client.getGroups();
    return groups.map((group) => {
      if (!group.id || !group.name || !group.path) {
        throw new ExternalDataException('Invalid group representation returned by Keycloak');
      }
      return new KeycloakGroupModel(
        group.id,
        group.name,
        group.path,
      );
    });
  }
}
