import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
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
    private readonly configService: ConfigService,
  ) {}

  private lastEmailTs = 0;
  private emailMinIntervalMs = Number(process.env.MAILER_MIN_INTERVAL_MS || 10000);

  // 🛡️ Sistema anti-duplicados
  private recentNotifications = new Map<string, number>();
  private readonly DUPLICATE_WINDOW_MS = 3000; // 3 segundos

  private async throttleEmail() {
    const now = Date.now();
    const diff = now - this.lastEmailTs;
    if (diff < this.emailMinIntervalMs) {
      await new Promise((r) => setTimeout(r, this.emailMinIntervalMs - diff));
    }
    this.lastEmailTs = Date.now();
  }

  private async safeSendMail(payload: any, retries = 2) {
    try {
      return await this.mailerService.sendMail(payload);
    } catch (err: any) {
      const msg = String(err.message || '');
      if (msg.includes('Too many emails') && retries > 0) {
        console.warn('⏳ Límite alcanzado, reintentando en 10s...');
        await new Promise((r) => setTimeout(r, 10000));
        return this.safeSendMail(payload, retries - 1);
      }
      throw err;
    }
  }

// 🛡️ Verificar si es una notificación duplicada (robusto para RESERVATION)
private isDuplicate(dto: CreateNotificationDto): boolean {
  // Normalizador simple
  const norm = (s?: string) =>
    (s ?? '').toLowerCase().trim().replace(/\s+/g, ' ');

  // 1) Intentar obtener el id de reserva de la forma más robusta posible
  let resId = dto.restaurant_reservation_id ?? null;

  // Si no viene en el DTO, intentamos extraerlo de la URL /reservas/:id
  if (!resId && dto.reservation_url) {
    const m = dto.reservation_url.match(/\/reservas\/(\d+)(?:\/|$)/);
    if (m) resId = Number(m[1]);
  }

  // 2) Construir una clave estable
  // - Para RESERVATION: clave por (reserva + título normalizado)
  // - Si NO hay resId: añadimos parte del mensaje para estabilizar
  let key: string;

  if (dto.category === 'RESERVATION') {
    key = `RESERVATION|res:${resId ?? 'none'}|title:${norm(dto.title)}`;
    if (!resId) {
      key += `|msg:${norm(dto.message).slice(0, 120)}`;
    }
  } else {
    // Otras categorías: título + parte del mensaje
    key = `${norm(dto.category)}|title:${norm(dto.title)}|msg:${norm(dto.message).slice(0, 120)}`;
  }

  // 3) Ventana de bloqueo un poco mayor para absorber llamadas consecutivas
  const now = Date.now();
  const WINDOW_MS = 30000; // 30s

  const last = this.recentNotifications.get(key);
  if (last && now - last < WINDOW_MS) {
    console.warn('🚫 NOTIFICACIÓN DUPLICADA DETECTADA Y BLOQUEADA:', key);
    return true;
  }

  this.recentNotifications.set(key, now);

  // Limpieza básica
  if (this.recentNotifications.size > 200) {
    const oldestKey = this.recentNotifications.keys().next().value;
    this.recentNotifications.delete(oldestKey);
  }

  return false;
}



