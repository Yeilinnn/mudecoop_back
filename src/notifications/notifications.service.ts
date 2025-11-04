import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly mailerService: MailerService,
    private readonly gateway: NotificationsGateway,
  ) {}

  // ─────────────────────────────────────────────────────────
  // Throttle simple para no pasarnos del rate limit del SMTP
  // ─────────────────────────────────────────────────────────
  private lastEmailTs = 0;
  private emailMinIntervalMs = Number(process.env.MAILER_MIN_INTERVAL_MS || 10000);

  private async throttleEmail() {
    const now = Date.now();
    const diff = now - this.lastEmailTs;
    if (diff < this.emailMinIntervalMs) {
      await new Promise((r) => setTimeout(r, this.emailMinIntervalMs - diff));
    }
    this.lastEmailTs = Date.now();
  }

  // ─────────────────────────────────────────────────────────
  // Reintento simple si Mailtrap bloquea el envío
  // ─────────────────────────────────────────────────────────
  private async safeSendMail(payload: any, retries = 2) {
    try {
      return await this.mailerService.sendMail(payload);
    } catch (err: any) {
      const msg = String(err.message || '');
      if (msg.includes('Too many emails') && retries > 0) {
        console.warn('⏳ Mailtrap limit alcanzado, reintentando en 10s...');
        await new Promise((r) => setTimeout(r, 10000));
        return this.safeSendMail(payload, retries - 1);
      }
      throw err;
    }
  }

  /**
   * 📨 Crea UNA notificación y maneja PUSH + EMAILS automáticamente
   * 
   * Lógica:
   * - Si type === 'PUSH': guarda en BD, emite WebSocket, y envía email al admin
   * - Si type === 'EMAIL': solo envía email (sin guardar en BD ni WebSocket)
   * - Si toEmail existe: también envía confirmación al cliente
   */
  async create(dto: CreateNotificationDto) {
    try {
      let saved: Notification | null = null;

      // ─────────────────────────────────────────────────────
      // 1️⃣ Si es PUSH: guardar en BD + emitir WebSocket
      // ─────────────────────────────────────────────────────
      if (dto.type === 'PUSH') {
        const notification = this.notificationRepo.create({
          category: dto.category,
          title: dto.title,
          message: dto.message,
          status: 'new',
          type: 'PUSH',
          user: dto.user_id ? { id: dto.user_id } : null,
          restaurantReservation: dto.restaurant_reservation_id
            ? { id: dto.restaurant_reservation_id }
            : null,
        });

        saved = await this.notificationRepo.save(notification);
        
        // 🔔 Emitir notificación PUSH al frontend
        this.gateway.sendNewNotification(saved);
        console.log('✅ Notificación PUSH guardada y emitida');

        // 📧 Enviar email al ADMIN
        await this.sendEmailToAdmin(dto.title, dto.message, dto.reservation_url);
      }

      // ─────────────────────────────────────────────────────
      // 2️⃣ Si hay toEmail: enviar confirmación al CLIENTE
      // ─────────────────────────────────────────────────────
      if (dto.toEmail) {
        await this.sendEmailToClient(
          dto.toEmail,
          dto.title,
          dto.message,
          dto.category,
          dto.reservation_url,
        );
      }

      // ─────────────────────────────────────────────────────
      // 3️⃣ Si es type === 'EMAIL' puro (sin PUSH ni toEmail)
      // ─────────────────────────────────────────────────────
      if (dto.type === 'EMAIL' && !dto.toEmail && !saved) {
        // Solo enviar email directo (legacy support)
        if (dto.user_id) {
          await this.sendEmailNotificationByUserId(
            dto.user_id,
            dto.title,
            dto.message,
            dto.reservation_url,
          );
        }
      }

      return saved || { success: true, message: 'Email sent' };
    } catch (error) {
      console.error('❌ ERROR AL CREAR NOTIFICACIÓN ===>', error);
      throw new InternalServerErrorException('Error al crear notificación');
    }
  }

  // ─────────────────────────────────────────────────────────
  // 📧 Enviar email al ADMIN
  // ─────────────────────────────────────────────────────────
  private async sendEmailToAdmin(
    title: string,
    message: string,
    reservationUrl?: string,
  ) {
    try {
      await this.throttleEmail();

      const adminEmail = (process.env.SMTP_ADMIN_EMAIL || 'admin@mudecoop.cr')
        .trim()
        .toLowerCase();

      await this.safeSendMail({
        to: adminEmail,
        subject: title,
        template: './generic-notification',
        context: {
          name: 'Administrador',
          title,
          message,
          year: new Date().getFullYear(),
          reservationUrl,
        },
        text: `${message}${reservationUrl ? ` | Ver: ${reservationUrl}` : ''}`,
      });

      console.log(`📧 Email enviado al admin: ${adminEmail}`);
    } catch (err) {
      console.error('⚠️ Error enviando email al admin:', (err as Error).message);
    }
  }

  // ─────────────────────────────────────────────────────────
  // 📧 Enviar email al CLIENTE
  // ─────────────────────────────────────────────────────────
  private async sendEmailToClient(
    toEmail: string,
    title: string,
    message: string,
    category: string,
    reservationUrl?: string,
  ) {
    try {
      await this.throttleEmail();

      // Mensajes personalizados según categoría
      let clientTitle = title;
      let clientMessage = message;

      if (category === 'RESERVATION') {
        clientTitle = 'Confirmación de tu reserva - MUDECOOP';
        clientMessage = `Hola, hemos recibido tu reserva correctamente. ${message}`;
      } else if (category === 'ACTIVITY') {
        clientTitle = 'Gracias por contactarnos 💚';
        clientMessage = 'Hola, hemos recibido tu mensaje. Te responderemos lo antes posible.';
      }

      await this.safeSendMail({
        to: toEmail,
        subject: clientTitle,
        template: './generic-notification',
        context: {
          name: '',
          title: clientTitle,
          message: clientMessage,
          year: new Date().getFullYear(),
          reservationUrl,
        },
        text: `${clientMessage}${reservationUrl ? ` | Ver: ${reservationUrl}` : ''}`,
      });

      console.log(`📧 Email de confirmación enviado al cliente: ${toEmail}`);
    } catch (err) {
      console.error('⚠️ Error enviando email al cliente:', (err as Error).message);
    }
  }

  // ─────────────────────────────────────────────────────────
  // 📧 Envío de correo por user_id (legacy support)
  // ─────────────────────────────────────────────────────────
  private async sendEmailNotificationByUserId(
    userId: number,
    title: string,
    message: string,
    reservationUrl?: string,
  ) {
    try {
      await this.throttleEmail();

      const [user] = await this.notificationRepo.query(
        'SELECT email, first_name, last_name FROM users WHERE id = ?',
        [userId],
      );
      if (!user) return;

      const { email, first_name, last_name } = user;
      const name = `${first_name ?? ''} ${last_name ?? ''}`.trim();

      await this.safeSendMail({
        to: email,
        subject: title,
        template: './generic-notification',
        context: { name, title, message, year: new Date().getFullYear(), reservationUrl },
        text: `${message}${reservationUrl ? ` | Ver: ${reservationUrl}` : ''}`,
      });

      console.log(`📧 Correo enviado correctamente a ${email}`);
    } catch (err) {
      console.error('⚠️ Error enviando correo (user_id):', (err as Error).message);
    }
  }

  // ─────────────────────────────────────────────────────────
  // 📂 Consultas básicas
  // ─────────────────────────────────────────────────────────
  async findAll() {
    return this.notificationRepo.find({
      relations: ['user', 'restaurantReservation'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCategory(category: string) {
    return this.notificationRepo.find({
      where: { category },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: number) {
    const notification = await this.notificationRepo.findOneBy({ id });
    if (!notification) return null;
    notification.status = 'read';
    return this.notificationRepo.save(notification);
  }

  async remove(id: number) {
    return this.notificationRepo.delete(id);
  }
}