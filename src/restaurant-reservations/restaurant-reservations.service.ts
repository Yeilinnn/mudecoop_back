import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantReservation } from './entities/restaurant-reservation.entity';
import { CreateRestaurantReservationDto } from './dto/create-restaurant-reservation.dto';
import { UpdateRestaurantReservationDto } from './dto/update-restaurant-reservation.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class RestaurantReservationsService {
  constructor(
    @InjectRepository(RestaurantReservation)
    private readonly reservationRepo: Repository<RestaurantReservation>,

    @Optional()
    private readonly notificationsService?: NotificationsService,

    @Optional()
    private readonly mailerService?: MailerService,
  ) {}

  // ======================================================
  // 🟢 Crear reserva (landing o panel admin)
  // Firma compatible con el controller: (dto, userId?)
  // ======================================================
  async create(
    dto: CreateRestaurantReservationDto,
    _userId?: number | null,
  ): Promise<RestaurantReservation> {
    const saved = await this.reservationRepo.save(dto);

    // Mensaje para el admin
    const adminMsg = `Reserva creada por ${saved.customerName} para el ${saved.date} a las ${saved.time} (${saved.peopleCount} ${saved.peopleCount === 1 ? 'persona' : 'personas'}${saved.zone ? `, zona ${saved.zone}` : ''}).`;

    // ✅ UNA SOLA notificación que maneja:
    // - PUSH al admin (por el type: 'PUSH')
    // - EMAIL al admin (por toEmail y type interno)
    // - EMAIL al cliente (por el customer email en saved.email)
    await this.notificationsService?.create({
      category: 'RESERVATION',
      title: 'Nueva reserva creada',
      message: adminMsg,
      type: 'PUSH', // 👈 Esto activa el PUSH y el EMAIL al admin
      toEmail: saved.email, // 👈 Esto envía confirmación al cliente
      reservation_url: `https://admin.mudecoop.cr/reservas/${saved.id}`,
      restaurant_reservation_id: saved.id,
    });

    return saved;
  }

  // ======================================================
  // 🟡 Listar todas las reservas
  // ======================================================
  async findAll(): Promise<RestaurantReservation[]> {
    return this.reservationRepo.find({
      order: { date: 'DESC', time: 'ASC' },
    });
  }

  // ======================================================
  // 🟡 Buscar por ID
  // ======================================================
  async findOne(id: number): Promise<RestaurantReservation> {
    const reservation = await this.reservationRepo.findOne({ where: { id } });
    if (!reservation) throw new NotFoundException('Reserva no encontrada');
    return reservation;
  }

  // ======================================================
  // 🟡 Actualizar datos generales
  // ======================================================
  async update(
    id: number,
    dto: UpdateRestaurantReservationDto,
  ): Promise<RestaurantReservation> {
    await this.findOne(id);
    await this.reservationRepo.update(id, dto);
    return this.findOne(id);
  }

  // ======================================================
  // 🔵 Confirmar / Cancelar (FIRMA requerida por el controller)
  // ======================================================
  async updateStatus(
    id: number,
    dto: { status: string; confirmedBy?: number },
    _userId?: number | null,
  ): Promise<RestaurantReservation> {
    const reservation = await this.findOne(id);

    reservation.status = dto.status;
    if (dto.confirmedBy) {
      (reservation as any).confirmedBy = dto.confirmedBy;
    }
    const updated = await this.reservationRepo.save(reservation);

    const isConfirmed = dto.status === 'confirmed';
    const adminMsg = isConfirmed
      ? `La reserva de ${reservation.customerName} fue confirmada para el ${reservation.date} a las ${reservation.time}.`
      : `La reserva de ${reservation.customerName} fue cancelada.`;

    // ✅ UNA SOLA notificación que maneja todo
    await this.notificationsService?.create({
      category: 'RESERVATION',
      title: `Reserva ${isConfirmed ? 'confirmada' : 'cancelada'}`,
      message: adminMsg,
      type: 'PUSH', // 👈 PUSH al admin + EMAIL al admin
      toEmail: reservation.email, // 👈 EMAIL al cliente
      reservation_url: `https://admin.mudecoop.cr/reservas/${reservation.id}`,
      restaurant_reservation_id: reservation.id,
    });

    return updated;
  }

  // ======================================================
  // 🔴 Eliminar
  // ======================================================
  async remove(id: number): Promise<void> {
    const reservation = await this.findOne(id);
    await this.reservationRepo.remove(reservation);
  }
}