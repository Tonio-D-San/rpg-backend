export class CreateGroupModel {
  constructor(
    public readonly keycloakGroupId: string,
    public readonly name: string,
    public readonly path: string,
    public readonly code: string | null = null
    ) {}
}
