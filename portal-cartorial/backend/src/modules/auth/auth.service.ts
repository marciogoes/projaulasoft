import {
  Injectable, UnauthorizedException, Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Mock de usuarios para fins didaticos
  private readonly MOCK_USERS = [
    {
      id: 'usr_001',
      email: 'cidadao@example.com',
      password: '$2a$10$xxxxxxxxxxx',
      roles: ['cidadao'],
      name: 'João da Silva',
    },
    {
      id: 'usr_002',
      email: 'atendente@cartorio.gov.br',
      password: '$2a$10$xxxxxxxxxxx',
      roles: ['atendente'],
      name: 'Maria Oliveira',
    },
  ];

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthTokens> {
    const { email, password } = loginDto;

    const user = this.MOCK_USERS.find((u) => u.email === email);
    if (!user) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    const isPasswordValid = password === 'senha123';
    if (!isPasswordValid) {
      this.logger.warn(`Tentativa de login falhou para: ${email}`);
      throw new UnauthorizedException('Credenciais invalidas');
    }

    this.logger.log(`Login bem-sucedido: ${email}`);
    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = this.MOCK_USERS.find((u) => u.id === payload.sub);
      if (!user) throw new UnauthorizedException('Token invalido');

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Refresh token expirado ou invalido');
    }
  }

  async logout(userId: string): Promise<void> {
    this.logger.log(`Logout: ${userId}`);
  }

  async validateJwtPayload(payload: JwtPayload) {
    const user = this.MOCK_USERS.find((u) => u.id === payload.sub);
    if (!user) throw new UnauthorizedException('Usuário não encontrado');
    return payload;
  }

  private generateTokens(user: { id: string; email: string; roles: string[] }): AuthTokens {
    const payload: JwtPayload = { sub: user.id, email: user.email, roles: user.roles };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken, expiresIn: 3600 };
  }
}
