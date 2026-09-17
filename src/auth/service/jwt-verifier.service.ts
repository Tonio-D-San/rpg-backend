import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createRemoteJWKSet,
  jwtVerify,
  JWTPayload,
} from 'jose';

import { AuthenticatedUserModel } from '../model/authenticated-user.model.js';

@Injectable()
export class JwtVerifierService {
  private readonly issuer: string;
  private readonly audience: string;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    private readonly configService: ConfigService) {
    const baseUrl = this.normalizeBaseUrl(this.configService.getOrThrow<string>('KC_BASE_URL'));
    const realm = this.configService.getOrThrow<string>('KC_REALM');
    this.audience = this.configService.getOrThrow<string>('KC_API_AUDIENCE');
    this.issuer = `${baseUrl}/realms/${encodeURIComponent(realm)}`;
    this.jwks = createRemoteJWKSet(new URL(`${this.issuer}/protocol/openid-connect/certs`));
  }

  async verify(token: string): Promise<AuthenticatedUserModel> {
    const { payload } = await jwtVerify(
      token,
      this.jwks,
      {
        issuer: this.issuer,
        audience: this.audience,
      },
    );
    return this.toAuthenticatedUser(payload);
  }

  private toAuthenticatedUser(payload: JWTPayload): AuthenticatedUserModel {
    if (!payload.sub) {
      throw new Error('Access token does not contain a subject',);
    }
    const email = typeof payload.email === 'string' ? payload.email : null;
    const groups = Array.isArray(payload.groups)
      ? payload.groups.filter((group): group is string => typeof group === 'string')
      : [];
    return new AuthenticatedUserModel(payload.sub, email, groups);
  }

  private normalizeBaseUrl(baseUrl: string,): string {
    return baseUrl.replace(/\/+$/, '');
  }
}
