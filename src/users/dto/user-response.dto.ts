import { UserModel } from '../model/user.model.js';

export class UserResponseDto {
  constructor(
    public readonly keycloakSub: string,
    public readonly email: string,
    public readonly displayName: string,
    public readonly enabled: boolean,
    public readonly createdAt: Date,
  ) {}

  static fromModel(user: UserModel): UserResponseDto {
    return new UserResponseDto(
      user.keycloakSub,
      user.email,
      user.displayName,
      user.enabled,
      user.createdAt,
    );
  }
}
