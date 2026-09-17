import {INestApplication} from '@nestjs/common';
import {Test, TestingModule,} from '@nestjs/testing';
import {randomUUID} from 'node:crypto';
import request from 'supertest';
import {afterAll, beforeAll, beforeEach, describe, expect, it, vi,} from 'vitest';
import {AppModule} from '../src/app.module.js';
import {AuthenticatedUserModel} from '../src/auth/model/authenticated-user.model.js';
import {JwtVerifierService} from '../src/auth/service/jwt-verifier.service.js';
import {configureApp} from '../src/bootstrap/configure-app.js';
import {PrismaService} from '../src/database/prisma.service.js';
import {PLATFORM_GROUPS} from '../src/groups/config/platform-groups.config.js';
import {GroupCode} from '../src/groups/model/group-code.js';
import {KeycloakComponent} from '../src/keycloak/component/keycloak.component.js';

describe('PATCH /api/v1/users/:keycloakSub/disable', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let keycloakComponent: KeycloakComponent;
  const jwtVerifierMock = {verify: vi.fn()};
  const platformUsersGroup =
    PLATFORM_GROUPS.find(
      (group) =>
        group.code === GroupCode.PLATFORM_USERS,
    );
  const platformAdminsGroup =
    PLATFORM_GROUPS.find(
      (group) =>
        group.code === GroupCode.PLATFORM_ADMINS,
    );
  if (!platformUsersGroup) {
    throw new Error('PLATFORM_USERS group configuration not found');
  }
  if (!platformAdminsGroup) {
    throw new Error('PLATFORM_ADMINS group configuration not found');
  }
  const platformAdminsGroupPath = platformAdminsGroup.path;

  beforeAll(async () => {
    moduleRef = await Test
      .createTestingModule({imports: [AppModule]})
      .overrideProvider(JwtVerifierService)
      .useValue(jwtVerifierMock)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = moduleRef.get(PrismaService);
    keycloakComponent = moduleRef.get(KeycloakComponent);
  });
  beforeEach(() => {
    jwtVerifierMock.verify.mockReset();
    vi.restoreAllMocks();
  });
  afterAll(async () => {
    await app.close();
  });

  function mockAdmin(): void {
    jwtVerifierMock.verify.mockResolvedValue(
      new AuthenticatedUserModel(
        randomUUID(),
        'admin@waystone.test',
        [platformAdminsGroupPath],
      ),
    );
  }

  it(
    'should return 401 without bearer token',
    async () => {
      await request(app.getHttpServer()).patch(`/api/v1/users/${randomUUID()}/disable`).expect(401);
      expect(jwtVerifierMock.verify).not.toHaveBeenCalled();
    },
  );

  it(
    'should return 403 for a non-admin user',
    async () => {
      jwtVerifierMock.verify.mockResolvedValue(
        new AuthenticatedUserModel(
          randomUUID(),
          'user@waystone.test',
          [platformUsersGroup.path],
        ),
      );
      await request(app.getHttpServer())
        .patch(`/api/v1/users/${randomUUID()}/disable`)
        .set('Authorization', 'Bearer valid-user-token')
        .expect(403);
    },
  );

  it(
    'should return 404 when the user does not exist',
    async () => {
      const keycloakSub = randomUUID();
      mockAdmin();
      const disableUserSpy = vi.spyOn(keycloakComponent, 'disableUser');
      await request(app.getHttpServer())
        .patch(`/api/v1/users/${keycloakSub}/disable`)
        .set('Authorization', 'Bearer valid-admin-token')
        .expect(404);
      expect(disableUserSpy).not.toHaveBeenCalled();
    },
  );

  it(
    'should disable the user for a platform admin',
    async () => {
      const keycloakSub = randomUUID();
      const email = `user-${randomUUID()}@waystone.test`;
      await prisma.user.create({
        data: {
          keycloakSub,
          email,
          displayName:
            'Disable E2E User',
          enabled: true,
        },
      });
      mockAdmin();
      const disableUserSpy = vi.spyOn(keycloakComponent, 'disableUser').mockResolvedValue(undefined);

      try {
        const response = await request(app.getHttpServer())
          .patch(`/api/v1/users/${keycloakSub}/disable`)
          .set('Authorization', 'Bearer valid-admin-token')
          .expect(200);
        expect(disableUserSpy).toHaveBeenCalledOnce();
        expect(disableUserSpy).toHaveBeenCalledWith(keycloakSub);
        expect(response.body.keycloakSub).toBe(keycloakSub);
        expect(response.body.enabled).toBe(false);
        const user = await prisma.user.findUnique({where: {keycloakSub}});
        expect(user).not.toBeNull();
        expect(user?.enabled).toBe(false);
        expect(user?.disabledReason).toBe('ADMIN');
        expect(user?.disabledAt).not.toBeNull();
      } finally {
        await prisma.user.deleteMany({where: {keycloakSub}});
      }
    },
  );
});
