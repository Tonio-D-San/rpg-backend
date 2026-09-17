import {ConfigModule} from '@nestjs/config';
import {Test} from '@nestjs/testing';
import {describe, expect, it} from 'vitest';
import {GroupComponent} from '../src/groups/component/group.component.js';
import {GroupCode} from '../src/groups/model/group-code.js';
import {GroupsModule} from '../src/groups/groups.module.js';
import {GroupService} from '../src/groups/service/group.service.js';

describe('Group synchronization', () => {
  it('should synchronize platform groups from Keycloak', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        await ConfigModule.forRoot({isGlobal: true, expandVariables: true, cache: true}),
        GroupsModule,
      ],
    }).compile();
    try {
      const component = moduleRef.get(GroupComponent);
      const groupService = moduleRef.get(GroupService);
      await component.syncGroups();
      await component.syncGroups();
      await component.syncGroups();
      const usersGroup = await groupService.getByCode(GroupCode.PLATFORM_USERS);
      const adminsGroup = await groupService.getByCode(GroupCode.PLATFORM_ADMINS);
      expect(usersGroup).toEqual(
        expect.objectContaining({
          code: GroupCode.PLATFORM_USERS,
          name: 'platform-users',
          path: '/platform-users',
        }),
      );
      expect(adminsGroup).toEqual(
        expect.objectContaining({
          code: GroupCode.PLATFORM_ADMINS,
          name: 'platform-admins',
          path: '/platform-admins',
        }),
      );
      expect(usersGroup.keycloakGroupId).toBeTruthy();
      expect(adminsGroup.keycloakGroupId).toBeTruthy();
    } finally {
      await moduleRef.close();
    }
  });
});
