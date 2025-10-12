// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import * as fs from 'fs'; // 👈 agrega esto

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MenuModule } from './menu/menu.module';
import { GalleryModule } from './gallery/gallery.module';
import { CmsModule } from './cms/cms.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

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
        const url = cfg.get<string>('DATABASE_URL');
        const isProd = cfg.get<string>('NODE_ENV') === 'production';

        const common: TypeOrmModuleOptions = {
          type: 'mysql',
          autoLoadEntities: true,
          synchronize: false,
          timezone: 'Z',
        };

        if (url) {
          // 👇 versión para SingleStore Cloud (usa URL completa)
          return {
            ...common,
            url,
            ssl: isProd
              ? {
                  rejectUnauthorized: true,
                  ca: fs.readFileSync(join(process.cwd(), 'singlestore_bundle.pem')).toString(),
                }
              : undefined,
          };
        }

        // 👇 fallback local
        return {
          ...common,
          host: cfg.get<string>('DB_HOST') ?? 'localhost',
          port: Number(cfg.get('DB_PORT') ?? 3306),
          username: cfg.get<string>('DB_USER') ?? '',
          password: cfg.get<string>('DB_PASS') ?? '',
          database: cfg.get<string>('DB_NAME') ?? '',
        };
      },
    }),

    AuthModule,
    UsersModule,
    MenuModule,
    GalleryModule,
    CmsModule,
  ],
})
export class AppModule {}
