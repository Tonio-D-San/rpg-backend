import { Module } from '@nestjs/common';
import { KeycloakAdminClient } from './client/keycloak-admin.client.js';
import { KeycloakComponent } from './component/keycloak.component.js';

@Module({
  providers: [
    KeycloakAdminClient,
    KeycloakComponent,
  ],
  exports: [
    KeycloakComponent,
  ],
})
export class KeycloakModule {}
