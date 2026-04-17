import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv:      process.env.NODE_ENV        || 'development',
  port:         parseInt(process.env.PORT   || '3000', 10),
  appUrl:       process.env.APP_URL         || 'http://localhost:3000',
  frontendUrl:  process.env.FRONTEND_URL    || 'http://localhost:3001',
  jwtSecret:    process.env.JWT_SECRET      || 'dev_secret_change_me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN  || '1h',
  keycloakUrl:    process.env.KEYCLOAK_URL          || 'http://localhost:8080',
  keycloakRealm:  process.env.KEYCLOAK_REALM        || 'cartorial',
  keycloakClient: process.env.KEYCLOAK_CLIENT_ID    || 'portal-api',
  keycloakSecret: process.env.KEYCLOAK_CLIENT_SECRET,
  minioEndpoint:  process.env.MINIO_ENDPOINT  || 'localhost',
  minioPort:      parseInt(process.env.MINIO_PORT || '9000', 10),
  minioAccessKey: process.env.MINIO_ACCESS_KEY,
  minioSecretKey: process.env.MINIO_SECRET_KEY,
  minioBucket:    process.env.MINIO_BUCKET_DOCUMENTS || 'documentos',
}));
