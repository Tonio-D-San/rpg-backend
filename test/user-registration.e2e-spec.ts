import {randomUUID} from 'node:crypto';
import {ConfigModule,} from '@nestjs/config';
import {Test} from '@nestjs/testing';
import {describe, expect, it,} from 'vitest';
import {DatabaseModule} from '../src/database/database.module.js';
import {PrismaService} from '../src/database/prisma.service.js';
import {GroupComponent} from '../src/groups/component/group.component.js';
import {GroupCode} from '../src/groups/model/group-code.js';
import {GroupService} from '../src/groups/service/group.service.js';
import {GroupsModule} from '../src/groups/groups.module.js';
import {KeycloakComponent} from '../src/keycloak/component/keycloak.component.js';
import {KeycloakModule} from '../src/keycloak/keycloak.module.js';
import {UserComponent} from '../src/users/component/user.component.js';
import {RegisterUserModel} from '../src/users/model/register-user.model.js';
import {UsersModule} from '../src/users/users.module.js';

describe('User registration', () => {
  it('should create a user in Keycloak and PostgreSQL', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        await ConfigModule.forRoot({isGlobal: true, ignoreEnvFile: true}),
        DatabaseModule,
        GroupsModule,
        KeycloakModule,
        UsersModule,
      ],
    }).compile();
    const prisma = moduleRef.get(PrismaService);
    const groupService = moduleRef.get(GroupService);
    const keycloakComponent = moduleRef.get(KeycloakComponent);
    const userComponent = moduleRef.get(UserComponent);
    let createdUserId: string | null = null;
    const uniqueId = randomUUID();
    const email = `e2e-${uniqueId}@waystone.test`;
    const displayName = `E2E ${uniqueId.substring(0, 8)}`;
    const password = `Waystone-E2E-${uniqueId}!`;
    try {
      await moduleRef.get(GroupComponent).syncGroups();
      const platformUsersGroup = await groupService.getByCode(GroupCode.PLATFORM_USERS);
      const user = await userComponent.registerUser(new RegisterUserModel(email, password, displayName));
      createdUserId = user.keycloakSub;
      expect(user).toEqual(
        expect.objectContaining({
          keycloakSub: expect.any(String),
          email,
          displayName,
          enabled: true,
        }),
      );
      const persistedUser = await prisma.user.findUnique({
        where: {keycloakSub: user.keycloakSub},
        include: {groups: true},
      });
      expect(persistedUser).not.toBeNull();
      expect(persistedUser).toEqual(
        expect.objectContaining({
          keycloakSub: user.keycloakSub,
          email,
          displayName,
          enabled: true,
        }),
      );
      expect(persistedUser?.groups).toHaveLength(1);
      expect(persistedUser?.groups[0]?.groupId).toBe(platformUsersGroup.keycloakGroupId);
      const keycloakGroups = await keycloakComponent.getUserGroups(user.keycloakSub);
      expect(keycloakGroups).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: platformUsersGroup.keycloakGroupId,
            name: 'platform-users',
            path: '/platform-users',
          }),
        ]),
      );
      expect(keycloakGroups).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({path: '/platform-admins'})
        ]),
      );
    } finally {
      if (createdUserId !== null) {
        await prisma.user.deleteMany({where: {keycloakSub: createdUserId}});
        await keycloakComponent.deleteUser(createdUserId);
      }
      await moduleRef.close();
    }
  });
});
