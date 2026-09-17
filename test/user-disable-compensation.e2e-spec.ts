import {Test, TestingModule,} from '@nestjs/testing';
import {randomUUID} from 'node:crypto';
import {afterAll, beforeAll, describe, expect, it, vi,} from 'vitest';
import {AppModule} from '../src/app.module.js';
import {PrismaService} from '../src/database/prisma.service.js';
import {KeycloakComponent} from '../src/keycloak/component/keycloak.component.js';
import {UserComponent} from '../src/users/component/user.component.js';
import {UserService} from '../src/users/service/user.service.js';

describe('User disable compensation', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let userComponent: UserComponent;
  let userService: UserService;
  let keycloakComponent: KeycloakComponent;
  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({imports: [AppModule]}).compile();
    await moduleRef.init();
    prisma = moduleRef.get(PrismaService);
    userComponent = moduleRef.get(UserComponent);
    userService = moduleRef.get(UserService);
    keycloakComponent = moduleRef.get(KeycloakComponent);
  });
  afterAll(async () => {
    await moduleRef.close()
  });
  it(
    'should re-enable the Keycloak user when database disable fails',
    async () => {
      const keycloakSub = randomUUID();
      const email = `user-${randomUUID()}@waystone.test`;
      await prisma.user.create({
        data: {
          keycloakSub,
          email,
          displayName: 'Compensation E2E User',
          enabled: true,
        },
      });
      const disableKeycloakSpy = vi.spyOn(keycloakComponent, 'disableUser').mockResolvedValue(undefined);
      const enableKeycloakSpy = vi.spyOn(keycloakComponent, 'enableUser').mockResolvedValue(undefined);
      const disableDatabaseSpy = vi.spyOn(userService, 'disableUser').mockRejectedValue(
        new Error('Simulated database failure'),);
      try {
        await expect(userComponent.disableUser(keycloakSub),).rejects.toThrow('Simulated database failure');
        expect(disableKeycloakSpy).toHaveBeenCalledOnce();
        expect(disableKeycloakSpy).toHaveBeenCalledWith(keycloakSub);
        expect(disableDatabaseSpy).toHaveBeenCalledOnce();
        expect(enableKeycloakSpy).toHaveBeenCalledOnce();
        expect(enableKeycloakSpy).toHaveBeenCalledWith(keycloakSub);
        expect(disableKeycloakSpy.mock.invocationCallOrder[0]).toBeLessThan(enableKeycloakSpy.mock.invocationCallOrder[0]);
        const user = await prisma.user.findUnique({where: {keycloakSub}});
        expect(user).not.toBeNull();
        expect(user?.enabled).toBe(true);
        expect(user?.disabledAt).toBeNull();
        expect(user?.disabledReason).toBeNull();
      } finally {
        disableKeycloakSpy.mockRestore();
        enableKeycloakSpy.mockRestore();
        disableDatabaseSpy.mockRestore();
        await prisma.user.deleteMany({where: {keycloakSub}});
      }
    },
  );
});
