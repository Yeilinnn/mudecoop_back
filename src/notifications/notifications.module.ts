import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { Notification } from './entities/notification.entity';
import { RestaurantReservation } from 'src/restaurant-reservations/entities/restaurant-reservation.entity';
import { ActivityReservation } from 'src/activity-reservation/entities/activity-reservation.entity';
import { User } from 'src/auth/entities/user.entity';

@Module({
  imports: [
    ConfigModule, // ← IMPORTANTE: Importar ConfigModule
    TypeOrmModule.forFeature([
      Notification,
      RestaurantReservation,
      ActivityReservation,
      User,
    ]),

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const smtpHost = config.get<string>('SMTP_HOST');
        const smtpPort = config.get<string>('SMTP_PORT');
        const smtpUser = config.get<string>('SMTP_USER');
        const smtpPass = config.get<string>('SMTP_PASS');
        const smtpFrom = config.get<string>('SMTP_FROM');
        const smtpAdminEmail = config.get<string>('SMTP_ADMIN_EMAIL');

        console.log('📧 ===== CONFIGURACIÓN DE EMAIL =====');
        console.log('📧 SMTP_HOST:', smtpHost);
        console.log('📧 SMTP_PORT:', smtpPort);
        console.log('📧 SMTP_USER:', smtpUser);
        console.log('📧 SMTP_PASS:', smtpPass ? `✓ (${smtpPass.length} caracteres)` : '✗ NO DEFINIDA');
        console.log('📧 SMTP_FROM:', smtpFrom);
        console.log('📧 SMTP_ADMIN_EMAIL:', smtpAdminEmail); // ← VERIFICAR ESTE VALOR
        console.log('📧 ===================================');

        if (!smtpHost || !smtpUser || !smtpPass) {
          console.error('❌ ERROR: Faltan variables de configuración de email');
          throw new Error('Configuración de email incompleta');
        }

        return {
          transport: {
            host: smtpHost,
            port: Number(smtpPort) || 587,
            secure: false,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
            tls: {
              rejectUnauthorized: false,
            },
          },
          defaults: {
            from: smtpFrom || '"MUDECOOP" <no-reply@mudecoop.cr>',
          },
          template: {
            dir: join(__dirname, '..', '..', 'mail', 'templates'),
            adapter: new HandlebarsAdapter(),
            options: { strict: true },
          },
        };
      },
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService],
})
export class NotificationsModule {}
