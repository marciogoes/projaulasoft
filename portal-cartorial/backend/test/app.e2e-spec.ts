/**
 * app.e2e-spec.ts — Testes End-to-End da API
 * Aula 07 — Qualidade e Testes I
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('API — Testes E2E', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/login', () => {
    it('deve retornar 200 e tokens para credenciais validas', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'cidadao@example.com', password: 'senha123' })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.expiresIn).toBe(3600);
      accessToken = response.body.accessToken;
    });

    it('deve retornar 401 para credenciais invalidas', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'naoexiste@email.com', password: 'senha123' })
        .expect(401);
      expect(response.body.message).toBeDefined();
    });

    it('deve retornar 400 quando e-mail e invalido', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nao-e-email', password: 'senha123' })
        .expect(400);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('deve retornar 401 sem token', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });

    it('deve retornar dados do usuario com token valido', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(response.body).toHaveProperty('sub');
      expect(response.body).toHaveProperty('email');
    });
  });

  describe('GET /api/v1/documents', () => {
    it('deve listar documentos sem autenticacao', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/documents')
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/v1/requests', () => {
    it('deve retornar 401 sem token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/requests')
        .send({ documentType: 'CERTIDAO_NASCIMENTO' })
        .expect(401);
    });

    it('deve retornar 400 para tipo de documento invalido', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ documentType: 'TIPO_INVALIDO' })
        .expect(400);
    });
  });
});
