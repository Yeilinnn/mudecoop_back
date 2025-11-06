import { Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantReservation } from './entities/restaurant-reservation.entity';
import { CreateRestaurantReservationDto } from './dto/create-restaurant-reservation.dto';
import { UpdateRestaurantReservationDto } from './dto/update-restaurant-reservation.dto';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class RestaurantReservationsService {
  // Horario de atención del restaurante
  private readonly OPENING_HOUR = 11; // 11:00 AM
  private readonly CLOSING_HOUR = 18; // 6:00 PM
  private readonly MAX_PEOPLE_PER_RESERVATION = 30;

  constructor(
    @InjectRepository(RestaurantReservation)
    private readonly reservationRepo: Repository<RestaurantReservation>,

    @Optional()
    private readonly notificationsService?: NotificationsService,
  ) {}

  // ======================================================
  // 🟢 Crear reserva con validaciones completas
  // ======================================================
async create(
  dto: CreateRestaurantReservationDto,
  _userId?: number | null,
): Promise<RestaurantReservation> {
  // ✅ Validar fecha futura
  this.validateFutureDate(dto.date);

  // ✅ Validar horario permitido
  this.validateBusinessHours(dto.time, dto.date);

  // ✅ Validar capacidad máxima
  if (dto.peopleCount > this.MAX_PEOPLE_PER_RESERVATION) {
    throw new BadRequestException(
      `La capacidad máxima por reserva es de ${this.MAX_PEOPLE_PER_RESERVATION} personas`,
    );
  }

  // ✅ Validar disponibilidad de mesa (si se especifica)
  if (dto.tableNumber) {
    await this.validateTableAvailability(
      dto.date,
      dto.time,
      dto.tableNumber,
      null, // No hay ID de reserva existente al crear
    );
  }

  // ✅ CORRECCIÓN: eliminar posible desfase de zona horaria
  const [year, month, day] = dto.date.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  const dateWithoutOffset = new Date(
    localDate.getTime() - localDate.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .split('T')[0];

  // ✅ Guardar la fecha corregida sin cambio de día
  const saved = await this.reservationRepo.save({
    ...dto,
    date: dateWithoutOffset,
  });

  console.log('🍽️ === RESERVA GUARDADA ===');
  console.log('🍽️ ID:', saved.id);
  console.log('🍽️ Cliente:', saved.customerName);
  console.log('🍽️ Email cliente:', saved.email);
  console.log('🍽️ Fecha (sin desfase):', saved.date);
  console.log('🍽️ Hora:', saved.time);
  console.log('🍽️ Zona:', saved.zone || 'N/A');
  console.log('🍽️ Mesa:', saved.tableNumber || 'N/A');

  const adminMsg = `Reserva creada por ${saved.customerName} para el ${saved.date} a las ${saved.time} (${saved.peopleCount} ${saved.peopleCount === 1 ? 'persona' : 'personas'}${saved.zone ? `, zona ${saved.zone}` : ''}${saved.tableNumber ? `, mesa ${saved.tableNumber}` : ''}).`;

  // ✅ Notificación única
  const notificationPayload = {
    category: 'RESERVATION',
    title: 'Nueva reserva de restaurante',
    message: adminMsg,
    type: 'PUSH' as const,
    toEmail: saved.email,
    reservation_url: `https://admin.mudecoop.cr/reservas/${saved.id}`,
    restaurant_reservation_id: saved.id,
  };

  await this.notificationsService?.create(notificationPayload);
  console.log('🍽️ === NOTIFICACIÓN ENVIADA ===\n');

  return saved;
}


  // ======================================================
  // 🔧 Validar que la fecha sea futura (CORREGIDO)
  // ======================================================
  private validateFutureDate(dateStr: string): void {
  // ✅ Interpretar fecha tal cual viene (YYYY-MM-DD) sin zona horaria
  const [year, month, day] = dateStr.split("-").map(Number);
  const selectedDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log("🔍 Validando fecha:", {
    recibida: dateStr,
    seleccionada: selectedDate.toDateString(),
    hoy: today.toDateString(),
  });

  if (selectedDate < today) {
    throw new BadRequestException("No se pueden hacer reservas en fechas pasadas");
  }
}


  // ======================================================
  // 🔧 Validar horario de negocio (11:00 - 18:00)
  // ======================================================
  private validateBusinessHours(timeStr: string, dateStr: string): void {
    const [hour, minute] = timeStr.split(':').map(Number);

    // Validar rango de horario general
    if (hour < this.OPENING_HOUR || hour > this.CLOSING_HOUR) {
      throw new BadRequestException(
        `Solo se pueden realizar reservas entre las ${this.OPENING_HOUR}:00 y ${this.CLOSING_HOUR}:00`,
      );
    }

    // Si es las 18:00, solo permitir 18:00 exacto (no 18:30)
    if (hour === this.CLOSING_HOUR && minute > 0) {
      throw new BadRequestException(
        `La última reserva disponible es a las ${this.CLOSING_HOUR}:00`,
      );
    }

    // Validar intervalos de media hora
    if (minute !== 0 && minute !== 30) {
      throw new BadRequestException(
        'Las reservas deben ser en intervalos de media hora (ej: 12:00, 12:30)',
      );
    }

    // Si la reserva es para HOY, validar que no sea hora pasada
    const [year, month, day] = dateStr.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate.getTime() === today.getTime()) {
      const now = new Date();
      const selectedTime = new Date(year, month - 1, day, hour, minute);
      
      if (selectedTime <= now) {
        throw new BadRequestException(
          'No se pueden hacer reservas para horas pasadas. Por favor selecciona una hora futura.',
        );
      }
    }
  }

  // ======================================================
  // 🔧 Validar disponibilidad de mesa
  // ======================================================
  private async validateTableAvailability(
    date: string,
    time: string,
    tableNumber: number,
    excludeReservationId?: number | null,
  ): Promise<void> {
    const query = this.reservationRepo
      .createQueryBuilder('res')
      .where('res.date = :date', { date })
      .andWhere('res.tableNumber = :tableNumber', { tableNumber })
      .andWhere("res.status != 'cancelled'"); // Ignorar canceladas

    // Si estamos editando, excluir la reserva actual
    if (excludeReservationId) {
      query.andWhere('res.id != :id', { id: excludeReservationId });
    }

    // Buscar conflictos en el mismo horario exacto o ±30 minutos
    const [hour, minute] = time.split(':').map(Number);
    const [year, month, day] = date.split('-').map(Number);
    const selectedTime = new Date(year, month - 1, day, hour, minute);
    const marginMinutes = 30;

    const startTime = new Date(selectedTime);
    startTime.setMinutes(startTime.getMinutes() - marginMinutes);

    const endTime = new Date(selectedTime);
    endTime.setMinutes(endTime.getMinutes() + marginMinutes);

    const formatTime = (d: Date) => {
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    query.andWhere(
      `(res.time >= :startTime AND res.time <= :endTime)`,
      {
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
      },
    );

    const conflicts = await query.getMany();

    if (conflicts.length > 0) {
      // Verificar si hay conflicto EXACTO (misma hora, mismo día, misma mesa)
      const exactMatch = conflicts.find(c => c.time === time);
      
      if (exactMatch) {
        throw new BadRequestException(
          `La mesa ${tableNumber} ya está reservada a las ${time}. Por favor selecciona otra hora o mesa.`,
        );
      }

      throw new BadRequestException(
        `La mesa ${tableNumber} ya está reservada cerca de las ${time} (±30 min). Por favor selecciona otra hora o mesa.`,
      );
    }
  }

  // ======================================================
  // 🆕 Obtener horarios disponibles para una fecha
  // ======================================================
  async getAvailableHours(date: string): Promise<string[]> {
    // Validar que la fecha sea futura
    this.validateFutureDate(date);

    const hours: string[] = [];
    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = selectedDate.getTime() === today.getTime();

    // Generar horarios de 11:00 a 18:00 cada media hora
    for (let hour = this.OPENING_HOUR; hour <= this.CLOSING_HOUR; hour++) {
      for (const minute of [0, 30]) {
        // Si es las 18:30, no incluir
        if (hour === this.CLOSING_HOUR && minute === 30) continue;

        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

        // Si es hoy, filtrar horas pasadas
        if (isToday) {
          const now = new Date();
          const timeDate = new Date(year, month - 1, day, hour, minute);
          if (timeDate <= now) continue;
        }

        hours.push(timeStr);
      }
    }

    return hours;
  }

  // ======================================================
  // 🆕 Obtener mesas disponibles para fecha/hora/zona
  // ======================================================
  async getAvailableTables(
    date: string,
    time: string,
    zone?: string,
  ): Promise<number[]> {
    // Mesas por zona (esto debería venir de una tabla en el futuro)
    const tablesByZone: Record<string, number[]> = {
      'Terraza': [1, 2, 3, 4, 5],
      'Salón Interior': [6, 7, 8, 9, 10, 11],
      'Área Privada': [12, 13, 14],
      'Zona Bar': [15, 16, 17, 18],
    };

    const allTables = zone ? tablesByZone[zone] || [] : Object.values(tablesByZone).flat();

    // Buscar mesas ocupadas en este horario (±30 min)
    const [hour, minute] = time.split(':').map(Number);
    const [year, month, day] = date.split('-').map(Number);
    const selectedTime = new Date(year, month - 1, day, hour, minute);
    const marginMinutes = 30;

    const startTime = new Date(selectedTime);
    startTime.setMinutes(startTime.getMinutes() - marginMinutes);

    const endTime = new Date(selectedTime);
    endTime.setMinutes(endTime.getMinutes() + marginMinutes);

    const formatTime = (d: Date) => {
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const occupiedReservations = await this.reservationRepo
      .createQueryBuilder('res')
      .where('res.date = :date', { date })
      .andWhere("res.status != 'cancelled'")
      .andWhere(
        `(res.time >= :startTime AND res.time <= :endTime)`,
        {
          startTime: formatTime(startTime),
          endTime: formatTime(endTime),
        },
      )
      .getMany();

    const occupiedTables = occupiedReservations
      .map(r => r.tableNumber)
      .filter(t => t !== null && t !== undefined) as number[];

    // Retornar solo mesas disponibles
    return allTables.filter(table => !occupiedTables.includes(table));
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
    const existing = await this.findOne(id);

    // Si se actualiza fecha u hora, revalidar
    if (dto.date) {
      this.validateFutureDate(dto.date);
    }

    const finalDate = dto.date || existing.date;
    const finalTime = dto.time || existing.time;

    if (dto.time) {
      this.validateBusinessHours(finalTime, finalDate);
    }

    if (dto.peopleCount && dto.peopleCount > this.MAX_PEOPLE_PER_RESERVATION) {
      throw new BadRequestException(
        `La capacidad máxima por reserva es de ${this.MAX_PEOPLE_PER_RESERVATION} personas`,
      );
    }

    // Si se actualiza la mesa, validar disponibilidad
    if (dto.tableNumber) {
      await this.validateTableAvailability(
        finalDate,
        finalTime,
        dto.tableNumber,
        id, // Excluir esta reserva de la validación
      );
    }

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

    // ✅ Solo enviar EMAIL al cliente
    if (reservation.email) {
      const notificationPayload = {
        category: 'RESERVATION',
        title: isConfirmed ? 'Reserva confirmada' : 'Reserva cancelada',
        message: `La reserva de ${reservation.customerName} fue ${isConfirmed ? 'confirmada' : 'cancelada'}.`,
        type: 'EMAIL' as const,
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