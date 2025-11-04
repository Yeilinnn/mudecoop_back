import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;
  private from: string;
  private lastEmailTs = 0;

  // ⏱ Espera mínima entre correos (Mailtrap permite 1/s)
  private readonly minInterval = Number(process.env.MAILER_MIN_INTERVAL_MS || 1200);

  constructor(private cfg: ConfigService) {
    const driver = (this.cfg.get<string>('EMAIL_DRIVER') || 'smtp').toLowerCase();

    if (driver === 'console') {
      // 💻 Modo desarrollo: imprime en consola
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
    } else {
      // 📡 SMTP real (Mailtrap, Gmail u otro)
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

    this.from =
      this.cfg.get<string>('SMTP_FROM') || 'MUDECOOP <no-reply@mudecoop.cr>';

    console.log(`[Mailer] driver=${driver} from=${this.from}`);
  }

  /** 🕒 Control de velocidad entre correos (rate-limit safe) */
  private async throttle() {
    const now = Date.now();
    const diff = now - this.lastEmailTs;
    if (diff < this.minInterval) {
      const wait = this.minInterval - diff;
      console.log(`⏳ Esperando ${wait}ms para respetar rate-limit...`);
      await new Promise((r) => setTimeout(r, wait));
    }
    this.lastEmailTs = Date.now();
  }

  /** 📧 Envío de correo con HTML y fallback a consola */
  async send(to: string, subject: string, html: string) {
    try {
      await this.throttle();

      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
        text: html.replace(/<[^>]+>/g, ' '),
      });

      console.log(`📧 Correo enviado correctamente a ${to}`);
      return info;
    } catch (err) {
      console.error('⚠️ Error enviando correo:', (err as Error).message);
      console.warn('💡 Mostrando correo en consola (modo fallback)');
      console.log(`[MAIL Fallback]\nTo: ${to}\nSubject: ${subject}\nBody:\n${html}`);
    }
  }

  /** 🧪 Ping de diagnóstico */
  async ping(to: string) {
    return this.send(
      to,
      'Ping Mailer ✅',
      '<p>Hola, este es un ping desde el backend (MailerService.ping).</p>',
    );
  }
}
