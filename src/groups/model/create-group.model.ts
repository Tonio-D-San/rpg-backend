export class CreateGroupModel {
  constructor(
    public readonly keycloakGroupId: string,
    public readonly code: string,
    public readonly name: string,
    public readonly path: string,
  ) {}
}
