import {Injectable} from '@nestjs/common';
import {PrismaService} from '../../database/prisma.service.js';
import {UserMapper} from '../mapper/user.mapper.js';
import {CreateUserModel} from '../model/create-user.model.js';
import {UserDisabledReason} from '../model/user-disabled-reason.enum.js';
import {UserModel} from '../model/user.model.js';
import {UserRepository} from './user.repository.js';
import {PaginatedResultModel} from "../../common/model/paginated-result.model.js";

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: UserMapper,
  ) {
    super();
  }

  async create(user: CreateUserModel, groupId: string): Promise<UserModel> {
    return this.prisma.$transaction(
      async (transaction) => {
        const created = await transaction.user.create({
          data: {
            keycloakSub: user.keycloakSub,
            email: user.email,
            displayName: user.displayName,
          },
        });
        await transaction.userGroup.create({
          data: {
            userSub: created.keycloakSub,
            groupId,
          },
        });
        return this.mapper.toModel(created);
      },
    );
  }

  async findAll(offset: number, limit: number): Promise<PaginatedResultModel<UserModel>> {
    const [users, totalItems] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip: offset,
        take: limit,
        orderBy: [
          {createdAt: 'desc'},
          {keycloakSub: 'asc'},
        ],
      }),
      this.prisma.user.count(),
    ]);
    return new PaginatedResultModel(
      users.map((user) => this.mapper.toModel(user)),
      totalItems,
    );
  }

  async findByKeycloakSub(keycloakSub: string): Promise<UserModel | null> {
    const user = await this.prisma.user.findUnique({
      where: {keycloakSub},
    });
    return user ? this.mapper.toModel(user) : null;
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    const user = await this.prisma.user.findUnique({
      where: {email},
    });
    return user ? this.mapper.toModel(user) : null;
  }

  async existsByKeycloakSub(keycloakSub: string): Promise<boolean> {
    return await this.prisma.user.count({where: {keycloakSub}}) > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    return await this.prisma.user.count({where: {email}}) > 0;
  }

  async disable(keycloakSub: string, reason: UserDisabledReason): Promise<UserModel> {
    return this.mapper.toModel(await this.prisma.user.update({
      where: {keycloakSub},
      data: {
        enabled: false,
        disabledAt: new Date(),
        disabledReason: this.mapper.toPrismaDisabledReason(reason)
      },
    }));
  }

  async updateLastLogin(keycloakSub: string, loginAt: Date): Promise<UserModel> {
    return this.mapper.toModel(await this.prisma.user.update({
      where: {keycloakSub},
      data: {lastLoginAt: loginAt}
    }));
  }
}
