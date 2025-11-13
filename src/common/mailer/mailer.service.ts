import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;
  private from: string;
  private lastEmailTs = 0;

  private readonly minInterval = Number(process.env.MAILER_MIN_INTERVAL_MS || 1200);

  constructor(private cfg: ConfigService) {
    const driver = (this.cfg.get<string>('EMAIL_DRIVER') || 'smtp').toLowerCase();

    const host = this.cfg.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const port = Number(this.cfg.get<string>('SMTP_PORT') || 587);
    const secure = this.cfg.get<string>('SMTP_SECURE') === 'true'; // <-- ahora sí
    const user = this.cfg.get<string>('SMTP_USER');
    const pass = this.cfg.get<string>('SMTP_PASS');

    console.log('📨 [Mailer] driver=', driver);
    console.log(`📨 [Mailer] host=${host} port=${port} secure=${secure}`);

    if (driver === 'console') {
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    } else {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: {
          rejectUnauthorized: false, // <-- necesario en Railway + Gmail
        },
      });
    }

    this.from = this.cfg.get<string>('SMTP_FROM') || 'MUDECOOP <no-reply@mudecoop.cr>';
  }

  private async throttle() {
    const now = Date.now();
    const diff = now - this.lastEmailTs;
    if (diff < this.minInterval) {
      await new Promise((resolve) => setTimeout(resolve, this.minInterval - diff));
    }
    this.lastEmailTs = Date.now();
  }

  async send(to: string, subject: string, html: string) {
    await this.throttle();

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
        text: html.replace(/<[^>]+>/g, ' '),
      });

      console.log(`📧 Email enviado → ${to}`);
      return info;
    } catch (err) {
      console.error('❌ Error enviando email:', err);
      console.warn('⚠️ MOSTRANDO FALLBACK');
      console.log({ to, subject, html });
    }
  }

  async ping(to: string) {
    return this.send(
      to,
      'Ping Mailer',
      '<p>Mailer funcionando correctamente ✔</p>',
    );
  }
}
