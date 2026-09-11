export class GroupModel {
  constructor(
    public readonly keycloakGroupId: string,
    public readonly code: string,
    public readonly name: string,
    public readonly path: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
