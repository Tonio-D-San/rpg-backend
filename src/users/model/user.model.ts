import { UserDisabledReason } from './user-disabled-reason.enum.js';

export class UserModel {
  constructor(
    public readonly keycloakSub: string,
    public readonly email: string,
    public readonly displayName: string,
    public readonly enabled: boolean,
    public readonly lastLoginAt: Date | null,
    public readonly disabledAt: Date | null,
    public readonly disabledReason: UserDisabledReason | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