async create(dto: CreateNotificationDto) {
  try {
    // 🛡️ Bloquear cualquier envío redundante tipo EMAIL vacío de RESERVATION
    if (
      dto.category === 'RESERVATION' &&
      dto.type === 'EMAIL' &&
      !dto.toEmail
    ) {
      console.log('🚫 Ignorada notificación duplicada RESERVATION tipo EMAIL sin toEmail');
      return { success: true, message: 'Ignored duplicate EMAIL for RESERVATION' };
    }


      let saved: Notification | null = null;

      console.log('📬 === INICIANDO PROCESO DE NOTIFICACIÓN ===');
      console.log('📬 Category:', dto.category);
      console.log('📬 Type:', dto.type);
      console.log('📬 toEmail:', dto.toEmail);

      // 1️⃣ Si es PUSH: guardar en BD + emitir WebSocket + email admin + email cliente
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
        this.gateway.sendNewNotification(saved);
        console.log('✅ Notificación PUSH guardada y emitida');

        // 📧 Enviar email al ADMIN
        await this.sendEmailToAdmin(dto.title, dto.message, dto.reservation_url);

        // 📧 Si hay toEmail: enviar confirmación al CLIENTE
        if (dto.toEmail) {
          console.log('📧 Preparando email para cliente:', dto.toEmail);
          await this.sendEmailToClient(
            dto.toEmail,
            dto.title,
            dto.message,
            dto.category,
            dto.reservation_url,
          );
        }
      }

      // 2️⃣ Si es EMAIL: solo enviar al cliente (sin notificación al admin)
      else if (dto.type === 'EMAIL' && dto.toEmail) {
        console.log('📧 Enviando solo email al cliente (sin notificación al admin):', dto.toEmail);
        await this.sendEmailToClient(
          dto.toEmail,
          dto.title,
          dto.message,
          dto.category,
          dto.reservation_url,
        );
      }

     // 3️⃣ Soporte legacy para type === 'EMAIL' con user_id (solo si NO es RESERVATION)
else if (
  dto.type === 'EMAIL' &&
  !dto.toEmail &&
  dto.user_id &&
  dto.category !== 'RESERVATION'
) {
  await this.sendEmailNotificationByUserId(
    dto.user_id,
    dto.title,
    dto.message,
    dto.reservation_url,
  );
}

// 🟢 si es EMAIL sin toEmail y categoría RESERVATION → ignorar por completo
else if (
  dto.type === 'EMAIL' &&
  !dto.toEmail &&
  dto.category === 'RESERVATION'
) {
  return { success: true, message: 'Legacy email skipped for reservation' };
}

console.log('📬 === PROCESO DE NOTIFICACIÓN COMPLETADO ===\n');
return saved || { success: true, message: 'Email sent' };


      console.log('📬 === PROCESO DE NOTIFICACIÓN COMPLETADO ===\n');
      return saved || { success: true, message: 'Email sent' };
    } catch (error) {
      console.error('❌ ERROR AL CREAR NOTIFICACIÓN ===>', error);
      throw new InternalServerErrorException('Error al crear notificación');
    }
  }

  // 📧 Enviar email al ADMIN
  private async sendEmailToAdmin(
    title: string,
    message: string,
    reservationUrl?: string,
  ) {
    try {
      await this.throttleEmail();

      const adminEmail = (
        this.configService.get<string>('SMTP_ADMIN_EMAIL') ||
        'mudecoop.notificaciones.test@gmail.com'
      ).trim().toLowerCase();

      console.log(`📧 Enviando email al ADMIN: ${adminEmail}`);

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

      console.log(`✅ Email enviado exitosamente al admin: ${adminEmail}`);
    } catch (err) {
      console.error('⚠️ Error enviando email al admin:', (err as Error).message);
    }
  }

  // 📧 Enviar email al CLIENTE
  private async sendEmailToClient(
    toEmail: string,
    title: string,
    message: string,
    category: string,
    reservationUrl?: string,
  ) {
    try {
      await this.throttleEmail();

      let clientTitle = title;
      let clientMessage = message;

      // ✅ Personalizar mensajes según categoría
      if (category === 'RESERVATION') {
        if (title.toLowerCase().includes('confirmada')) {
          clientTitle = '✅ Tu reserva ha sido confirmada - MUDECOOP';
          clientMessage = '¡Excelente noticia! Tu reserva ha sido confirmada. Te esperamos con gusto. ¡Gracias por elegirnos! 💚';
        } else if (title.toLowerCase().includes('cancelada')) {
          clientTitle = '❌ Tu reserva ha sido cancelada - MUDECOOP';
          clientMessage = 'Lamentamos informarte que tu reserva ha sido cancelada. Si tienes alguna duda, no dudes en contactarnos. Esperamos verte pronto. 💚';
        } else {
          clientTitle = 'Confirmación de tu reserva - MUDECOOP';
          clientMessage = 'Hemos recibido tu reserva correctamente. Te confirmaremos los detalles próximamente. ¡Gracias por elegirnos! 💚';
        }
      } else if (category === 'ACTIVITY') {
        clientTitle = 'Gracias por contactarnos 💚';
        clientMessage = 'Hola, hemos recibido tu mensaje. Te responderemos lo antes posible.';
      }

      console.log(`📧 Enviando email al CLIENTE: ${toEmail}`);
      console.log(`📧 Asunto: ${clientTitle}`);

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

      console.log(`✅ Email de confirmación enviado exitosamente al cliente: ${toEmail}`);
    } catch (err) {
      console.error('⚠️ Error enviando email al cliente:', (err as Error).message);
    }
  }

  // 📧 Envío de correo por user_id (legacy support)
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
      if (!user) {
        console.warn(`⚠️ Usuario con ID ${userId} no encontrado`);
        return;
      }

      const { email, first_name, last_name } = user;
      const name = `${first_name ?? ''} ${last_name ?? ''}`.trim();

      console.log(`📧 Enviando correo a usuario ID ${userId}: ${email}`);

      await this.safeSendMail({
        to: email,
        subject: title,
        template: './generic-notification',
        context: { name, title, message, year: new Date().getFullYear(), reservationUrl },
        text: `${message}${reservationUrl ? ` | Ver: ${reservationUrl}` : ''}`,
      });

      console.log(`✅ Correo enviado correctamente a ${email}`);
    } catch (err) {
      console.error('⚠️ Error enviando correo (user_id):', (err as Error).message);
    }
  }

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