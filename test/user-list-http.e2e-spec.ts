import { INestApplication } from '@nestjs/common';
import {
  Test,
  TestingModule,
} from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { AppModule } from '../src/app.module.js';
import { AuthenticatedUserModel } from '../src/auth/model/authenticated-user.model.js';
import { JwtVerifierService } from '../src/auth/service/jwt-verifier.service.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { PLATFORM_GROUPS } from '../src/groups/config/platform-groups.config.js';
import { GroupCode } from '../src/groups/model/group-code.js';

describe('GET /api/v1/users', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let prisma: PrismaService;

  const jwtVerifierMock = {
    verify: vi.fn(),
  };

  const platformUsersGroup =
    PLATFORM_GROUPS.find(
      (group) =>
        group.code ===
        GroupCode.PLATFORM_USERS,
    );

  const platformAdminsGroup =
    PLATFORM_GROUPS.find(
      (group) =>
        group.code ===
        GroupCode.PLATFORM_ADMINS,
    );

  if (!platformUsersGroup) {
    throw new Error(
      'PLATFORM_USERS group configuration not found',
    );
  }

  if (!platformAdminsGroup) {
    throw new Error(
      'PLATFORM_ADMINS group configuration not found',
    );
  }

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
  });
  beforeEach(() => {
    jwtVerifierMock.verify.mockReset();
  });
  afterAll(async () => {
    await app.close();
  });
  function mockAdmin(): void {
    jwtVerifierMock.verify.mockResolvedValue(
      new AuthenticatedUserModel(
        randomUUID(),
        'admin@waystone.test',
        [platformAdminsGroup.path],
      ),
    );
  }

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
    'should return a paginated user response for a platform admin',
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
        mockAdmin();
        const response = await request(app.getHttpServer())
          .get('/api/v1/users')
          .set('Authorization', 'Bearer valid-admin-token')
          .expect(200);
        expect(jwtVerifierMock.verify).toHaveBeenCalledWith('valid-admin-token');
        expect(response.body.page).toBe(1);
        expect(response.body.size).toBe(20);
        expect(response.body.totalItems).toBeGreaterThanOrEqual(2);
        expect(response.body.totalPages).toBeGreaterThanOrEqual(1);
        expect(response.body.items).toEqual(
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

  it(
    'should apply page and size query parameters',
    async () => {
      mockAdmin();
      const response = await request(app.getHttpServer())
        .get('/api/v1/users?page=2&size=1',)
        .set('Authorization', 'Bearer valid-admin-token')
        .expect(200);
      expect(response.body.page).toBe(2);
      expect(response.body.size).toBe(1);
      expect(Array.isArray(response.body.items),).toBe(true);
      expect(response.body.items.length).toBeLessThanOrEqual(1);
      expect(typeof response.body.totalItems).toBe('number');
      expect(typeof response.body.totalPages).toBe('number');
    },
  );

  it.each([
    [
      '?page=0',
      'page less than 1',
    ],
    [
      '?size=0',
      'size less than 1',
    ],
    [
      '?size=101',
      'size greater than 100',
    ],
    [
      '?page=test',
      'page not numeric',
    ],
    [
      '?size=test',
      'size not numeric',
    ],
  ])(
    'should return 400 for invalid pagination: %s',
    async (queryString, _description) => {
      mockAdmin();
      await request(app.getHttpServer())
        .get(`/api/v1/users${queryString}`)
        .set('Authorization', 'Bearer valid-admin-token')
        .expect(400);
    },
  );
});
