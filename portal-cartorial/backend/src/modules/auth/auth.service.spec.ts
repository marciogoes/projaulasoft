/**
 * auth.service.spec.ts — Testes unitários do AuthService
 * Aula 07 — Qualidade e Testes I
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../../modules/auth/auth.service';

const mockJwtService = {
  sign:   jest.fn().mockReturnValue('mock_jwt_token'),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('mock_secret'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService,    useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login()', () => {
    it('deve retornar tokens quando credenciais sao validas', async () => {
      const result = await service.login({
        email: 'cidadao@example.com',
        password: 'senha123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.expiresIn).toBe(3600);
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('deve lancar UnauthorizedException quando e-mail nao existe', async () => {
      await expect(
        service.login({ email: 'naoexiste@email.com', password: 'senha123' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lancar UnauthorizedException quando senha esta errada', async () => {
      await expect(
        service.login({ email: 'cidadao@example.com', password: 'senha_errada' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('NAO deve revelar se o e-mail existe na mensagem de erro', async () => {
      let errorMessage = '';
      try {
        await service.login({ email: 'naoexiste@email.com', password: 'qualquer' });
      } catch (e) {
        errorMessage = e.message;
      }
      expect(errorMessage).toBe('Credenciais invalidas');
      expect(errorMessage).not.toContain('e-mail');
    });
  });

  describe('refreshToken()', () => {
    it('deve lancar UnauthorizedException quando refresh token e invalido', async () => {
      mockJwtService.verify.mockImplementation(() => { throw new Error('expired'); });
      await expect(service.refreshToken('token_invalido'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('deve retornar novos tokens quando refresh token e valido', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'usr_001',
        email: 'cidadao@example.com',
        roles: ['cidadao'],
      });
      const result = await service.refreshToken('valid_refresh_token');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('validateJwtPayload()', () => {
    it('deve retornar o payload quando usuario existe', async () => {
      const payload = { sub: 'usr_001', email: 'cidadao@example.com', roles: ['cidadao'] };
      const result = await service.validateJwtPayload(payload);
      expect(result).toEqual(payload);
    });

    it('deve lancar UnauthorizedException quando usuario nao existe no payload', async () => {
      await expect(
        service.validateJwtPayload({ sub: 'id_invalido', email: '', roles: [] })
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
