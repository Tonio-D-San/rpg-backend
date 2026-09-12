export class CreateKeycloakUserModel {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}
