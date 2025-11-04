import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityReservation } from './entities/activity-reservation.entity';
import { CoopActivity } from '../activities/coop-activity/coop-activity.entity';
import { ActivityReservationService } from './activity-reservation.service';
import { ActivityReservationController } from './activity-reservation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityReservation, CoopActivity])],
  controllers: [ActivityReservationController],
  providers: [ActivityReservationService],
})
export class ActivityReservationModule {}
