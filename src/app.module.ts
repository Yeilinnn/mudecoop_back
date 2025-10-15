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
import { ChatbotModule } from './chatbot/chatbot.module';

@Module({
  imports: [
    // ✅ Carga automática de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
    }),

    // ✅ Servir archivos estáticos (uploads)
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

    // ✅ Conexión a Railway (funciona tanto local como en deploy)
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService): TypeOrmModuleOptions => {
        const isProd = cfg.get<string>('NODE_ENV') === 'production';

        // 👇 Debug temporal para ver si carga el .env.production
        console.log('NODE_ENV →', process.env.NODE_ENV);
        console.log('DB_HOST →', process.env.DB_HOST);
        console.log('DB_USER →', process.env.DB_USER);
        console.log('DB_NAME →', process.env.DB_NAME);

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
          ssl: isProd ? false : undefined, // Railway NO usa SSL
        };
      },
    }),

    // ✅ Tus módulos principales
    AuthModule,
    UsersModule,
    MenuModule,
    GalleryModule,
    CmsModule,
    ChatbotModule,
  ],
})
export class AppModule {}
