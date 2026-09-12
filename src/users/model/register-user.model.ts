export class RegisterUserModel {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly displayName: string,
  ) {}
}
