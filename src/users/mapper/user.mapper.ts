import { Injectable } from '@nestjs/common';
import {
  User as PrismaUser,
  UserDisabledReason as PrismaUserDisabledReason,
} from '../../generated/prisma/client.js';
import { UserDisabledReason } from '../model/user-disabled-reason.enum.js';
import { UserModel } from '../model/user.model.js';

@Injectable()
export class UserMapper {
  toModel(user: PrismaUser): UserModel {
    return new UserModel(
      user.keycloakSub,
      user.email,
      user.displayName,
      user.enabled,
      user.lastLoginAt,
      user.disabledAt,
      this.toDisabledReason(user.disabledReason),
      user.createdAt,
      user.updatedAt,
    );
  }

  private toDisabledReason(reason: PrismaUserDisabledReason | null): UserDisabledReason | null {
    if (reason === null) {return null;}
    return UserDisabledReason[reason];
  }

  toPrismaDisabledReason(
    reason: UserDisabledReason,
  ): PrismaUserDisabledReason {
    return reason as PrismaUserDisabledReason;
  }
}
