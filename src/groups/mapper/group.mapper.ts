import { Injectable } from '@nestjs/common';
import { Group as PrismaGroup } from '../../generated/prisma/client.js';
import { GroupModel } from '../model/group.model.js';

@Injectable()
export class GroupMapper {
  toModel(group: PrismaGroup): GroupModel {
    return new GroupModel(
      group.keycloakGroupId,
      group.code,
      group.name,
      group.path,
      group.createdAt,
      group.updatedAt,
    );
  }
}
