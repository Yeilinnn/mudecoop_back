// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';

// 🔒 Blacklist en memoria para refresh tokens revocados (dev).
// En producción, usa Redis o DB para persistir entre reinicios.
const revokedRefreshTokens = new Set<string>();

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    private jwt: JwtService,
    private cfg: ConfigService,
  ) {}

  // ===============================
  // LOGIN
  // ===============================
  async login(dto: LoginDto) {
    // Como password tiene select:false, incluirlo explícitamente SOLO aquí
    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.password')
      .leftJoinAndSelect('u.role', 'r')
      .where('u.email = :email', { email: dto.email })
      .getOne();

    if (!user) throw new UnauthorizedException('Correo o contraseña incorrectos.');

    const passOk = await bcrypt.compare(dto.password, user.password);
    if (!passOk || user.status !== 'active') {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    const accessToken = this.signAccessToken(user);
    const refreshToken = this.signRefreshToken(user.id);

    const { password, ...safeUser } = user as any;
    return { accessToken, refreshToken, user: safeUser };
  }

  // ===============================
  // REFRESH (seguir conectado)
  // ===============================
  async refresh(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Falta token de sesión.');

    // ⛔ Verificar si ya fue revocado (logout)
    if (revokedRefreshTokens.has(refreshToken)) {
      throw new UnauthorizedException('Sesión revocada.');
    }

    let decoded: any;
    try {
      decoded = this.jwt.verify(refreshToken, {
        secret: this.cfg.get<string>('REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Sesión inválida o expirada.');
    }

    // validar que el usuario existe y sigue activo
    const user = await this.users.findOne({ where: { id: decoded.sub }, relations: ['role'] });
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Usuario no autorizado o inactivo.');
    }

    // emitir un nuevo access token
    const accessToken = this.signAccessToken(user);
    return { accessToken };
  }

  // ===============================
  // LOGOUT (revocar refresh)
  // ===============================
  async logout(refreshToken: string) {
    if (refreshToken) {
      revokedRefreshTokens.add(refreshToken);
    }
    return { message: 'Sesión cerrada.' };
  }

  // ===============================
  // Helpers de firmado
  // ===============================
  private signAccessToken(user: User) {
    return this.jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role?.name,
        status: user.status,
      },
      {
        secret: this.cfg.get<string>('JWT_SECRET'),
        expiresIn: this.cfg.get<string>('JWT_EXPIRES') ?? '1h',
      },
    );
  }

  private signRefreshToken(userId: number) {
    return this.jwt.sign(
      { sub: userId },
      {
        secret: this.cfg.get<string>('REFRESH_SECRET'),
        expiresIn: this.cfg.get<string>('REFRESH_EXPIRES') ?? '7d',
      },
    );
  }

  // ===============================
  // VALIDAR TOKEN (usada por JwtStrategy)
  // ===============================
  async validateUser(userId: number): Promise<User> {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Usuario no autorizado o inactivo.');
    }
    return user;
  }
}
