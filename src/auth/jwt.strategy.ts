// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy as JwtStrategyBase } from 'passport-jwt';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';

type JwtPayload = { sub: number; email: string; role?: string; status?: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(JwtStrategyBase, 'jwt') {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {
    // getOrThrow asegura que sea string (no undefined) y satisface los tipos de passport-jwt
    const secret = config.getOrThrow<string>('JWT_SECRET');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    // console.log('[JWT validate] payload:', payload);
    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Usuario no autorizado o inactivo.');
    }
    return user; // quedará disponible en req.user
  }
}
