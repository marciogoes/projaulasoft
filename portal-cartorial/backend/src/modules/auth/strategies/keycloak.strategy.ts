/**
 * KeycloakStrategy — Integração OAuth2 com Gov.br via Keycloak
 */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
  constructor(configService: ConfigService) {
    super({
      authorizationURL: `${configService.get('KEYCLOAK_URL')}/realms/cartorial/protocol/openid-connect/auth`,
      tokenURL: `${configService.get('KEYCLOAK_URL')}/realms/cartorial/protocol/openid-connect/token`,
      clientID: configService.get<string>('KEYCLOAK_CLIENT_ID'),
      clientSecret: configService.get<string>('KEYCLOAK_CLIENT_SECRET'),
      callbackURL: `${configService.get('APP_URL')}/api/v1/auth/callback/keycloak`,
      scope: ['openid', 'profile', 'email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    return { accessToken, refreshToken, profile };
  }
}
