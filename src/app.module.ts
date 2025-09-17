// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MenuModule } from './menu/menu.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Sirve /uploads/*.*
    ServeStaticModule.forRoot({
      serveRoot: '/uploads',
      rootPath: join(process.cwd(), 'uploads'),
      serveStaticOptions: {
        index: false,     // <- clave: NO buscar index.html
        redirect: false,  // <- no redirigir /uploads -> /uploads/
        fallthrough: true,
        dotfiles: 'ignore',
        extensions: ['jpg','jpeg','png','webp','gif','svg'],
      },
    }),

   TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (cfg: ConfigService): TypeOrmModuleOptions => {
    const url = cfg.get<string>('DATABASE_URL');

    const common = {
      type: 'mysql' as const,
      autoLoadEntities: true,
      synchronize: false,
      timezone: 'Z' as const,
    };

    if (url) {
      return { ...common, url };
    }

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
  ],
})
export class AppModule {}
