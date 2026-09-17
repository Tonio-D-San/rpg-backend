import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { AuthModule } from '../src/auth/auth.module.js';
import { JwtVerifierService } from '../src/auth/service/jwt-verifier.service.js';

describe('JWT verifier integration', () => {
  let moduleRef: TestingModule;
  let configService: ConfigService;
  let jwtVerifierService: JwtVerifierService;
  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        await ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
        }),
        AuthModule,
      ],
    }).compile();
    configService = moduleRef.get(ConfigService);
    jwtVerifierService = moduleRef.get(JwtVerifierService);
  });

  afterEach(async () => { await moduleRef.close(); });

  it(
    'should verify a token issued by Keycloak for waystone-api',
    async () => {
      const baseUrl = configService
        .getOrThrow<string>('KC_BASE_URL')
          .replace(/\/+$/, '');
      const realm = configService.getOrThrow<string>('KC_REALM',);
      const clientId = configService.getOrThrow<string>('KC_SERVICE_CLIENT_ID');
      const clientSecret = configService.getOrThrow<string>('KC_SERVICE_CLIENT_SECRET',);
      const tokenBody = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      });
      const tokenResponse = await fetch(
        `${baseUrl}/realms/${encodeURIComponent(realm)}/protocol/openid-connect/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/x-www-form-urlencoded',
          },
          body: tokenBody,
        },
      );
      expect(tokenResponse.ok).toBe(true);
      const tokenPayload = (await tokenResponse.json()) as { access_token: string; };
      expect(tokenPayload.access_token).toBeTruthy();
      const authenticatedUser = await jwtVerifierService.verify(tokenPayload.access_token);
      expect(authenticatedUser.subject).toBeTruthy();
    },
    15_000,
  );

  it('should reject an invalid token', async () => {
    await expect(jwtVerifierService.verify('not-a-valid-jwt')).rejects.toThrow();
  });
});
