
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('SMTP_HOST');
        const port = parseInt(config.get<string>('SMTP_PORT') ?? '2525', 10);
        const user = config.get<string>('SMTP_USER');
        const pass = config.get<string>('SMTP_PASS');
        const from = config.get<string>('SMTP_FROM') ?? 'MUDECOOP <no-reply@mudecoop.cr>';

        console.log(`[Mailer] transport host=${host} port=${port}`);

        return {
          transport: {
            host,
            port,
            secure: false,
            auth: { user, pass },
          },
          defaults: { from },
          template: {
            dir: join(process.cwd(), 'mail', 'templates'),
            adapter: new HandlebarsAdapter(),
            options: { strict: false },
          },
        };
      },
    }),
  ],
  exports: [MailerModule],
})
export class MailModule {}
