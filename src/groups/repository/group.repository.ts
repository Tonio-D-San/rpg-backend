import { CreateGroupModel } from '../model/create-group.model.js';
import { GroupModel } from '../model/group.model.js';

export abstract class GroupRepository {
  abstract create(group: CreateGroupModel): Promise<GroupModel>;
  abstract update(keycloakGroupId: string, group: CreateGroupModel): Promise<GroupModel>;
  abstract upsert(group: CreateGroupModel): Promise<GroupModel>;
  abstract findByKeycloakGroupId(keycloakGroupId: string): Promise<GroupModel | null>;
  abstract findByCode(code: string): Promise<GroupModel | null>;
  abstract findByPath(path: string): Promise<GroupModel | null>;
  abstract findAll(): Promise<GroupModel[]>;
  abstract existsByKeycloakGroupId(keycloakGroupId: string): Promise<boolean>;
  abstract existsByCode(code: string): Promise<boolean>;
}
