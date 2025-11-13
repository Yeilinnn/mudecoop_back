import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { Token } from './entities/token.entity';
import { JwtStrategy } from './jwt.strategy';
import { MailerService } from '@nestjs-modules/mailer';
import { UsersService } from '../users/users.service';
import { Role } from './entities/roles.entity';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expires = configService.get<string>('JWT_EXPIRES') ?? '1h';
        return {
          secret: configService.get<string>('JWT_SECRET'),
          // 👇 forzamos compatibilidad con el nuevo tipo sin alterar lógica
          signOptions: { expiresIn: expires as any },
        };
      },
    }),
    TypeOrmModule.forFeature([User, Role, Token]),
  ],
  providers: [AuthService, JwtStrategy, UsersService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
