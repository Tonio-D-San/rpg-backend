export class CreateUserModel {
  constructor(
    public readonly keycloakSub: string,
    public readonly email: string,
    public readonly displayName: string,
  ) {}
}
