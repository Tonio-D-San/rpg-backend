import {ConfigModule} from '@nestjs/config';
import {Test} from '@nestjs/testing';
import {describe, expect, it} from 'vitest';
import {KeycloakModule} from '../src/keycloak/keycloak.module.js';
import {KeycloakComponent} from '../src/keycloak/component/keycloak.component.js';

console.log({
  cwd: process.cwd(),
  baseUrl: process.env.KC_BASE_URL,
  realm: process.env.KC_REALM,
  clientId: process.env.KC_SERVICE_CLIENT_ID,
  databaseUrl: process.env.DATABASE_URL,
});

describe('Keycloak integration', () => {
  it('should read platform groups', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        await ConfigModule.forRoot({isGlobal: true, expandVariables: true, cache: true}),
        KeycloakModule,
      ],
    }).compile();
    const groups = await moduleRef.get(KeycloakComponent).getGroups();
    expect(groups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'platform-users',
          path: '/platform-users',
        }),
        expect.objectContaining({
          name: 'platform-admins',
          path: '/platform-admins',
        }),
      ]),
    );
    await moduleRef.close();
  });
});
