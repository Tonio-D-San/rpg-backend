import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { GroupMapper } from '../mapper/group.mapper.js';
import { CreateGroupModel } from '../model/create-group.model.js';
import { GroupModel } from '../model/group.model.js';
import { GroupRepository } from './group.repository.js';

@Injectable()
export class PrismaGroupRepository extends GroupRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: GroupMapper,
  ) {
    super();
  }

  async create(group: CreateGroupModel): Promise<GroupModel> {
    return this.mapper.toModel(await this.prisma.group.create({
      data: {
        keycloakGroupId: group.keycloakGroupId,
        code: group.code,
        name: group.name,
        path: group.path,
      },
    }));
  }

  async update(keycloakGroupId: string, group: CreateGroupModel): Promise<GroupModel> {
    return this.mapper.toModel(await this.prisma.group.update({
      where: {keycloakGroupId},
      data: {
        code: group.code,
        name: group.name,
        path: group.path,
      },
    }));
  }

  async upsert(group: CreateGroupModel): Promise<GroupModel> {
    return this.mapper.toModel(await this.prisma.group.upsert({
      where: {keycloakGroupId: group.keycloakGroupId},
      create: {
        keycloakGroupId: group.keycloakGroupId,
        code: group.code,
        name: group.name,
        path: group.path,
      },
      update: {
        code: group.code,
        name: group.name,
        path: group.path,
      },
    }));
  }

  async findByKeycloakGroupId(keycloakGroupId: string): Promise<GroupModel | null> {
    const group = await this.prisma.group.findUnique({where: {keycloakGroupId}});
    return group ? this.mapper.toModel(group) : null;
  }

  async findByCode(code: string): Promise<GroupModel | null> {
    const group = await this.prisma.group.findUnique({where: {code}});
    return group ? this.mapper.toModel(group) : null;
  }

  async findByPath(path: string): Promise<GroupModel | null> {
    const group = await this.prisma.group.findUnique({where: {path}});
    return group ? this.mapper.toModel(group) : null;
  }

  async findAll(): Promise<GroupModel[]> {
    const groups = await this.prisma.group.findMany({orderBy: {code: 'asc'}});
    return groups.map((group) => this.mapper.toModel(group));
  }

  async existsByKeycloakGroupId(keycloakGroupId: string): Promise<boolean> {
    return await this.prisma.group.count({where: {keycloakGroupId}}) > 0;
  }

  async existsByCode(code: string): Promise<boolean> {
    return await this.prisma.group.count({where: {code}}) > 0;
  }
}
