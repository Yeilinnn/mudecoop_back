// This file was added by an automated change and is intentionally left minimal.
// The project uses @nestjs-modules/mailer MailerModule configured in NotificationsModule.
// Keeping this stub avoids accidental DI collisions. If you prefer, delete this file.

import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';

@Module({
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
