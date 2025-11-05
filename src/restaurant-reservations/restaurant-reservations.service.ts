import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantReservation } from './entities/restaurant-reservation.entity';
import { CreateRestaurantReservationDto } from './dto/create-restaurant-reservation.dto';
import { UpdateRestaurantReservationDto } from './dto/update-restaurant-reservation.dto';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class RestaurantReservationsService {
  constructor(
    @InjectRepository(RestaurantReservation)
    private readonly reservationRepo: Repository<RestaurantReservation>,

    @Optional()
    private readonly notificationsService?: NotificationsService,
  ) {}

  // ======================================================
  // 🟢 Crear reserva (landing o panel admin)
  // ======================================================
  async create(
    dto: CreateRestaurantReservationDto,
    _userId?: number | null,
  ): Promise<RestaurantReservation> {
    const saved = await this.reservationRepo.save(dto);

    console.log('🍽️ === RESERVA GUARDADA ===');
    console.log('🍽️ ID:', saved.id);
    console.log('🍽️ Cliente:', saved.customerName);
    console.log('🍽️ Email cliente:', saved.email);
    console.log('🍽️ Fecha:', saved.date);
    console.log('🍽️ Hora:', saved.time);

    const adminMsg = `Reserva creada por ${saved.customerName} para el ${saved.date} a las ${saved.time} (${saved.peopleCount} ${saved.peopleCount === 1 ? 'persona' : 'personas'}${saved.zone ? `, zona ${saved.zone}` : ''}).`;

    // ✅ UNA SOLA notificación que hace TODO
    const notificationPayload = {
      category: 'RESERVATION',
      title: 'Nueva reserva de restaurante', // 👈 Título más específico
      message: adminMsg,
      type: 'PUSH' as const,
      toEmail: saved.email,
      reservation_url: `https://admin.mudecoop.cr/reservas/${saved.id}`,
      restaurant_reservation_id: saved.id,
    };

    console.log('🔍 === ENVIANDO NOTIFICACIÓN ===');
    console.log('🔍 Type:', notificationPayload.type);
    console.log('🔍 toEmail:', notificationPayload.toEmail);

    await this.notificationsService?.create(notificationPayload);

    console.log('🍽️ === NOTIFICACIÓN ENVIADA ===\n');
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
  // 🔵 Confirmar / Cancelar
  // ======================================================
  async updateStatus(
    id: number,
    dto: { status: string; confirmedBy?: number },
    _userId?: number | null,
  ): Promise<RestaurantReservation> {
    const reservation = await this.findOne(id);

    console.log('📝 === ACTUALIZANDO ESTADO DE RESERVA ===');
    console.log('📝 ID:', id);
    console.log('📝 Nuevo estado:', dto.status);
    console.log('📝 Email cliente:', reservation.email);

    reservation.status = dto.status;
    if (dto.confirmedBy) {
      (reservation as any).confirmedBy = dto.confirmedBy;
    }
    const updated = await this.reservationRepo.save(reservation);

    const isConfirmed = dto.status === 'confirmed';

    // ✅ Solo enviar EMAIL al cliente (sin notificación PUSH al admin)
    if (reservation.email) {
      const notificationPayload = {
        category: 'RESERVATION',
        title: isConfirmed ? 'Reserva confirmada' : 'Reserva cancelada', // 👈 Título correcto
        message: `La reserva de ${reservation.customerName} fue ${isConfirmed ? 'confirmada' : 'cancelada'}.`,
        type: 'EMAIL' as const, // 👈 Solo EMAIL al cliente
        toEmail: reservation.email,
        reservation_url: `https://admin.mudecoop.cr/reservas/${reservation.id}`,
        restaurant_reservation_id: reservation.id,
      };

      console.log('📧 Enviando email de cambio de estado al cliente:', reservation.email);
      await this.notificationsService?.create(notificationPayload);
    }

    console.log('📝 === EMAIL DE CAMBIO ENVIADO ===\n');
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