import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;
  private from: string;

  constructor(private cfg: ConfigService) {
    const driver = (this.cfg.get<string>('EMAIL_DRIVER') || 'smtp').toLowerCase();

    if (driver === 'console') {
      // “envío” a consola (útil para dev)
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
    } else {
      // SMTP real (Mailtrap)
      this.transporter = nodemailer.createTransport({
        host: this.cfg.get<string>('SMTP_HOST') || 'sandbox.smtp.mailtrap.io',
        port: Number(this.cfg.get<string>('SMTP_PORT') || 2525),
        secure: false,
        auth: {
          user: this.cfg.get<string>('SMTP_USER'),
          pass: this.cfg.get<string>('SMTP_PASS'),
        },
      });
    }

    this.from = this.cfg.get<string>('SMTP_FROM') || 'MUDECOOP <no-reply@mudecoop.cr>';
     
    console.log(`[Mailer] driver=${driver} from=${this.from}`);
  }

  async send(to: string, subject: string, html: string) {
    const info = await this.transporter.sendMail({
      from: this.from,
      to,
      subject,
      html,
      text: html.replace(/<[^>]+>/g, ' '),
    });

    // Si driver=console, esto imprime el JSON del “correo” en consola.
     
    console.log('[Mailer] send result:', info?.messageId || info);
    return info;
  }

  // Ping de diagnóstico (opcional)
  async ping(to: string) {
    return this.transporter.sendMail({
      from: this.from,
      to,
      subject: 'Ping Mailer ✅',
      text: 'Hola, este es un ping desde el backend (MailerService.ping).',
    });
  }
}
