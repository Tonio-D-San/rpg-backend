export class AuthenticatedUserModel {
  constructor(
    public readonly subject: string,
    public readonly email: string | null,
    public readonly groups: string[],
  ) {}
}
