import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Not, IsNull, MoreThanOrEqual, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { User } from './entities/user.entity';
import { Token } from './entities/token.entity';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { UsersService } from '../users/users.service';

const revokedRefreshTokens = new Set<string>();

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Token) private tokens: Repository<Token>,
    private jwt: JwtService,
    private cfg: ConfigService,
    private mailer: MailerService,
    private usersService: UsersService,
  ) {}

  // ========== LOGIN ==========
  async login(dto: LoginDto) {
    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.password')
      .leftJoinAndSelect('u.role', 'r')
      .where('u.email = :email', { email: dto.email })
      .getOne();

    if (!user) throw new UnauthorizedException('Correo o contraseña incorrectos.');
    const passOk = await bcrypt.compare(dto.password, user.password);
    if (!passOk || user.status !== 'active') throw new UnauthorizedException('Correo o contraseña incorrectos.');

    const accessToken = this.signAccessToken(user);
    const refreshToken = this.signRefreshToken(user.id);
    const { password, ...safeUser } = user as any;
    return { accessToken, refreshToken, user: safeUser };
  }

  // ========== REFRESH ==========
  async refresh(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Falta token de sesión.');
    if (revokedRefreshTokens.has(refreshToken)) throw new UnauthorizedException('Sesión revocada.');

    let decoded: any;
    try {
      decoded = this.jwt.verify(refreshToken, { secret: this.cfg.get<string>('REFRESH_SECRET') });
    } catch {
      throw new UnauthorizedException('Sesión inválida o expirada.');
    }

    const user = await this.users.findOne({ where: { id: decoded.sub }, relations: ['role'] });
    if (!user || user.status !== 'active') throw new UnauthorizedException('Usuario no autorizado o inactivo.');

    const accessToken = this.signAccessToken(user);
    return { accessToken };
  }

  // ========== LOGOUT ==========
  async logout(refreshToken: string) {
    if (refreshToken) revokedRefreshTokens.add(refreshToken);
    return { message: 'Sesión cerrada.' };
  }

  // ========== FORGOT PASSWORD ==========
  private makeResetToken(ttlMin = Number(this.cfg.get<number>('RESET_TOKEN_TTL_MINUTES') || 60)) {
    const raw = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    const expiresAt = new Date(Date.now() + ttlMin * 60_000);
    return { raw, hash, expiresAt };
  }

  async requestPasswordReset(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const generic = { ok: true, message: 'Si el correo existe, enviaremos un enlace para restablecer.' };

    const user = await this.users.findOne({ where: { email } });
    if (!user) return generic;

    try {
      await this.tokens.delete({ userId: user.id });
      const { raw, hash, expiresAt } = this.makeResetToken();
      await this.tokens.insert({ userId: user.id, token: hash, expiresAt, usedAt: null });

      const base = this.cfg.get<string>('FRONT_BASE_URL') || 'http://localhost:5173';
      const resetUrl = `${base.replace(/\/+$/, '')}/reset-password?token=${raw}`;

      const html = `
        <div style="font-family:system-ui,Roboto,Segoe UI">
          <h2>Recuperar contraseña</h2>
          <p>Solicitaste restablecer tu contraseña en MUDECOOP.</p>
          <p>
            <a href="${resetUrl}" style="background:#155B8A;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none">
              Restablecer contraseña
            </a>
          </p>
          <p>O copia este enlace:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>El enlace vence en ${this.cfg.get<number>('RESET_TOKEN_TTL_MINUTES') || 60} minutos.</p>
          <hr/>
          <small>Si no fuiste tú, ignora este mensaje.</small>
        </div>
      `;

      try {
        await this.mailer.sendMail({
  to: email,
  subject: 'MUDECOOP • Restablecer contraseña',
  html,
});

      } catch (err) {
        console.error('[MAIL_ERROR] forgot-password →', (err as any)?.message || err);
      }
    } catch (err) {
      console.error('[FORGOT_INTERNAL_ERROR]', (err as any)?.message || err);
    }

    return generic;
  }

  // ========== RESET PASSWORD ==========
  async resetPassword(dto: ResetPasswordDto) {
    const hashed = crypto.createHash('sha256').update(dto.token).digest('hex');

    const row = await this.tokens.findOne({
      where: {
        token: hashed,
        usedAt: IsNull(),
        expiresAt: MoreThanOrEqual(new Date()),
      },
    });

    if (!row) {
      return { ok: false, message: 'Token inválido o vencido' };
    }

    await this.usersService.updatePassword(row.userId, dto.password);
    await this.tokens.update({ id: row.id }, { usedAt: new Date() });
    await this.tokens.delete({ userId: row.userId, token: Not(hashed) });

    return { ok: true, message: 'Contraseña actualizada correctamente' };
  }

  // ========== Helpers ==========
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
        expiresIn: (this.cfg.get<string>('JWT_EXPIRES') as any) || '1h',
      },
    );
  }

  private signRefreshToken(userId: number) {
    return this.jwt.sign(
      { sub: userId },
      {
        secret: this.cfg.get<string>('REFRESH_SECRET'),
        expiresIn: (this.cfg.get<string>('REFRESH_EXPIRES') as any) || '7d',
      },
    );
  }

  async validateUser(userId: number): Promise<User> {
    const user = await this.users.findOne({ where: { id: userId }, relations: ['role'] });
    if (!user || user.status !== 'active') throw new UnauthorizedException('Usuario no autorizado o inactivo.');
    return user;
  }

  async verifyResetToken(token: string) {
    if (!token) return { valid: false };

    const hashed = crypto.createHash('sha256').update(token).digest('hex');

    const row = await this.tokens.findOne({
      where: {
        token: hashed,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });

    return { valid: !!row };
  }
}
