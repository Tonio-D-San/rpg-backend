import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {KeycloakCallException} from '../../common/exception/keycloak-call.exception.js';
import {KeycloakAccessTokenModel} from '../model/keycloak-access-token.model.js';
import {KeycloakGroupRepresentationModel} from '../model/keycloak-group-representation.model.js';
import {CreateKeycloakUserModel} from "../model/create-keycloak-user.model.js";

@Injectable()
export class KeycloakAdminClient {
  private readonly baseUrl: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.getOrThrow<string>('KC_BASE_URL').replace(/\/+$/, '');
    this.realm = this.configService.getOrThrow<string>('KC_REALM');
    this.clientId = this.configService.getOrThrow<string>('KC_SERVICE_CLIENT_ID');
    this.clientSecret = this.configService.getOrThrow<string>('KC_SERVICE_CLIENT_SECRET');
  }

  async createUser(user: CreateKeycloakUserModel): Promise<string> {
    const response = await this.doAuthenticatedRequest(
      `/admin/realms/${encodeURIComponent(this.realm)}/users`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          username: user.email,
          email: user.email,
          enabled: true,
          credentials: [
            {
              type: 'password',
              value: user.password,
              temporary: false,
            },
          ],
        }),
      },
    );
    const location = response.headers.get('location');
    if (!location) {
      throw new KeycloakCallException(
        'Keycloak created the user but did not return the Location header',
        response.status,
      );
    }
    const userId = location.substring(location.lastIndexOf('/') + 1);
    if (!userId) {
      throw new KeycloakCallException(
        `Unable to extract Keycloak user id from Location '${location}'`,
        response.status,
      );
    }
    return userId;
  }

  async addUserToGroup(userId: string, groupId: string): Promise<void> {
    await this.doAuthenticatedRequest(
      `/admin/realms/${encodeURIComponent(this.realm)}/users/${encodeURIComponent(userId)}/groups/${encodeURIComponent(groupId)}`,
      {method: 'PUT'},
    );
  }

  async deleteUser(userId: string): Promise<void> {
    await this.doAuthenticatedRequest(
      `/admin/realms/${encodeURIComponent(this.realm)}/users/${encodeURIComponent(userId)}`, {method: 'DELETE'},
    );
  }

  async setUserEnabled(userId: string, enabled: boolean): Promise<void> {
    await this.doAuthenticatedRequest(
      `/admin/realms/${encodeURIComponent(this.realm)}/users/${encodeURIComponent(userId)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled,
        }),
      },
    );
  }

  async getGroups(): Promise<KeycloakGroupRepresentationModel[]> {
    const response = await this.doAuthenticatedRequest(
      `/admin/realms/${encodeURIComponent(this.realm)}/groups`, {method: 'GET'},
    );
    return (await response.json()) as KeycloakGroupRepresentationModel[];
  }

  async getUserGroups(userId: string): Promise<KeycloakGroupRepresentationModel[]> {
    const response = await this.doAuthenticatedRequest(
      `/admin/realms/${encodeURIComponent(this.realm)}/users/${encodeURIComponent(userId)}/groups`,
      {method: 'GET'}
    );
    return (await response.json()) as KeycloakGroupRepresentationModel[];
  }

  private async getAccessToken(): Promise<string> {
    if (this.hasValidAccessToken()) {
      return this.accessToken!
    }
    const body = new URLSearchParams();
    body.set('grant_type', 'client_credentials');
    body.set('client_id', this.clientId);
    body.set('client_secret', this.clientSecret);
    const response = await fetch(
      `${this.baseUrl}/realms/${encodeURIComponent(this.realm)}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body,
      },
    );
    if (!response.ok) {
      throw new KeycloakCallException(
        'Unable to obtain Keycloak service account token',
        response.status,
        await response.text(),
      );
    }
    const token = (await response.json()) as KeycloakAccessTokenModel;
    this.accessToken = token.access_token;
    const safetyWindowSeconds = 30;
    this.accessTokenExpiresAt = Date.now() + Math.max(token.expires_in - safetyWindowSeconds, 0) * 1000;
    return this.accessToken;
  }

  private hasValidAccessToken(): boolean {
    return (this.accessToken !== null && Date.now() < this.accessTokenExpiresAt);
  }

  private async doAuthenticatedRequest(path: string, init: RequestInit): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    headers.set('Authorization', `Bearer ${await this.getAccessToken()}`);
    const response = await fetch(
      `${this.baseUrl}${path}`,
      {
        ...init,
        headers,
      },
    );
    if (!response.ok) {
      if (response.status === 401) {
        this.invalidateAccessToken();
      }
      throw new KeycloakCallException(
        `Keycloak request failed: ${init.method ?? 'GET'} ${path}`,
        response.status,
        await response.text(),
      );
    }
    return response;
  }

  private invalidateAccessToken(): void {
    this.accessToken = null;
    this.accessTokenExpiresAt = 0;
  }
}
