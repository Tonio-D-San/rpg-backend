import {randomUUID} from 'node:crypto';
import {INestApplication,} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {afterEach, beforeEach, describe, expect, it,} from 'vitest';
import {AppModule} from '../src/app.module.js';
import {configureApp} from '../src/bootstrap/configure-app.js';
import {PrismaService} from '../src/database/prisma.service.js';
import {GroupComponent} from '../src/groups/component/group.component.js';
import {KeycloakComponent} from '../src/keycloak/component/keycloak.component.js';

describe('User registration HTTP', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let keycloakComponent: KeycloakComponent;
  let createdUserId: string | null;
  beforeEach(async () => {
    createdUserId = null;
    const moduleRef = await Test.createTestingModule({imports: [AppModule]}).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    keycloakComponent = app.get(KeycloakComponent);
    const groupComponent = app.get(GroupComponent);
    await groupComponent.syncGroups();
  });

  afterEach(async () => {
    if (createdUserId !== null) {
      await prisma.user.deleteMany({where: {keycloakSub: createdUserId}});
      await keycloakComponent.deleteUser(createdUserId);
    }
    await app.close();
  });

  it('should register a user', async () => {
    const uniqueId = randomUUID();
    const email = `e2e-http-${uniqueId}@waystone.test`;
    const response = await request(app.getHttpServer())
      .post('/api/v1/users/register')
      .send({email, password: `Waystone-E2E-${uniqueId}!`, displayName: 'Waystone E2E'})
      .expect(201);
    createdUserId = response.body.keycloakSub;
    expect(response.body).toEqual(
      expect.objectContaining({
        keycloakSub: expect.any(String),
        email,
        displayName: 'Waystone E2E',
        enabled: true,
      }),
    );
    expect(await prisma.user.findUnique({where: {keycloakSub: response.body.keycloakSub}})).not.toBeNull();
  });

  it('should reject unknown properties', async () => {
    const uniqueId = randomUUID();
    await request(app.getHttpServer())
      .post('/api/v1/users/register')
      .send({
        email: `invalid-${uniqueId}@waystone.test`,
        password: 'some-password',
        displayName: 'Test',
        admin: true,
      })
      .expect(400);
  });
});
