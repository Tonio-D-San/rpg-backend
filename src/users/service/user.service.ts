import {ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import { CreateUserModel } from '../model/create-user.model.js';
import { UserDisabledReason } from '../model/user-disabled-reason.enum.js';
import { UserModel } from '../model/user.model.js';
import { UserRepository } from '../repository/user.repository.js';

@Injectable()
export class UserService {
  constructor(
    private readonly repository: UserRepository,
  ) {}

  async createUser(input: CreateUserModel, groupId: string): Promise<UserModel> {
    if (await this.repository.existsByKeycloakSub(input.keycloakSub)) {
      throw new ConflictException(`User with Keycloak subject '${input.keycloakSub}' already exists`);
    }
    if (await this.repository.existsByEmail(input.email)) {
      throw new ConflictException(`User with email '${input.email}' already exists`);
    }
    return this.repository.create(input, groupId);
  }

  async findAll(): Promise<UserModel[]> {
    return this.repository.findAll();
  }

  async findByKeycloakSub(keycloakSub: string): Promise<UserModel | null> {
    return this.repository.findByKeycloakSub(keycloakSub);
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    return this.repository.findByEmail(email);
  }

  async getByKeycloakSub(keycloakSub: string): Promise<UserModel> {
    const user = await this.findByKeycloakSub(keycloakSub);
    if (!user) {
      throw new NotFoundException(`User '${keycloakSub}' not found`);
    }
    return user;
  }

  async disableUser(keycloakSub: string, reason: UserDisabledReason): Promise<UserModel> {
    return this.repository.disable(keycloakSub, reason);
  }

  async registerLogin(keycloakSub: string): Promise<UserModel> {
    return this.repository.updateLastLogin(keycloakSub, new Date());
  }
}
