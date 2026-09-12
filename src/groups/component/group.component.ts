import { Injectable } from '@nestjs/common';
import { ExternalDataException } from '../../common/exception/external-data.exception.js';
import { KeycloakComponent } from '../../keycloak/component/keycloak.component.js';
import { PLATFORM_GROUPS } from '../config/platform-groups.config.js';
import { CreateGroupModel } from '../model/create-group.model.js';
import { GroupCode } from '../model/group-code.js';
import { GroupModel } from '../model/group.model.js';
import { GroupService } from '../service/group.service.js';
import {KeycloakGroupModel} from "../../keycloak/model/keycloak-group.model.js";

@Injectable()
export class GroupComponent {
  constructor(
    private readonly keycloakComponent: KeycloakComponent,
    private readonly groupService: GroupService,
  ) {}

  async syncGroups(): Promise<GroupModel[]> {
    const keycloakGroups = await this.keycloakComponent.getGroups();
    this.validateRequiredGroups(keycloakGroups);
    const synchronizedGroups: GroupModel[] = [];
    for (const keycloakGroup of keycloakGroups) {
      synchronizedGroups.push(await this.groupService.upsertGroup(
        new CreateGroupModel(
          keycloakGroup.id,
          keycloakGroup.name,
          keycloakGroup.path,
          this.resolveGroupCode(keycloakGroup.path)
        )
      ));
    }
    return synchronizedGroups;
  }

  private resolveGroupCode(path: string): GroupCode | null {
    return  PLATFORM_GROUPS.find((group) => group.path === path)?.code ?? null;
  }

  private validateRequiredGroups(keycloakGroups: KeycloakGroupModel[]): void {
    for (const definition of PLATFORM_GROUPS) {
      if (!keycloakGroups.some((group) => group.path === definition.path)) {
        throw new ExternalDataException(`Required Keycloak group '${definition.path}' not found`);
      }
    }
  }
}
