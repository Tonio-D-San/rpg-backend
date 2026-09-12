export class GroupModel {
  constructor(
    public readonly keycloakGroupId: string,
    public readonly code: string | null,
    public readonly name: string,
    public readonly path: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
