import {Injectable, NotFoundException} from '@nestjs/common';
import { CreateGroupModel } from '../model/create-group.model.js';
import { GroupModel } from '../model/group.model.js';
import { GroupRepository } from '../repository/group.repository.js';

@Injectable()
export class GroupService {
  constructor(
    private readonly repository: GroupRepository,
  ) {}

  async createGroup(input: CreateGroupModel): Promise<GroupModel> {
    return this.repository.create(input);
  }

  async upsertGroup(input: CreateGroupModel): Promise<GroupModel> {
    return this.repository.upsert(input);
  }

  async findByKeycloakGroupId(keycloakGroupId: string): Promise<GroupModel | null> {
    return this.repository.findByKeycloakGroupId(keycloakGroupId);
  }

  async findByCode(code: string): Promise<GroupModel | null> {
    return this.repository.findByCode(code);
  }

  async getByCode(code: string): Promise<GroupModel> {
    const group = await this.repository.findByCode(code);
    if (!group) {
      throw new NotFoundException(`Group '${code}' not found`);
    }
    return group;
  }

  async findByPath(path: string): Promise<GroupModel | null> {
    return this.repository.findByPath(path);
  }

  async findAll(): Promise<GroupModel[]> {
    return this.repository.findAll();
  }
}
