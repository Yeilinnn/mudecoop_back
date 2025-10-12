// app.module.ts
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Sirve /uploads/*.*
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

        // ✅ Certificado oficial de SingleStore embebido directamente
        const singleStoreCA = `
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIUYVU3j0tqQj4EQsBGbMZ8EjL7ZJcwDQYJKoZIhvcNAQEL
BQAwRTELMAkGA1UEBhMCVVMxHDAaBgNVBAoME1NpbmdsZVN0b3JlIFRlY2hub2xv
Z3kxFjAUBgNVBAMMDVNpbmdsZVN0b3JlIENBMB4XDTIzMDQyNTAwMDAwMFoXDTMz
MDQyNTAwMDAwMFowRTELMAkGA1UEBhMCVVMxHDAaBgNVBAoME1NpbmdsZVN0b3Jl
IFRlY2hub2xvZ3kxFjAUBgNVBAMMDVNpbmdsZVN0b3JlIENBMIICIjANBgkqhkiG
9w0BAQEFAAOCAg8AMIICCgKCAgEAwb3qfdrq1kFEnfQF+O8ybm8SlgH9xdu6nxpP
c2i6b3O8dAI0Vft11z6P4U5KZ3NsRZXtiRuR7PfNRlyTz5AwL1Cmi0cQ6CWz5K3x
9yyaLo/z5aGq2kfxHDLt9Yh6VSe8L+d0EelzJk+2q3JAH5ZDXyLeFbApxRCtMv7b
RzNn9Ecy7GJf4Q4HfYAjlGAdTSTkw8WhIsRz2Z0/FcKkXo4Xq0ErCzqCQYzhlUHD
vV6Aj1QpyK3AwffKWeDXqUGZEXp1w2IKR+14VqX1yyjaSrUBvZnLj28Yy5DYJf1G
ykx7xR+T1ir/K4FZw8R/VrSwk4BzjGczfx+INcKDRh8KJgfgO39qv+MWi9nLhXgL
IK9+R6N8tN0gB9uMffkSLWQlX15pDFtbzGQbA9phWWxTLWCEOTWuwSvn0bZOD1UZ
9WyRSPXQm1QvHzVYm1mVPPgzY4MuEiPgi6pKJdKUazGawE4UCCX+Azb5PSXLC2Sh
d5Q+39q0Y3lfhLrmSOjAPQ9EfLPQ3D8rKMyxS2D9pB5c3M6hRgf0uW5tDlZhC4Jb
upxeXZZEdJDpS3GdTcuKHvEs3PY3OKho3U1MQyQ1fEPMKuqqj2lZ8hOEGaZnqfV+
AY9Z0N1b9DtrEbXn2adCptk2ZWW4hTGQeozrlhkbmY3g0FY8eBQYXuQpM60bb/ol
C1dN0OcCAwEAAaNTMFEwHQYDVR0OBBYEFPoMCb0dKmELe1+owHxJ8u2ABk5HMB8G
A1UdIwQYMBaAFPoMCb0dKmELe1+owHxJ8u2ABk5HMA8GA1UdEwEB/wQFMAMBAf8w
DQYJKoZIhvcNAQELBQADggIBAJVh1rwnpY/N3Fqyl1u3lPcN+oOoyzH7fx2pnsBz
x+66EvOy9xJ2mh6VzuxpUlOgE4MC4S/ZMgfz5xUamRy+q4u9aY0OiynX8/vCBQv3
pmDLwSOvLZTkkEhbyaG4IfEszM5w72J+n0z9NY+R2StnPVAKw7v3mZrF9DMZYmFo
RZTZjpvSfW9M2pHmbXld4XcgXsvTwR9D3Zm15rXo7TEYz+YDYWg5bHFl9/L3xiix
1znVXt5O5z1FSFrzwjHBiWvXDsSccBaPoRSzTvROsX4BgdV25dG+yoJAXnD1m1G3
otVkzPHzblDgU6R2d1Yo6YjvjM0Ocuv8BIRRXsaVOBaPZ8TccH3PguKIKRCbxmhJ
cFyz6mXDyHhAK7ZtJ0+bLPf0U6+I9SmTAg7Woe4sW+L8sncw7YVf3qkJzKfn4kSy
Bd43n5U7F+LZ6rGBUtbUmN8bI2V9lga6CW5xS/cFdQDC9EoPA+T+M5VJxwbTslft
7mSyKxM0LCWZJm3x6uuk8LtErQFS9dWONkwk+TKqD1z5jC9Ed6msO9gGGo6GrOgi
6eBbi7n7RFPdM1HgkXrXoTQTTDLoRYksHvXAOJHLe9jKdhwD/8bOEfVu8nCE/rly
+YhxuVqvAyv5Ra4MywXxG/2P52zDqXUvD/X/s3MTy1Ub1CMg7WjMb/yIjsWn2x1/
7FWj
-----END CERTIFICATE-----
        `.trim();

        if (url) {
          return {
            ...common,
            url,
            ssl: isProd
  ? {
      rejectUnauthorized: true,
      ca: [singleStoreCA], // ✅ debe ser un array
    }
  : undefined,

          };
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
    GalleryModule,
    CmsModule,
  ],
})
export class AppModule {}
