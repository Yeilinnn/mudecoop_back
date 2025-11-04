import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityReservation } from './entities/activity-reservation.entity';
import { CoopActivity } from '../activities/coop-activity/coop-activity.entity';
import { CreateActivityReservationDto } from './dto/create-activity-reservation.dto';

@Injectable()
export class ActivityReservationService {
  constructor(
    @InjectRepository(ActivityReservation)
    private readonly reservationRepo: Repository<ActivityReservation>,
    @InjectRepository(CoopActivity)
    private readonly activityRepo: Repository<CoopActivity>,
  ) {}

  async create(activityId: number, dto: CreateActivityReservationDto) {
    const activity = await this.activityRepo.findOne({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Actividad no encontrada');

    const reservation = this.reservationRepo.create({
      activity,
      ...dto,
      status: 'pending',
    });

    return this.reservationRepo.save(reservation);
  }

  async findAllByActivity(activityId: number) {
    return this.reservationRepo.find({
      where: { activity: { id: activityId } },
      relations: ['activity'],
      order: { created_at: 'DESC' },
    });
  }

  async updateStatus(id: number, status: string) {
    const reservation = await this.reservationRepo.findOne({ where: { id } });
    if (!reservation) throw new NotFoundException('Reserva no encontrada');
    reservation.status = status;
    return this.reservationRepo.save(reservation);
  }

  async remove(id: number) {
    const reservation = await this.reservationRepo.findOne({ where: { id } });
    if (!reservation) throw new NotFoundException('Reserva no encontrada');
    return this.reservationRepo.remove(reservation);
  }
}
