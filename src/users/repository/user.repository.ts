import { CreateUserModel } from '../model/create-user.model.js';
import { UserDisabledReason } from '../model/user-disabled-reason.enum.js';
import { UserModel } from '../model/user.model.js';
import {PaginatedResultModel} from "../../common/model/paginated-result.model.js";

export abstract class UserRepository {
  abstract create(user: CreateUserModel, groupId: string): Promise<UserModel>;
  abstract findAll(offset: number, limit: number): Promise<PaginatedResultModel<UserModel>>;
  abstract findByKeycloakSub(keycloakSub: string): Promise<UserModel | null>;
  abstract findByEmail(email: string): Promise<UserModel | null>;
  abstract existsByKeycloakSub(keycloakSub: string): Promise<boolean>;
  abstract existsByEmail(email: string): Promise<boolean>;
  abstract disable(keycloakSub: string, reason: UserDisabledReason): Promise<UserModel>;
  abstract updateLastLogin(keycloakSub: string, loginAt: Date): Promise<UserModel>;
}
