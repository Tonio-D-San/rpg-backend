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

describe('GET /api/v1/users', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let prisma: PrismaService;
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
  beforeAll(async () => {
    moduleRef = await Test
      .createTestingModule({imports: [AppModule]})
      .overrideProvider(JwtVerifierService)
      .useValue(jwtVerifierMock,)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = moduleRef.get(PrismaService);
  });
  beforeEach(() => {jwtVerifierMock.verify.mockReset()});
  afterAll(async () => {await app.close()});

  it(
    'should return 401 without bearer token',
    async () => {
      await request(app.getHttpServer()).get('/api/v1/users').expect(401);
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
        .get('/api/v1/users')
        .set('Authorization', 'Bearer valid-user-token')
        .expect(403);
      expect(jwtVerifierMock.verify).toHaveBeenCalledWith('valid-user-token');
    },
  );

  it(
    'should return users for a platform admin',
    async () => {
      const firstUserSub = randomUUID();
      const secondUserSub = randomUUID();
      const firstEmail = `user-${randomUUID()}@waystone.test`;
      const secondEmail = `user-${randomUUID()}@waystone.test`;
      try {
        await prisma.user.create({
          data: {
            keycloakSub: firstUserSub,
            email: firstEmail,
            displayName: 'First E2E User',
            enabled: true,
          },
        });
        await prisma.user.create({
          data: {
            keycloakSub: secondUserSub,
            email: secondEmail,
            displayName: 'Second E2E User',
            enabled: true,
          },
        });
        jwtVerifierMock.verify.mockResolvedValue(
          new AuthenticatedUserModel(
            randomUUID(),
            'admin@waystone.test',
            [platformAdminsGroup.path],
          ),
        );
        const response = await request(app.getHttpServer(),)
          .get('/api/v1/users')
          .set('Authorization', 'Bearer valid-admin-token')
          .expect(200);
        expect(jwtVerifierMock.verify).toHaveBeenCalledWith('valid-admin-token');
        expect(response.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              keycloakSub: firstUserSub,
              email: firstEmail,
              displayName: 'First E2E User',
              enabled: true,
            }),
            expect.objectContaining({
              keycloakSub: secondUserSub,
              email: secondEmail,
              displayName: 'Second E2E User',
              enabled: true,
            }),
          ]),
        );
      } finally {
        await prisma.user.deleteMany({
          where: {
            keycloakSub: {
              in: [
                firstUserSub,
                secondUserSub,
              ],
            },
          },
        });
      }
    },
  );
});
