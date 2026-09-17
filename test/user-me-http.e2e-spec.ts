import {
  INestApplication,
} from '@nestjs/common';
import {
  Test,
  TestingModule,
} from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  afterAll,
  afterEach,
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
import {PLATFORM_GROUPS} from "../src/groups/config/platform-groups.config.js";
import {GroupCode} from "../src/groups/model/group-code.js";

describe('GET /api/v1/users/me', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  const jwtVerifierMock = {verify: vi.fn()};
  let keycloakSub: string;
  let email: string;
  const platformUsersGroup =
    PLATFORM_GROUPS.find(
      (group) =>
        group.code === GroupCode.PLATFORM_USERS,
    );

  if (!platformUsersGroup) {
    throw new Error(
      'PLATFORM_USERS group configuration not found',
    );
  }
  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({imports: [AppModule]})
      .overrideProvider(JwtVerifierService)
      .useValue(jwtVerifierMock)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = moduleRef.get(PrismaService);
  });
  beforeEach(async () => {
    vi.clearAllMocks();
    keycloakSub = randomUUID();
    email = `me-${randomUUID()}@waystone.test`;
    await prisma.user.create({
      data: {
        keycloakSub,
        email,
        displayName: 'E2E Current User',
        enabled: true,
      },
    });
  });
  afterEach(async () => { await prisma.user.deleteMany({ where: { keycloakSub } }) });
  afterAll(async () => { await app.close(); });

  it(
    'should return 401 without bearer token',
    async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .expect(401);
      expect(jwtVerifierMock.verify).not.toHaveBeenCalled();
    },
  );

  it(
    'should return 401 with invalid bearer token',
    async () => {
      jwtVerifierMock.verify.mockRejectedValue(new Error('Invalid token'));
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      expect(jwtVerifierMock.verify).toHaveBeenCalledWith('invalid-token');
    },
  );

  it(
    'should return the current user',
    async () => {jwtVerifierMock.verify.mockResolvedValue(
      new AuthenticatedUserModel(
        keycloakSub,
        email,
        ['/platform-users'],
      ),
    );
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      expect(jwtVerifierMock.verify).toHaveBeenCalledWith('valid-token');
      expect(response.body).toMatchObject({
        keycloakSub,
        email,
        displayName: 'E2E Current User',
        enabled: true,
      });
    },
  );

  it(
    'should return 403 when user does not belong to platform-users',
    async () => {
      jwtVerifierMock.verify.mockResolvedValue(
        new AuthenticatedUserModel(
          keycloakSub,
          email,
          [],
        ),
      );

      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer valid-token-without-group')
        .expect(403);
      expect(jwtVerifierMock.verify).toHaveBeenCalledWith('valid-token-without-group');
    },
  );
});
