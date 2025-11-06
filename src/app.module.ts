import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MenuModule } from './menu/menu.module';
import { GalleryModule } from './gallery/gallery.module';
import { CmsModule } from './cms/cms.module';
import { ContactModule } from './contact/contact.module';
import { ActivityModule } from './activities/activity.module';
import { RestaurantReservationsModule } from './restaurant-reservations/restaurant-reservations.module';
import { ActivityReservationModule } from './activity-reservation/activity-reservation.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MailModule } from './mail/mail.module';
import { ChatbotModule } from './chatbot/chatbot.module';

@Module({
  imports: [
    // ⚠️ ConfigModule DEBE estar PRIMERO y ser global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
    }),

    ServeStaticModule.forRoot({
      serveRoot: '/uploads',
      rootPath: join(process.cwd(), 'uploads'),
      serveStaticOptions: {
        index: false,
        redirect: false,
        fallthrough: true,
        dotfiles: 'ignore',
        extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
      },
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService): TypeOrmModuleOptions => {
        const isProd = cfg.get<string>('NODE_ENV') === 'production';

        console.log('🔍 NODE_ENV →', cfg.get<string>('NODE_ENV'));
        console.log('🔍 DB_HOST →', cfg.get<string>('DB_HOST'));
        console.log('🔍 DB_USER →', cfg.get<string>('DB_USER'));
        console.log('🔍 DB_NAME →', cfg.get<string>('DB_NAME'));

 const dbUrl = cfg.get<string>('DATABASE_URL');
if (dbUrl) {
  // 🟢 Railway usa DATABASE_URL, esto lo detecta automáticamente
  return {
    type: 'mysql',
    url: dbUrl,
    autoLoadEntities: true,
    synchronize: false,
    timezone: 'Z',
  };
}

// 🟢 Fallback para entorno local (.env)
return {
  type: 'mysql',
  host: cfg.get<string>('DB_HOST') ?? 'localhost',
  port: Number(cfg.get<string>('DB_PORT') ?? 3306),
  username: cfg.get<string>('DB_USER'),
  password: cfg.get<string>('DB_PASS'),
  database: cfg.get<string>('DB_NAME'),
  autoLoadEntities: true,
  synchronize: false,
  timezone: 'Z',
  ssl: isProd ? false : undefined,
};

      },
    }),

    MailModule,
    AuthModule,
    UsersModule,
    MenuModule,
    GalleryModule,
    CmsModule,
    ContactModule,
    ActivityModule,
    RestaurantReservationsModule,
    ActivityReservationModule,
    NotificationsModule,
    ChatbotModule,
  ],
})
export class AppModule {}